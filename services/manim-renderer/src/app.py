import asyncio
import io
import os
import sys
import tempfile
import shutil
import traceback
import uuid
import subprocess
import signal
import tokenize
from pathlib import Path
from typing import Dict, Any, Optional
import threading
import time
import re
import logging

import redis
from redis.exceptions import RedisError
from dotenv import load_dotenv

from minio import Minio
from minio.commonconfig import Tags
from minio.error import S3Error

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uvicorn

load_dotenv()

PORT = os.getenv("PORT", 3004)

MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "sudar-content")
minio_client: Optional[Minio] = None

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
JOB_STATUS_TTL_SECONDS = int(os.getenv("JOB_STATUS_TTL_SECONDS", "3600"))
redis_client: Optional[redis.Redis] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage app startup and shutdown events."""
    # Startup
    global redis_client, minio_client
    create_necessary_folders()
    cleanup_old_files()
    
    # Initialize Redis
    try:
        redis_client = redis.Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_timeout=5,
            health_check_interval=30,
        )
        await asyncio.to_thread(redis_client.ping)
        logger.info("Connected to Redis for job status tracking")
    except RedisError as exc:
        redis_client = None
        logger.error("Failed to connect to Redis: %s", exc)
    
    # Initialize MinIO
    try:
        endpoint = MINIO_URL.replace("http://", "").replace("https://", "")
        minio_client = Minio(
            endpoint=endpoint,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=False
        )
        
        # Ensure bucket exists
        if not minio_client.bucket_exists(bucket_name=MINIO_BUCKET_NAME):
            minio_client.make_bucket(bucket_name=MINIO_BUCKET_NAME)
            logger.info(f"Created MinIO bucket: {MINIO_BUCKET_NAME}")
        else:
            logger.info(f"MinIO bucket exists: {MINIO_BUCKET_NAME}")
            
        logger.info("Connected to MinIO for video storage")
    except Exception as exc:
        minio_client = None
        logger.error("Failed to connect to MinIO: %s", exc)
    
    # Start periodic cleanup
    def periodic_cleanup():
        while True:
            time.sleep(3600)  # Run every hour
            cleanup_old_files()
    
    cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
    cleanup_thread.start()
    
    yield
    # Shutdown - no cleanup needed as threads are daemonic

app = FastAPI(
    title="Manim Renderer Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_dir = Path(__file__).parent  # This is src/
parent_dir = current_dir.parent      # This goes up one level from src/    
temp_dir = parent_dir / "temp"
output_dir = parent_dir / "output"

# Global variables to track running processes
running_processes: Dict[str, Dict[str, Any]] = {}
process_lock = threading.Lock()

logger = logging.getLogger(__name__)

class ManimRequest(BaseModel):
    code: str
    scene_name: Optional[str] = None
    quality: Optional[str] = "medium_quality"  # low_quality, medium_quality, high_quality
    format: Optional[str] = "mp4"  # mp4, gif
    timeout: Optional[int] = 300  # 5 minutes default timeout
    # Metadata fields for MinIO storage
    user_id: str
    chat_id: str
    classroom_id: str
    subject_id: str

class ProcessStatus(BaseModel):
    job_id: str
    status: str  # running, completed, error, timeout, cancelled
    message: str
    progress: Optional[int] = None
    output_file: Optional[str] = None
    error_details: Optional[str] = None

def upload_to_minio(
    file_path: str,
    user_id: str,
    chat_id: str,
    classroom_id: str,
    subject_id: str,
    format: str
) -> Optional[str]:
    """Upload video to MinIO storage.
    
    Returns:
        MinIO object URL on success, None on failure
    """
    if not minio_client:
        logger.error("MinIO client not initialized")
        return None
    
    try:
        # Generate filename with timestamp
        timestamp = int(time.time())
        video_filename = f"video_{timestamp}.{format}"
        
        # Construct object path: {user_id}/{classroom_id}/{subject_id}/{chat_id}/{video_filename}
        object_name = f"{user_id}/{classroom_id}/{subject_id}/{chat_id}/{video_filename}"
        
        # Prepare tags
        tags = Tags(for_object=True)
        tags["user_id"] = user_id
        tags["chat_id"] = chat_id
        tags["classroom_id"] = classroom_id
        tags["subject_id"] = subject_id
        tags["type"] = "generated_video"
        tags["timestamp"] = str(timestamp)
        
        # Determine content type
        content_type = "video/mp4" if format == "mp4" else "image/gif"
        
        # Upload to MinIO
        minio_client.fput_object(
            bucket_name=MINIO_BUCKET_NAME,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type,
            tags=tags
        )
        
        # Return MinIO URL
        minio_url = f"{MINIO_URL}/{MINIO_BUCKET_NAME}/{object_name}"
        logger.info(f"Successfully uploaded video to MinIO: {minio_url}")
        return minio_url
        
    except S3Error as e:
        logger.error(f"MinIO upload failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error during MinIO upload: {e}")
        return None

def set_job_status(job_id: str, status: str) -> None:
    """Persist job status in Redis when available."""
    if not redis_client:
        return
    try:
        redis_client.set(job_id, status, ex=JOB_STATUS_TTL_SECONDS)
    except RedisError as exc:
        logger.warning("Failed to set status for job %s: %s", job_id, exc)


async def get_job_status(job_id: str) -> Optional[str]:
    """Fetch job status from Redis asynchronously."""
    if not redis_client:
        return None
    try:
        return await asyncio.to_thread(redis_client.get, job_id)
    except RedisError as exc:
        logger.error("Failed to read status for job %s: %s", job_id, exc)
        return None


def delete_job_status(job_id: str) -> None:
    """Remove job status from Redis."""
    if not redis_client:
        return
    try:
        redis_client.delete(job_id)
    except RedisError as exc:
        logger.warning("Failed to delete status for job %s: %s", job_id, exc)


def create_necessary_folders():
    """Create necessary temp and output folders outside src directory"""
    # Create directories if they don't exist
    temp_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

def cleanup_old_files():
    """Clean up files or directories older than 1 hour"""
    current_time = time.time()
    for directory in [temp_dir, output_dir]:
        if directory.exists():
            for file_path in directory.glob("*"):
                try:
                    age = current_time - file_path.stat().st_mtime
                except FileNotFoundError:
                    continue

                if age <= 3600:
                    continue

                try:
                    if file_path.is_file():
                        file_path.unlink()
                    else:
                        shutil.rmtree(file_path, ignore_errors=True)
                except Exception:
                    pass

def _strip_strings_and_comments(code: str) -> str:
    """Remove string literals and comments so validation ignores them."""
    lines = code.splitlines(keepends=True)
    offsets = []
    total = 0
    for line in lines:
        offsets.append(total)
        total += len(line)

    def absolute(pos: tuple[int, int]) -> int:
        line, col = pos
        if line - 1 < len(offsets):
            return offsets[line - 1] + col
        return total

    ranges: list[tuple[int, int]] = []
    try:
        for token in tokenize.generate_tokens(io.StringIO(code).readline):
            if token.type in (tokenize.STRING, tokenize.COMMENT):
                start = absolute(token.start)
                end = absolute(token.end)
                ranges.append((start, end))
    except tokenize.TokenError:
        # On tokenize errors, fall back to original code
        return code

    code_chars = list(code)
    for start, end in ranges:
        for idx in range(start, min(end, len(code_chars))):
            code_chars[idx] = ' '
    return ''.join(code_chars)


def validate_manim_code(code: str) -> tuple[bool, str]:
    """Basic validation of Manim code"""
    sanitized_code = _strip_strings_and_comments(code)
    dangerous_patterns = {
        r"\bos\.system\b": "os.system",
        r"\bsubprocess\b": "subprocess",
        r"\beval\b": "eval",
        r"\bexec\b": "exec",
        r"\bopen\b": "open",
        r"\b__import__\b": "__import__",
        r"\bglobals\b": "globals",
        r"\blocals\b": "locals",
        r"\bvars\b": "vars",
        r"\bdir\b": "dir",
        r"\bgetattr\b": "getattr",
        r"\bsetattr\b": "setattr",
        r"\bdelattr\b": "delattr",
        r"\bhasattr\b": "hasattr",
    }

    for pattern, label in dangerous_patterns.items():
        if re.search(pattern, sanitized_code):
            return False, f"Potentially dangerous code detected: {label}"
    
    # Check for infinite loop patterns (basic check)
    lines = code.split('\n')
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('while True:') or stripped.startswith('while 1:'):
            # Look ahead to see if there's a break statement
            has_break = False
            for j in range(i + 1, min(i + 10, len(lines))):
                if 'break' in lines[j] or 'return' in lines[j]:
                    has_break = True
                    break
            if not has_break:
                return False, f"Potential infinite loop detected at line {i + 1}"
    
    return True, "Code validation passed"

def extract_scene_names(code: str) -> list[str]:
    """Extract scene class names from the code"""
    import re
    pattern = r'class\s+(\w+)\s*\([^)]*Scene[^)]*\):'
    matches = re.findall(pattern, code)
    return matches

def run_manim_process(job_id: str, code: str, scene_name: str, quality: str, format: str, timeout: int):
    """Run Manim rendering process"""
    job_temp_dir = temp_dir / job_id
    try:
        # Create directories
        temp_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)
        job_temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Write code to file
        code_file = job_temp_dir / "scene.py"
        with open(code_file, 'w') as f:
            f.write(code)
        
        # Update status
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info:
                job_info["status"] = "running"
                job_info["message"] = "Starting Manim rendering..."
                job_info["progress"] = 10
        
        # Prepare Manim command
        quality_map = {
            "low_quality": "-ql",
            "medium_quality": "-qm", 
            "high_quality": "-qh"
        }
        
        # Map quality settings to directory names used by Manim
        quality_dir_map = {
            "low_quality": "480p15",
            "medium_quality": "720p30", 
            "high_quality": "1080p60"
        }
        
        cmd = [
            "manim",
            quality_map.get(quality, "-qm"),
            str(code_file),
            scene_name,
            "--media_dir", str(job_temp_dir),
            "--output_file", job_id
        ]
        
        if format == "gif":
            cmd.extend(["--format", "gif"])
        
        # Update status
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info and job_info.get("status") != "cancelled":
                job_info["progress"] = 20
                job_info["message"] = "Executing Manim command..."
        
        # Run the process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=job_temp_dir,
            preexec_fn=os.setsid if hasattr(os, "setsid") else None
        )
        
        # Store process for potential termination
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info:
                job_info["process"] = process
        
        # Wait for process with timeout
        try:
            stdout, stderr = process.communicate(timeout=timeout)
            
            with process_lock:
                job_info = running_processes.get(job_id)
                if job_info and job_info.get("status") != "cancelled":
                    job_info["progress"] = 80
                    job_info["message"] = "Processing output..."
            
            if process.returncode == 0:
                # Look for output files in the job media directory
                output_files = list(job_temp_dir.glob(f"**/*.{format}"))
                if not output_files:
                    # Try legacy quality directory structure within media/videos/scene
                    quality_dir = quality_dir_map.get(quality, "720p30")
                    media_dir = job_temp_dir / "media" / "videos" / "scene" / quality_dir
                    output_files = list(media_dir.glob(f"*.{format}"))

                if output_files:
                    output_file = output_files[0]
                    
                    # Upload to MinIO instead of local storage
                    # Get metadata from job_info
                    with process_lock:
                        job_info = running_processes.get(job_id)
                        metadata = job_info.get("metadata", {})
                    
                    minio_url = upload_to_minio(
                        file_path=str(output_file),
                        user_id=metadata.get("user_id", ""),
                        chat_id=metadata.get("chat_id", ""),
                        classroom_id=metadata.get("classroom_id", ""),
                        subject_id=metadata.get("subject_id", ""),
                        format=format
                    )
                    
                    with process_lock:
                        job_info = running_processes.get(job_id)
                        if job_info and job_info.get("status") != "cancelled":
                            if minio_url:
                                job_info["status"] = "completed"
                                job_info["message"] = "Rendering completed successfully"
                                job_info["progress"] = 100
                                job_info["output_file"] = minio_url  # Store MinIO URL instead of local path
                                set_job_status(job_id, "completed")
                            else:
                                job_info["status"] = "error"
                                job_info["message"] = "Failed to upload video to storage"
                                set_job_status(job_id, "error")
                else:
                    # Debug: List all files created for troubleshooting
                    all_files = list(output_dir.glob("**/*")) + list(job_temp_dir.glob("**/*"))
                    file_list = [str(f) for f in all_files if f.is_file()]

                    with process_lock:
                        job_info = running_processes.get(job_id)
                        if job_info and job_info.get("status") != "cancelled":
                            job_info["status"] = "error"
                            job_info["message"] = "Output file not found"
                            job_info["error_details"] = f"stdout: {stdout}\nstderr: {stderr}\nFiles created: {file_list}"
                    set_job_status(job_id, "error")
            else:
                with process_lock:
                    job_info = running_processes.get(job_id)
                    if job_info and job_info.get("status") != "cancelled":
                        job_info["status"] = "error"
                        job_info["message"] = "Manim execution failed"
                        job_info["error_details"] = f"Return code: {process.returncode}\nstdout: {stdout}\nstderr: {stderr}"
                set_job_status(job_id, "error")
                    
        except subprocess.TimeoutExpired:
            # Kill the process group
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            try:
                process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
            
            with process_lock:
                job_info = running_processes.get(job_id)
                if job_info and job_info.get("status") != "cancelled":
                    job_info["status"] = "timeout"
                    job_info["message"] = f"Process timed out after {timeout} seconds"
                    job_info["error_details"] = "Execution exceeded maximum allowed time"
            set_job_status(job_id, "timeout")
    
    except Exception as e:
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info and job_info.get("status") != "cancelled":
                job_info["status"] = "error"
                job_info["message"] = "Internal error occurred"
                job_info["error_details"] = str(e) + "\n" + traceback.format_exc()
        set_job_status(job_id, "error")
    
    finally:
        # Cleanup job-specific temp directory
        shutil.rmtree(job_temp_dir, ignore_errors=True)
        
        # Remove process reference
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info and "process" in job_info:
                del job_info["process"]

        # Schedule job metadata cleanup after retention period
        def cleanup_metadata():
            time.sleep(600)  # Keep job info for 10 minutes
            with process_lock:
                running_processes.pop(job_id, None)

        threading.Thread(target=cleanup_metadata, daemon=True).start()

@app.post("/render")
async def render_manim(request: ManimRequest):
    """Submit Manim code for rendering"""
    
    # Validate code
    is_valid, validation_message = validate_manim_code(request.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail=validation_message)
    
    # Extract scene names if not provided
    if not request.scene_name:
        scene_names = extract_scene_names(request.code)
        if not scene_names:
            raise HTTPException(status_code=400, detail="No Scene class found in the code. Please provide a scene_name or ensure your code contains a class that inherits from Scene.")
        request.scene_name = scene_names[0]  # Use the first scene found
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Initialize process tracking with metadata
    with process_lock:
        running_processes[job_id] = {
            "status": "queued",
            "message": "Job queued for processing",
            "progress": 0,
            "created_at": time.time(),
            "metadata": {
                "user_id": request.user_id,
                "chat_id": request.chat_id,
                "classroom_id": request.classroom_id,
                "subject_id": request.subject_id
            }
    }

    set_job_status(job_id, "ongoing")
    
    # Schedule rendering without waiting for completion
    asyncio.create_task(
        asyncio.to_thread(
            run_manim_process,
            job_id,
            request.code,
            request.scene_name,
            request.quality,
            request.format,
            request.timeout,
        )
    )
    
    return {"job_id": job_id, "message": "Rendering job queued"}

@app.get("/status")
async def get_status(job_id: str = Query(..., description="Rendering job identifier")):
    """Get the status of a rendering job.

    Prefer in-memory details when available; otherwise fall back to Redis status.
    """
    # Try in-memory first for richer context
    with process_lock:
        job_info = running_processes.get(job_id)

    if job_info:
        # Return a subset of the detailed info
        return {
            "job_id": job_id,
            "status": job_info.get("status"),
            "message": job_info.get("message"),
            "progress": job_info.get("progress"),
            "output_file": job_info.get("output_file"),
            "error_details": job_info.get("error_details"),
        }

    # Fall back to Redis
    if not redis_client:
        raise HTTPException(status_code=503, detail="Status store unavailable")

    status = await get_job_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"job_id": job_id, "status": status}

@app.get("/status/{job_id}/stream")
async def stream_status(job_id: str):
    """Stream job status updates via SSE"""
    async def generate():
        if not redis_client:
            yield "data: {\"error\": \"Status store unavailable\"}\n\n"
            return

        while True:
            status = await get_job_status(job_id)
            if status is None:
                yield "data: {\"error\": \"Job not found\"}\n\n"
                break

            if status == "completed":
                yield "data: job completed\n\n"
                break

            # Send a keep-alive comment to prevent connection timeout
            yield ": waiting\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running job"""
    with process_lock:
        if job_id not in running_processes:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_info = running_processes[job_id]
        if job_info["status"] == "running" and "process" in job_info:
            try:
                process = job_info["process"]
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                job_info["status"] = "cancelled"
                job_info["message"] = "Job cancelled by user"
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")
        else:
            job_info["status"] = "cancelled"
            job_info["message"] = "Job cancelled by user"

        # Reflect cancellation in Redis
        set_job_status(job_id, "cancelled")
        
        # Clean up job info after a delay
        def cleanup_later():
            time.sleep(60)  # Wait 1 minute before cleanup
            with process_lock:
                if job_id in running_processes:
                    del running_processes[job_id]
            delete_job_status(job_id)
        
        threading.Thread(target=cleanup_later, daemon=True).start()
    
    return {"message": "Job cancelled successfully"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "manim-renderer"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(PORT))