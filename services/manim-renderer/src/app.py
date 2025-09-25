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
import json
import re

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Manim Renderer Service", version="1.0.0")

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

class ManimRequest(BaseModel):
    code: str
    scene_name: Optional[str] = None
    quality: Optional[str] = "medium_quality"  # low_quality, medium_quality, high_quality
    format: Optional[str] = "mp4"  # mp4, gif
    timeout: Optional[int] = 300  # 5 minutes default timeout

class ProcessStatus(BaseModel):
    job_id: str
    status: str  # running, completed, error, timeout, cancelled
    message: str
    progress: Optional[int] = None
    output_file: Optional[str] = None
    error_details: Optional[str] = None

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

async def run_manim_process(job_id: str, code: str, scene_name: str, quality: str, format: str, timeout: int):
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
                    final_output = output_dir / f"{job_id}.{format}"
                    shutil.copy(output_file, final_output)

                    with process_lock:
                        job_info = running_processes.get(job_id)
                        if job_info and job_info.get("status") != "cancelled":
                            job_info["status"] = "completed"
                            job_info["message"] = "Rendering completed successfully"
                            job_info["progress"] = 100
                            job_info["output_file"] = str(final_output)
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
            else:
                with process_lock:
                    job_info = running_processes.get(job_id)
                    if job_info and job_info.get("status") != "cancelled":
                        job_info["status"] = "error"
                        job_info["message"] = "Manim execution failed"
                        job_info["error_details"] = f"Return code: {process.returncode}\nstdout: {stdout}\nstderr: {stderr}"
                    
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
    
    except Exception as e:
        with process_lock:
            job_info = running_processes.get(job_id)
            if job_info and job_info.get("status") != "cancelled":
                job_info["status"] = "error"
                job_info["message"] = "Internal error occurred"
                job_info["error_details"] = str(e) + "\n" + traceback.format_exc()
    
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
async def render_manim(request: ManimRequest, background_tasks: BackgroundTasks):
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
    
    # Initialize process tracking
    with process_lock:
        running_processes[job_id] = {
            "status": "queued",
            "message": "Job queued for processing",
            "progress": 0,
            "created_at": time.time()
        }
    
    # Start background task
    background_tasks.add_task(
        run_manim_process,
        job_id,
        request.code,
        request.scene_name,
        request.quality,
        request.format,
        request.timeout
    )
    
    return {"job_id": job_id, "message": "Rendering job submitted successfully"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """Get the status of a rendering job"""
    with process_lock:
        if job_id not in running_processes:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_info = running_processes[job_id].copy()
        # Remove process reference from response
        if "process" in job_info:
            del job_info["process"]
        
        return ProcessStatus(job_id=job_id, **job_info)

@app.get("/status/{job_id}/stream")
async def stream_status(job_id: str):
    """Stream job status updates via SSE"""
    
    async def generate():
        last_status = None
        while True:
            with process_lock:
                if job_id not in running_processes:
                    yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                    break
                
                current_status = running_processes[job_id].copy()
                if "process" in current_status:
                    del current_status["process"]
            
            # Only send update if status changed
            if current_status != last_status:
                yield f"data: {json.dumps(current_status)}\n\n"
                last_status = current_status.copy()
            
            # Stop streaming if job is completed, error, or timeout
            if current_status["status"] in ["completed", "error", "timeout"]:
                break
            
            await asyncio.sleep(1)
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

@app.get("/download/{job_id}")
async def download_result(job_id: str):
    """Download the rendered video"""
    with process_lock:
        if job_id not in running_processes:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job_info = running_processes[job_id]
        if job_info["status"] != "completed":
            raise HTTPException(status_code=400, detail="Job not completed yet")
        
        output_file = job_info.get("output_file")
        if not output_file or not os.path.exists(output_file):
            raise HTTPException(status_code=404, detail="Output file not found")
    
    return FileResponse(
        output_file,
        media_type="application/octet-stream",
        filename=f"manim_output_{job_id}.{Path(output_file).suffix[1:]}"
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
        
        # Clean up job info after a delay
        def cleanup_later():
            time.sleep(60)  # Wait 1 minute before cleanup
            with process_lock:
                if job_id in running_processes:
                    del running_processes[job_id]
        
        threading.Thread(target=cleanup_later, daemon=True).start()
    
    return {"message": "Job cancelled successfully"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "manim-renderer"}

@app.on_event("startup")
async def startup_event():
    """Create necessary folders in the startup"""
    create_necessary_folders()

    """Cleanup old files on startup"""
    cleanup_old_files()
    
    # Start periodic cleanup
    def periodic_cleanup():
        while True:
            time.sleep(3600)  # Run every hour
            cleanup_old_files()
    
    threading.Thread(target=periodic_cleanup, daemon=True).start()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)