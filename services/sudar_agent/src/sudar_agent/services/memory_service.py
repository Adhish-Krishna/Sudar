"""
Agent Memory Service for SUDAR Educational Assistant

This service manages conversation memory using Qdrant directly with Ollama embeddings.
Handles storage and retrieval of user and agent messages for context-aware responses.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import ollama
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue

from ..config.config import config

logger = logging.getLogger(__name__)


class AgentMemoryService:
    """
    Service for managing agent conversation memory using Qdrant + Ollama
    
    Features:
    - Two separate collections: short_term and long_term
    - Configurable embedding dimensions and model
    - User-specific memory isolation
    - Direct Qdrant storage
    """
    
    def __init__(self, user_id: str, chat_id: str):
        """
        Initialize memory service for a specific user and chat
        
        Args:
            user_id: Unique identifier for the user
            chat_id: Unique identifier for the chat session
        """
        self.user_id = user_id
        self.chat_id = chat_id
        self.embedding_model = config.EMBEDDING_MODEL
        self.embedding_dimension = config.EMBEDDING_DIMENSION
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(host=config.QDRANT_HOST, port=config.QDRANT_PORT)
        
        # Collection names
        self.short_term_collection = config.QDRANT_COLLECTION_SHORT_TERM
        self.long_term_collection = config.QDRANT_COLLECTION_LONG_TERM
        
        # Ensure collections exist
        self._ensure_collections()
        
        logger.info(f"AgentMemoryService initialized for user: {user_id}, chat: {chat_id}")
    
    def _ensure_collections(self) -> None:
        """Ensure both short_term and long_term collections exist with correct dimensions."""
        collections = [self.short_term_collection, self.long_term_collection]
        
        for collection_name in collections:
            try:
                collection_info = self.qdrant_client.get_collection(collection_name)
                current_dimension = collection_info.config.params.vectors.size
                
                if current_dimension != self.embedding_dimension:
                    logger.warning(
                        f"Dimension mismatch in '{collection_name}': "
                        f"expected {self.embedding_dimension}, found {current_dimension}. "
                        f"Recreating collection..."
                    )
                    self.qdrant_client.delete_collection(collection_name)
                    self._create_collection(collection_name)
            except Exception:
                logger.info(f"Creating new collection '{collection_name}'")
                self._create_collection(collection_name)
    
    def _create_collection(self, collection_name: str) -> None:
        """Create a new Qdrant collection with specified dimensions."""
        self.qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=self.embedding_dimension,
                distance=Distance.COSINE
            )
        )
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Ollama."""
        ollama_client = ollama.Client(host=config.OLLAMA_BASE_URL)
        response = ollama_client.embeddings(
            model=self.embedding_model,
            prompt=text
        )
        return response['embedding']
    
    def add_message(
        self,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        collection: str = "short_term"
    ) -> str:
        """
        Add a message to memory
        
        Args:
            role: Role of the message sender (user, agent, etc.)
            content: The message content
            metadata: Optional additional metadata
            collection: Collection to store in ('short_term' or 'long_term')
        
        Returns:
            ID of the stored message
        """
        collection_name = (
            self.short_term_collection if collection == "short_term" 
            else self.long_term_collection
        )
        
        # Generate embedding
        embedding = self._generate_embedding(content)
        
        # Create payload
        payload = {
            "user_id": self.user_id,
            "chat_id": self.chat_id,
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            **(metadata or {})
        }
        
        # Generate unique ID
        point_id = str(uuid.uuid4())
        
        # Store in Qdrant
        self.qdrant_client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
            ]
        )
        
        logger.debug(f"Added {role} message to {collection} memory: {content[:50]}...")
        return point_id
    
    def get_relevant_context(
        self,
        query: str,
        limit: int = 5,
        collection: str = "short_term",
        score_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant context from memory based on semantic search
        
        Args:
            query: The query to search for
            limit: Maximum number of results
            collection: Collection to search in
            score_threshold: Minimum similarity score
        
        Returns:
            List of relevant memory entries
        """
        collection_name = (
            self.short_term_collection if collection == "short_term"
            else self.long_term_collection
        )
        
        # Generate query embedding
        query_embedding = self._generate_embedding(query)
        
        # Search in Qdrant
        results = self.qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            query_filter=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=self.user_id)),
                    FieldCondition(key="chat_id", match=MatchValue(value=self.chat_id))
                ]
            ),
            limit=limit,
            score_threshold=score_threshold
        )
        
        return [
            {
                "id": result.id,
                "score": result.score,
                **result.payload
            }
            for result in results
        ]
    
    def format_context_for_prompt(self, memories: List[Dict[str, Any]]) -> str:
        """Format memory entries for inclusion in a prompt."""
        if not memories:
            return ""
        
        context_parts = ["Previous Conversation Context:"]
        for memory in memories:
            role = memory.get("role", "unknown")
            content = memory.get("content", "")
            context_parts.append(f"{role.capitalize()}: {content}")
        
        return "\n".join(context_parts)
