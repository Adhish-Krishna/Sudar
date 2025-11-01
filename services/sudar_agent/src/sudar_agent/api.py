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
from .auth_dependency import get_current_user, verify_user_access
from .database import get_db
from .services.chat_service import ChatService

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
    subject_id: Optional[str] = None
    query: str


class ChatResponse(BaseModel):
    user_id: str
    chat_id: str
    subject_id: Optional[str] = None
    response: str


class ChatHistoryResponse(BaseModel):
    user_id: str
    chat_id: str
    subject_id: Optional[str] = None
    messages: list


class DeleteChatResponse(BaseModel):
    user_id: str
    chat_id: str
    subject_id: Optional[str] = None
    deleted_count: int
    message: str


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

FRONTEND_URL = config.FRONTEND_URL

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
    allow_origins=[FRONTEND_URL],  # Configure appropriately for production
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
        request: Chat request containing user_id, chat_id, subject_id, and query
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
    
        logger.info(
            f"Received chat request from user: {request.user_id}, "
            f"chat: {request.chat_id}, subject: {request.subject_id}"
        )
        
        # Create orchestrator
        orchestrator = SudarAgentOrchestrator(
            user_id=request.user_id,
            chat_id=request.chat_id,
            subject_id=request.subject_id
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
        request: Chat request containing user_id, chat_id, subject_id, and query
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
        
        logger.info(
            f"Received sync chat request from user: {request.user_id}, "
            f"chat: {request.chat_id}, classroom: {request.subject_id}"
        )
        
        # Create orchestrator
        orchestrator = SudarAgentOrchestrator(
            user_id=request.user_id,
            chat_id=request.chat_id,
            subject_id=request.subject_id
        )
        
        # Process query
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, orchestrator.process_query, request.query)
        
        return ChatResponse(
            user_id=request.user_id,
            chat_id=request.chat_id,
            subject_id=request.subject_id,
            response=result
        )
        
    except Exception as e:
        logger.error(f"Error in sync chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chat/history/{user_id}/{chat_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    user_id: str,
    chat_id: str,
    subject_id: Optional[str] = None,
    limit: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat history for a specific chat.
    
    Retrieves all messages for a given chat_id and user_id, optionally filtered by subject_id.
    Requires JWT authentication via Bearer token.
    
    Args:
        user_id: User identifier
        chat_id: Chat session identifier
        subject_id: Optional subject identifier to filter messages
        limit: Optional limit on number of messages to retrieve
        current_user: Authenticated user information from JWT token
        db: Database session for verification
        
    Returns:
        ChatHistoryResponse: List of chat messages sorted by timestamp
        
    Raises:
        HTTPException 401: If authentication fails
        HTTPException 403: If user_id doesn't match authenticated user
        HTTPException 500: If retrieval fails
    """
    try:
        # Verify user has permission to access this chat
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        logger.info(
            f"Retrieving chat history for user: {user_id}, "
            f"chat: {chat_id}, subject: {subject_id}"
        )
        
        # Get chat service and retrieve history
        chat_service = ChatService()
        messages = chat_service.get_chat_history(
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id,
            limit=limit
        )
        chat_service.close()
        
        return ChatHistoryResponse(
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id,
            messages=messages
        )
        
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chat/list/{user_id}")
async def list_user_chats(
    user_id: str,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all unique chats for a user, optionally filtered by subject.
    
    Returns a list of unique chat_ids for the given user_id and optional subject_id.
    Requires JWT authentication via Bearer token.
    
    Args:
        user_id: User identifier
        subject_id: Optional subject identifier to filter chats
        current_user: Authenticated user information from JWT token
        db: Database session for verification
        
    Returns:
        dict: List of unique chat_ids with metadata (latest message timestamp, message count)
        
    Raises:
        HTTPException 401: If authentication fails
        HTTPException 403: If user_id doesn't match authenticated user
        HTTPException 500: If retrieval fails
    """
    try:
        # Verify user has permission to access these chats
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        logger.info(
            f"Listing chats for user: {user_id}, subject: {subject_id}"
        )
        
        # Get chat service
        chat_service = ChatService()
        
        # Build query
        query = {"user_id": user_id}
        if subject_id:
            query["subject_id"] = subject_id
        
        # Aggregate to get unique chat_ids with metadata
        pipeline = [
            {"$match": query},
            {
                "$group": {
                    "_id": "$chat_id",
                    "latest_timestamp": {"$max": "$timestamp"},
                    "message_count": {"$sum": 1},
                    "subject_id": {"$first": "$subject_id"}
                }
            },
            {"$sort": {"latest_timestamp": -1}}
        ]
        
        chats = list(chat_service.collection.aggregate(pipeline))
        chat_service.close()
        
        # Format response
        formatted_chats = [
            {
                "chat_id": chat["_id"],
                "subject_id": chat.get("subject_id"),
                "latest_timestamp": chat["latest_timestamp"].isoformat(),
                "message_count": chat["message_count"]
            }
            for chat in chats
        ]
        
        return {
            "user_id": user_id,
            "subject_id": subject_id,
            "chats": formatted_chats,
            "total_chats": len(formatted_chats)
        }
        
    except Exception as e:
        logger.error(f"Error listing user chats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/chat/{user_id}/{chat_id}", response_model=DeleteChatResponse)
async def delete_chat(
    user_id: str,
    chat_id: str,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all messages for a specific chat.
    
    Deletes all messages for the given chat_id and user_id, optionally filtered by subject_id.
    Requires JWT authentication via Bearer token.
    
    Args:
        user_id: User identifier
        chat_id: Chat session identifier to delete
        subject_id: Optional subject identifier to filter deletion
        current_user: Authenticated user information from JWT token
        db: Database session for verification
        
    Returns:
        DeleteChatResponse: Confirmation with number of deleted messages
        
    Raises:
        HTTPException 401: If authentication fails
        HTTPException 403: If user_id doesn't match authenticated user
        HTTPException 500: If deletion fails
    """
    try:
        # Verify user has permission to delete this chat
        verify_user_access(
            request_user_id=user_id,
            token_user_id=current_user["user_id"]
        )
        
        logger.info(
            f"Deleting chat for user: {user_id}, "
            f"chat: {chat_id}, subject: {subject_id}"
        )
        
        # Get chat service and delete chat
        chat_service = ChatService()
        deleted_count = chat_service.delete_chat(
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id
        )
        chat_service.close()
        
        return DeleteChatResponse(
            user_id=user_id,
            chat_id=chat_id,
            subject_id=subject_id,
            deleted_count=deleted_count,
            message=f"Successfully deleted {deleted_count} messages"
        )
        
    except Exception as e:
        logger.error(f"Error deleting chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info"
    )
