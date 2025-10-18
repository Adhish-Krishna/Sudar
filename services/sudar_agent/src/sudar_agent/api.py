"""FastAPI server for Sudar Agent with SSE streaming support."""

import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .orchestrator import SudarAgentOrchestrator
from .config.config import config
from .auth_dependency import get_current_user, verify_user_access, verify_classroom_access
from .database import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Pydantic models
class ChatRequest(BaseModel):
    user_id: str
    chat_id: str
    classroom_id: Optional[str] = None
    query: str


class ChatResponse(BaseModel):
    user_id: str
    chat_id: str
    classroom_id: Optional[str] = None
    response: str


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Sudar Agent Service...")
    logger.info(f"Model Provider: {config.MODEL_PROVIDER}")
    logger.info(f"RAG Service: {config.RAG_SERVICE_URL}")
    logger.info(f"MCP Tools: {config.MCP_TOOLS_URL}")
    logger.info(f"MongoDB: {config.MONGODB_URL}")
    yield
    logger.info("Shutting down Sudar Agent Service...")


# Initialize FastAPI app
app = FastAPI(
    title="Sudar Agent Service",
    description="AI Agent service for educational assistance using CrewAI",
    version="1.0.0",
    lifespan=lifespan,
    root_path='/agent'
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "Sudar Agent Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_provider": config.MODEL_PROVIDER,
        "services": {
            "rag_service": config.RAG_SERVICE_URL,
            "mcp_tools": config.MCP_TOOLS_URL,
            "mongodb": config.MONGODB_URL,
            "qdrant": f"{config.QDRANT_HOST}:{config.QDRANT_PORT}"
        }
    }


async def generate_sse_stream(orchestrator: SudarAgentOrchestrator, query: str):
    """
    Generate Server-Sent Events stream for agent responses.
    
    Note: This is a simplified version. Full streaming would require
    integrating with CrewAI's streaming capabilities at a deeper level.
    For now, we'll stream the final response character by character.
    """
    try:
        # Send start event
        yield f"data: {{'type': 'start', 'content': 'Processing query...'}}\n\n"
        
        # Process the query (this runs synchronously)
        # In a production setup, you'd want to run this in a thread pool
        # and stream incremental outputs from CrewAI
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, orchestrator.process_query, query)
        
        # Stream the result token by token (simulated)
        # TODO: Integrate with CrewAI's actual streaming when available
        words = result.split()
        for i, word in enumerate(words):
            token = word + (" " if i < len(words) - 1 else "")
            yield f"data: {{'type': 'token', 'content': '{token}'}}\n\n"
            await asyncio.sleep(0.01)  # Small delay for streaming effect
        
        # Send completion event
        yield f"data: {{'type': 'done', 'content': ''}}\n\n"
        
    except Exception as e:
        logger.error(f"Error in SSE stream: {str(e)}", exc_info=True)
        yield f"data: {{'type': 'error', 'content': 'Error: {str(e)}'}}\n\n"


@app.post("/api/chat")
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Chat endpoint with SSE streaming.
    
    Streams the agent's response using Server-Sent Events.
    Requires JWT authentication via Bearer token.
    
    Args:
        request: Chat request containing user_id, chat_id, classroom_id, and query
        current_user: Authenticated user information from JWT token
        db: Database session for classroom verification
        
    Returns:
        StreamingResponse: Server-Sent Events stream with agent responses
        
    Raises:
        HTTPException 401: If authentication fails
        HTTPException 403: If user_id doesn't match authenticated user or no classroom access
        HTTPException 500: If processing fails
    """
    try:
        # Verify user has permission to make this request
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
        
        logger.info(
            f"Received chat request from user: {request.user_id}, "
            f"chat: {request.chat_id}, classroom: {request.classroom_id}"
        )
        
        # Create orchestrator
        orchestrator = SudarAgentOrchestrator(
            user_id=request.user_id,
            chat_id=request.chat_id,
            classroom_id=request.classroom_id
        )
        
        # Return SSE stream
        return StreamingResponse(
            generate_sse_stream(orchestrator, request.query),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/sync", response_model=ChatResponse)
async def chat_sync(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronous chat endpoint (non-streaming).
    
    Returns the complete response at once.
    Requires JWT authentication via Bearer token.
    
    Args:
        request: Chat request containing user_id, chat_id, classroom_id, and query
        current_user: Authenticated user information from JWT token
        db: Database session for classroom verification
        
    Returns:
        ChatResponse: Complete agent response
        
    Raises:
        HTTPException 401: If authentication fails
        HTTPException 403: If user_id doesn't match authenticated user or no classroom access
        HTTPException 500: If processing fails
    """
    try:
        # Verify user has permission to make this request
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
        
        logger.info(
            f"Received sync chat request from user: {request.user_id}, "
            f"chat: {request.chat_id}, classroom: {request.classroom_id}"
        )
        
        # Create orchestrator
        orchestrator = SudarAgentOrchestrator(
            user_id=request.user_id,
            chat_id=request.chat_id,
            classroom_id=request.classroom_id
        )
        
        # Process query
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, orchestrator.process_query, request.query)
        
        return ChatResponse(
            user_id=request.user_id,
            chat_id=request.chat_id,
            classroom_id=request.classroom_id,
            response=result
        )
        
    except Exception as e:
        logger.error(f"Error in sync chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info"
    )
