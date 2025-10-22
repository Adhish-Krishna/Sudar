"""
Embedder.py - Handles embedding and storing chunks in Qdrant
"""
from typing import List, Dict, Any
import os
import uuid
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
import ollama

# Load environment variables
load_dotenv()


class Embedder:
    """
    A class responsible for embedding text chunks and storing them in Qdrant.
    Uses Ollama for embeddings and Qdrant for vector storage.
    """
    
    def __init__(self):
        """Initialize the Embedder with Qdrant and Ollama clients."""
        # Get configuration from environment
        self.qdrant_host = os.getenv('QDRANT_HOST', 'localhost')
        self.qdrant_port = int(os.getenv('QDRANT_PORT', 6333))
        self.collection_name = os.getenv('QDRANT_COLLECTION_NAME', 'rag_documents')
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.embedding_model = os.getenv('EMBEDDING_MODEL_NAME', 'nomic-embed-text')
        self.embedding_dimension = int(os.getenv('EMBEDDING_DIMENSION', 768))
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(host=self.qdrant_host, port=self.qdrant_port)
        
        # Ensure collection exists
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        collections = self.qdrant_client.get_collections().collections
        collection_names = [col.name for col in collections]
        
        if self.collection_name not in collection_names:
            self.qdrant_client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dimension,
                    distance=Distance.COSINE
                )
            )
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text using Ollama.
        Truncates text if it exceeds max_length to prevent context length errors.
        
        Args:
            text: The text to embed
            max_length: Maximum character length (default 8000, roughly 2000 tokens)
        
        Returns:
            List[float]: The embedding vector
        """
        
        ollama_client = ollama.Client(host=self.ollama_base_url)

        try:
            response = ollama_client.embeddings(
                model=self.embedding_model,
                prompt=text
            )
            return response['embedding']
        except Exception as e:
            raise RuntimeError(f"Failed to generate embedding: {e}")
                
    
    def _generate_id(self, text: str, user_id: str, chat_id: str, index: int) -> str:
        """
        Generate a unique UUID for a chunk.
        
        Args:
            text: The chunk text
            user_id: The user ID
            chat_id: The chat ID
            index: The chunk index
        
        Returns:
            str: A unique UUID string
        """
        # Create a deterministic UUID based on content
        # Using UUID5 with a namespace and unique string
        namespace = uuid.NAMESPACE_DNS
        unique_string = f"{user_id}_{chat_id}_{index}_{text[:100]}"
        return str(uuid.uuid5(namespace, unique_string))
    
    def embed_and_store(
        self, 
        chunks: List[str], 
        user_id: str, 
        chat_id: str,
        subject_id: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Embed chunks and store them in Qdrant.
        
        Args:
            chunks: List of text chunks to embed
            user_id: The user ID
            chat_id: The chat ID
            subject_id: Optional subject ID for organizing by subject
            metadata: Additional metadata to store with chunks
        
        Returns:
            Dict containing insertion status and details
        """
        if not chunks:
            return {
                "status": "error",
                "message": "No chunks provided",
                "inserted_count": 0
            }
        
        points = []
        failed_chunks = []
        
        for idx, chunk in enumerate(chunks):
            try:
                # Generate embedding
                embedding = self._generate_embedding(chunk)
                
                # Generate unique UUID
                point_id = self._generate_id(chunk, user_id, chat_id, idx)
                
                # Prepare payload
                payload = {
                    "text": chunk,
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "type": "InsertedData",
                    "chunk_index": idx
                }
                
                # Add subject_id if provided
                if subject_id:
                    payload["subject_id"] = subject_id
                
                # Add additional metadata if provided
                if metadata:
                    payload.update(metadata)
                
                # Create point
                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload=payload
                )
                
                points.append(point)
            except Exception as e:
                print(f"Error processing chunk {idx}: {str(e)}")
                print(f"Chunk length: {len(chunk)} characters")
                print(f"Chunk preview: {chunk[:200]}...")
                failed_chunks.append({
                    "index": idx,
                    "error": str(e),
                    "length": len(chunk)
                })
        
        # Upload points to Qdrant if any were successfully created
        if points:
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
        
        # Prepare response
        response = {
            "status": "success" if points else "error",
            "message": f"Successfully embedded and stored {len(points)} out of {len(chunks)} chunks",
            "inserted_count": len(points),
            "total_chunks": len(chunks),
            "user_id": user_id,
            "chat_id": chat_id
        }
        
        # Add failed chunks info if any
        if failed_chunks:
            response["failed_chunks"] = len(failed_chunks)
            response["warning"] = f"{len(failed_chunks)} chunks failed to embed"
        
        return response
    
    def delete_by_chat(self, user_id: str, chat_id: str, subject_id: str = None) -> Dict[str, Any]:
        """
        Delete all chunks for a specific user and chat.
        
        Args:
            user_id: The user ID
            chat_id: The chat ID
            subject_id: Optional classroom ID to filter by classroom
        
        Returns:
            Dict containing deletion status
        """
        must_conditions = [
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="chat_id", match=MatchValue(value=chat_id))
        ]
        
        # Add subject_id filter if provided
        if subject_id:
            must_conditions.append(
                FieldCondition(key="subject_id", match=MatchValue(value=subject_id))
            )
        
        self.qdrant_client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(must=must_conditions)
        )
        
        return {
            "status": "success",
            "message": f"Deleted all chunks for user_id={user_id}, chat_id={chat_id}, subject_id={subject_id}"
        }
