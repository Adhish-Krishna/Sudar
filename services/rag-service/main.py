"""
RAG Microservice - FastAPI application for document ingestion and retrieval
"""
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

from src.DocumentParser import DocumentParser
from src.Chunker import Chunker
from src.Embedder import Embedder
from src.Retriever import Retriever
from src.MinIOStorage import MinIOStorage
from src.database import get_db
from src.auth_dependency import (
    get_current_user,
    verify_user_access,
    verify_classroom_access
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG Microservice",
    description="A microservice for document ingestion and context retrieval using RAG",
    version="1.0.0",
    root_path='/rag'
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
document_parser = DocumentParser()

# Initialize recursive text splitter chunker
# chunk_size=1000: target chunk size in characters
# chunk_overlap=200: overlap between chunks for context preservation
chunker = Chunker(chunk_size=1000, chunk_overlap=200)

embedder = Embedder()
retriever = Retriever()

# Initialize MinIO storage
MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "rag-documents")

# Parse MinIO endpoint (remove http:// or https://)
minio_endpoint = MINIO_URL.replace("http://", "").replace("https://", "")
minio_secure = MINIO_URL.startswith("https://")

minio_storage = MinIOStorage(
    endpoint=minio_endpoint,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    bucket_name=MINIO_BUCKET_NAME,
    secure=minio_secure
)


# Pydantic models for request/response
class IngestResponse(BaseModel):
    status: str
    message: str
    inserted_count: int
    user_id: str
    chat_id: str
    classroom_id: Optional[str] = None
    filename: str
    minio_upload: Optional[dict] = None


class RetrievalRequest(BaseModel):
    query: str
    user_id: str
    chat_id: str
    classroom_id: Optional[str] = None
    top_k: int = 5
    filenames: Optional[List[str]] = None  # Optional list of filenames to filter by


class RetrievalResponse(BaseModel):
    status: str
    query: str
    user_id: str
    chat_id: str
    classroom_id: Optional[str] = None
    results: List[dict]
    count: int


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "RAG Microservice",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "qdrant": "connected",
            "ollama": "connected"
        }
    }


@app.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    chat_id: str = Form(...),
    classroom_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ingest a document: parse, chunk, embed, and store in Qdrant.
    Requires authentication via cookie.
    
    Args:
        file: Uploaded file (PDF, DOCX, PPTX, XLSX, MD, TXT)
        user_id: User identifier
        chat_id: Chat/conversation identifier
        classroom_id: Optional classroom identifier
        current_user: Authenticated user from cookie
        db: Database session
    
    Returns:
        IngestResponse with status and details
    """
    try:
        # Verify user has permission to access this data
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        # Verify classroom access if classroom_id is provided
        if classroom_id:
            verify_classroom_access(
                user_id=current_user["user_id"],
                classroom_id=classroom_id,
                db=db
            )
        
        # Read file content
        file_content = await file.read()
        filename = file.filename
        
        # Upload file to MinIO
        minio_result = minio_storage.upload_file(
            file_content=file_content,
            filename=filename,
            user_id=user_id,
            chat_id=chat_id,
            classroom_id=classroom_id,
            content_type=file.content_type
        )
        
        if not minio_result.get("success"):
            print(f"Warning: MinIO upload failed - {minio_result.get('error')}")
        
        # Step 1: Parse document to markdown
        try:
            markdown_content = document_parser.parse(file_content, filename)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error parsing document: {str(e)}"
            )
        
        # Step 2: Chunk the markdown content
        try:
            chunks = chunker.chunk(markdown_content)
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error chunking document: {str(e)}"
            )
        
        if not chunks:
            raise HTTPException(
                status_code=400, 
                detail="No content could be extracted from the document"
            )
        
        # Step 3: Embed and store chunks
        try:
            result = embedder.embed_and_store(
                chunks=chunks,
                user_id=user_id,
                chat_id=chat_id,
                classroom_id=classroom_id,
                metadata={"filename": filename}
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error embedding and storing chunks: {str(e)}"
            )
        
        return IngestResponse(
            status=result["status"],
            message=result["message"],
            inserted_count=result["inserted_count"],
            user_id=user_id,
            chat_id=chat_id,
            classroom_id=classroom_id,
            filename=filename,
            minio_upload=minio_result if minio_result.get("success") else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )


@app.post("/retrieve", response_model=RetrievalResponse)
async def retrieve_context(
    request: RetrievalRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve relevant context chunks based on a query.
    Requires authentication via cookie.
    
    Args:
        request: RetrievalRequest with query, user_id, chat_id, top_k, and optional filenames
        current_user: Authenticated user from cookie
        db: Database session
    
    Returns:
        RetrievalResponse with retrieved chunks
    """
    try:
        # Verify user has permission to access this data
        verify_user_access(
            request_user_id=request.user_id,
            token_user_id=current_user["user_id"]
        )
        
        # Verify classroom access if classroom_id is provided
        if request.classroom_id:
            verify_classroom_access(
                user_id=current_user["user_id"],
                classroom_id=request.classroom_id,
                db=db
            )
        
        # Retrieve relevant chunks
        results = retriever.retrieve(
            query=request.query,
            user_id=request.user_id,
            chat_id=request.chat_id,
            classroom_id=request.classroom_id,
            top_k=request.top_k,
            filenames=request.filenames
        )
        
        return RetrievalResponse(
            status="success",
            query=request.query,
            user_id=request.user_id,
            chat_id=request.chat_id,
            classroom_id=request.classroom_id,
            results=results,
            count=len(results)
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving context: {str(e)}"
        )


@app.delete("/delete/{user_id}/{chat_id}")
async def delete_chat_data(
    user_id: str,
    chat_id: str,
    classroom_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all data for a specific user and chat.
    Requires authentication via cookie.
    
    Args:
        user_id: User identifier
        chat_id: Chat/conversation identifier
        classroom_id: Optional classroom identifier for filtering
        current_user: Authenticated user from cookie
        db: Database session
    
    Returns:
        Deletion status
    """
    try:
        # Verify user has permission to access this data
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        # Verify classroom access if classroom_id is provided
        if classroom_id:
            verify_classroom_access(
                user_id=current_user["user_id"],
                classroom_id=classroom_id,
                db=db
            )
        
        result = embedder.delete_by_chat(user_id, chat_id, classroom_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting chat data: {str(e)}"
        )


@app.get("/list/{user_id}/{chat_id}")
async def list_chat_chunks(
    user_id: str, 
    chat_id: str, 
    classroom_id: Optional[str] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all chunks for a specific user and chat.
    Requires authentication via cookie.
    
    Args:
        user_id: User identifier
        chat_id: Chat/conversation identifier
        classroom_id: Optional classroom identifier for filtering
        limit: Maximum number of chunks to return
        current_user: Authenticated user from cookie
        db: Database session
    
    Returns:
        List of chunks with metadata
    """
    try:
        # Verify user has permission to access this data
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        # Verify classroom access if classroom_id is provided
        if classroom_id:
            verify_classroom_access(
                user_id=current_user["user_id"],
                classroom_id=classroom_id,
                db=db
            )
        
        chunks = retriever.retrieve_all_for_chat(user_id, chat_id, classroom_id, limit)
        return {
            "status": "success",
            "user_id": user_id,
            "chat_id": chat_id,
            "classroom_id": classroom_id,
            "chunks": chunks,
            "count": len(chunks)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error listing chunks: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(app, host=host, port=port)
