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

logger = logging.getLogger(__name__)


class AgentMemoryService:
    """
    Service for managing agent conversation memory using Qdrant + Ollama
    
    Features:
    - Two separate collections: short_term and long_term
    - Configurable embedding dimensions and model
    - User-specific memory isolation
    - Direct Qdrant storage without Mem0
    """
    
    def __init__(
        self, 
        user_id: str,
        embedding_model: str = "embeddinggemma:300m",
        embedding_dimension: int = 768,
        qdrant_host: str = "localhost",
        qdrant_port: int = 6333
    ):
        """
        Initialize memory service for a specific user
        
        Args:
            user_id: Unique identifier for the user
            embedding_model: Ollama embedding model to use (default: embeddinggemma:300m)
            embedding_dimension: Dimension of the embedding vectors (default: 768 for embeddinggemma:300m)
            qdrant_host: Qdrant server host (default: localhost)
            qdrant_port: Qdrant server port (default: 6333)
        """
        self.user_id = user_id
        self.embedding_model = embedding_model
        self.embedding_dimension = embedding_dimension
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(host=qdrant_host, port=qdrant_port)
        
        # Collection names
        self.short_term_collection = "sudar_short_term_memory"
        self.long_term_collection = "sudar_long_term_memory"
        
        # Ensure collections exist
        self._ensure_collections()
        
        logger.info(f"AgentMemoryService initialized for user: {user_id}")
        logger.info(f"Using embedding model: {embedding_model} (dimension: {embedding_dimension})")
    
    def _ensure_collections(self) -> None:
        """
        Ensure both short_term and long_term collections exist with correct dimensions
        """
        collections = [self.short_term_collection, self.long_term_collection]
        
        for collection_name in collections:
            try:
                # Check if collection exists
                collection_info = self.qdrant_client.get_collection(collection_name)
                current_dimension = collection_info.config.params.vectors.size
                
                # If dimension mismatch, recreate collection
                if current_dimension != self.embedding_dimension:
                    logger.warning(
                        f"Dimension mismatch in '{collection_name}': "
                        f"expected {self.embedding_dimension}, found {current_dimension}. "
                        f"Recreating collection..."
                    )
                    self.qdrant_client.delete_collection(collection_name)
                    self._create_collection(collection_name)
                else:
                    logger.info(f"Collection '{collection_name}' exists with correct dimension: {self.embedding_dimension}")
                    
            except Exception as e:
                # Collection doesn't exist, create it
                logger.info(f"Creating new collection '{collection_name}' with dimension {self.embedding_dimension}")
                self._create_collection(collection_name)
    
    def _create_collection(self, collection_name: str) -> None:
        """
        Create a new Qdrant collection with specified dimensions
        
        Args:
            collection_name: Name of the collection to create
        """
        self.qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=self.embedding_dimension,
                distance=Distance.COSINE
            )
        )
        logger.info(f"Created collection '{collection_name}' with dimension {self.embedding_dimension}")
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embeddings using Ollama
        
        Args:
            text: Text to generate embeddings for
            
        Returns:
            List of embedding values
        """
        try:
            response = ollama.embeddings(
                model=self.embedding_model,
                prompt=text
            )
            return response['embedding']
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def add_user_message(
        self, 
        message: str, 
        metadata: Optional[Dict[str, Any]] = None,
        collection: str = "short_term"
    ) -> str:
        """
        Store a user message in memory
        
        Args:
            message: The user's message
            metadata: Additional metadata to store with the message
            collection: Which collection to store in ("short_term" or "long_term")
            
        Returns:
            The ID of the stored point
        """
        try:
            # Generate embedding
            embedding = self._generate_embedding(message)
            
            # Create point ID
            point_id = str(uuid.uuid4())
            
            # Prepare payload
            payload = {
                "user_id": self.user_id,
                "role": "user",
                "content": message,
                "timestamp": datetime.utcnow().isoformat(),
                **(metadata or {})
            }
            
            # Determine collection
            collection_name = (
                self.short_term_collection 
                if collection == "short_term" 
                else self.long_term_collection
            )
            
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
            
            logger.info(f"User message stored in {collection}: {message[:50]}...")
            return point_id
            
        except Exception as e:
            logger.error(f"Failed to store user message: {e}")
            raise
    
    def add_agent_message(
        self, 
        message: str, 
        metadata: Optional[Dict[str, Any]] = None,
        collection: str = "short_term"
    ) -> str:
        """
        Store an agent response in memory
        
        Args:
            message: The agent's response
            metadata: Additional metadata to store with the response
            collection: Which collection to store in ("short_term" or "long_term")
            
        Returns:
            The ID of the stored point
        """
        try:
            # Generate embedding
            embedding = self._generate_embedding(message)
            
            # Create point ID
            point_id = str(uuid.uuid4())
            
            # Prepare payload
            payload = {
                "user_id": self.user_id,
                "role": "assistant",
                "content": message,
                "timestamp": datetime.utcnow().isoformat(),
                **(metadata or {})
            }
            
            # Determine collection
            collection_name = (
                self.short_term_collection 
                if collection == "short_term" 
                else self.long_term_collection
            )
            
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
            
            logger.info(f"Agent message stored in {collection}: {message[:50]}...")
            return point_id
            
        except Exception as e:
            logger.error(f"Failed to store agent message: {e}")
            raise
    
    def add_conversation_exchange(
        self, 
        user_message: str, 
        agent_message: str,
        metadata: Optional[Dict[str, Any]] = None,
        collection: str = "short_term"
    ) -> Dict[str, str]:
        """
        Store a complete conversation exchange (user + agent)
        
        Args:
            user_message: The user's message
            agent_message: The agent's response
            metadata: Additional metadata to store
            collection: Which collection to store in ("short_term" or "long_term")
            
        Returns:
            Dictionary with user_id and agent_id of stored points
        """
        user_id = self.add_user_message(user_message, metadata, collection)
        agent_id = self.add_agent_message(agent_message, metadata, collection)
        
        logger.info(f"Conversation exchange stored in {collection}")
        return {"user_id": user_id, "agent_id": agent_id}
    
    def get_relevant_context(
        self, 
        query: str, 
        limit: int = 5,
        collection: str = "short_term",
        score_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant memories based on a query using semantic search
        
        Args:
            query: The query to search for relevant context
            limit: Maximum number of memories to retrieve
            collection: Which collection to search ("short_term" or "long_term")
            score_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of relevant memory items with content and metadata
        """
        try:
            # Generate query embedding
            query_embedding = self._generate_embedding(query)
            
            # Determine collection
            collection_name = (
                self.short_term_collection 
                if collection == "short_term" 
                else self.long_term_collection
            )
            
            # Search in Qdrant with user filter
            search_results = self.qdrant_client.search(
                collection_name=collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=self.user_id)
                        )
                    ]
                ),
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": result.score,
                    "content": result.payload.get("content"),
                    "role": result.payload.get("role"),
                    "timestamp": result.payload.get("timestamp"),
                    "metadata": {k: v for k, v in result.payload.items() 
                               if k not in ["user_id", "role", "content", "timestamp"]}
                })
            
            logger.info(f"Retrieved {len(results)} relevant memories from {collection} for query: {query[:50]}...")
            return results
            
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return []
    
    def get_recent_messages(
        self, 
        limit: int = 10,
        collection: str = "short_term"
    ) -> List[Dict[str, Any]]:
        """
        Get recent messages in chronological order
        
        Args:
            limit: Maximum number of messages to retrieve
            collection: Which collection to retrieve from ("short_term" or "long_term")
            
        Returns:
            List of recent messages sorted by timestamp
        """
        try:
            # Determine collection
            collection_name = (
                self.short_term_collection 
                if collection == "short_term" 
                else self.long_term_collection
            )
            
            # Scroll through all points for this user
            points, _ = self.qdrant_client.scroll(
                collection_name=collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=self.user_id)
                        )
                    ]
                ),
                limit=limit,
                with_payload=True,
                with_vectors=False
            )
            
            # Format and sort by timestamp
            results = []
            for point in points:
                results.append({
                    "id": point.id,
                    "content": point.payload.get("content"),
                    "role": point.payload.get("role"),
                    "timestamp": point.payload.get("timestamp"),
                    "metadata": {k: v for k, v in point.payload.items() 
                               if k not in ["user_id", "role", "content", "timestamp"]}
                })
            
            # Sort by timestamp (most recent last)
            results.sort(key=lambda x: x.get("timestamp", ""))
            
            logger.info(f"Retrieved {len(results)} recent messages from {collection}")
            return results
            
        except Exception as e:
            logger.error(f"Failed to retrieve recent messages: {e}")
            return []
    
    def format_context_for_prompt(self, memories: List[Dict[str, Any]]) -> str:
        """
        Format retrieved memories into a context string for the prompt
        
        Args:
            memories: List of memory items from search
            
        Returns:
            Formatted context string
        """
        if not memories:
            return "No relevant conversation history found."
        
        context_parts = ["=== Relevant Conversation Context ===\n"]
        
        for memory in memories:
            role = memory.get("role", "unknown")
            content = memory.get("content", "")
            timestamp = memory.get("timestamp", "")
            
            role_label = "User" if role == "user" else "Assistant"
            context_parts.append(f"{role_label}: {content}")
        
        context_parts.append("\n=== End of Context ===")
        return "\n".join(context_parts)
    
    def clear_user_memories(self, collection: Optional[str] = None) -> None:
        """
        Clear all memories for the current user
        
        Args:
            collection: Specific collection to clear ("short_term" or "long_term"), 
                       or None to clear both
        """
        try:
            collections_to_clear = []
            
            if collection == "short_term":
                collections_to_clear = [self.short_term_collection]
            elif collection == "long_term":
                collections_to_clear = [self.long_term_collection]
            else:
                collections_to_clear = [self.short_term_collection, self.long_term_collection]
            
            for collection_name in collections_to_clear:
                # Delete all points for this user
                self.qdrant_client.delete(
                    collection_name=collection_name,
                    points_selector=Filter(
                        must=[
                            FieldCondition(
                                key="user_id",
                                match=MatchValue(value=self.user_id)
                            )
                        ]
                    )
                )
                logger.info(f"Cleared all memories for user {self.user_id} from {collection_name}")
            
        except Exception as e:
            logger.error(f"Failed to clear memories: {e}")
            raise
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get statistics about stored memories
        
        Returns:
            Dictionary with memory statistics
        """
        try:
            stats = {}
            
            for collection_name, collection_type in [
                (self.short_term_collection, "short_term"),
                (self.long_term_collection, "long_term")
            ]:
                # Count points for this user
                points, _ = self.qdrant_client.scroll(
                    collection_name=collection_name,
                    scroll_filter=Filter(
                        must=[
                            FieldCondition(
                                key="user_id",
                                match=MatchValue(value=self.user_id)
                            )
                        ]
                    ),
                    limit=10000,
                    with_payload=False,
                    with_vectors=False
                )
                
                stats[collection_type] = {
                    "total_messages": len(points),
                    "collection_name": collection_name
                }
            
            logger.info(f"Memory stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return {}
