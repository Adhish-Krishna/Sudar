"""
Retriever.py - Handles context retrieval from Qdrant with reranking
"""
from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
import ollama

# Load environment variables
load_dotenv()


class Retriever:
    """
    A class responsible for retrieving relevant chunks from Qdrant
    and reranking them based on relevance to the query.
    """
    
    def __init__(self):
        """Initialize the Retriever with Qdrant client."""
        # Get configuration from environment
        self.qdrant_host = os.getenv('QDRANT_HOST', 'localhost')
        self.qdrant_port = int(os.getenv('QDRANT_PORT', 6333))
        self.collection_name = os.getenv('QDRANT_COLLECTION_NAME', 'rag_documents')
        self.ollama_base_url = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
        self.embedding_model = os.getenv('EMBEDDING_MODEL_NAME', 'nomic-embed-text')
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(host=self.qdrant_host, port=self.qdrant_port)
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text using Ollama.
        
        Args:
            text: The text to embed
        
        Returns:
            List[float]: The embedding vector
        """

        ollama_client = ollama.Client(host=self.ollama_base_url)

        response = ollama_client.embeddings(
            model=self.embedding_model,
            prompt=text
        )
        return response['embedding']
    
    def _calculate_relevance_score(self, query: str, text: str) -> float:
        """
        Calculate relevance score between query and text using simple heuristics.
        This is a simple reranker based on keyword matching and text similarity.
        
        Args:
            query: The search query
            text: The text to score
        
        Returns:
            float: Relevance score (0-1)
        """
        query_lower = query.lower()
        text_lower = text.lower()
        
        # Keyword matching score
        query_words = set(query_lower.split())
        text_words = set(text_lower.split())
        
        if not query_words:
            return 0.0
        
        # Jaccard similarity
        intersection = query_words.intersection(text_words)
        union = query_words.union(text_words)
        
        keyword_score = len(intersection) / len(union) if union else 0.0
        
        # Exact phrase matching bonus
        phrase_bonus = 0.2 if query_lower in text_lower else 0.0
        
        # Combine scores
        total_score = min(1.0, keyword_score + phrase_bonus)
        
        return total_score
    
    def retrieve(
        self, 
        query: str, 
        user_id: str, 
        chat_id: str, 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Retrieve and rerank relevant chunks from Qdrant.
        
        Args:
            query: The search query
            user_id: The user ID to filter by
            chat_id: The chat ID to filter by
            top_k: Number of top results to return after reranking
        
        Returns:
            List[Dict]: List of retrieved chunks with metadata and scores
        """
        # Generate query embedding
        query_embedding = self._generate_embedding(query)
        
        # Search in Qdrant with filters
        # Retrieve more results initially for reranking
        initial_top_k = min(top_k * 3, 20)
        
        search_results = self.qdrant_client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            query_filter=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    FieldCondition(key="chat_id", match=MatchValue(value=chat_id))
                ]
            ),
            limit=initial_top_k
        )
        
        if not search_results:
            return []
        
        # Rerank results
        ranked_results = []
        for result in search_results:
            text = result.payload.get('text', '')
            
            # Calculate reranking score
            rerank_score = self._calculate_relevance_score(query, text)
            
            # Combine vector similarity score with rerank score
            # Vector score is already normalized (cosine similarity)
            combined_score = (result.score * 0.6) + (rerank_score * 0.4)
            
            ranked_results.append({
                'id': result.id,
                'text': text,
                'score': combined_score,
                'vector_score': result.score,
                'rerank_score': rerank_score,
                'metadata': {
                    'user_id': result.payload.get('user_id'),
                    'chat_id': result.payload.get('chat_id'),
                    'chunk_index': result.payload.get('chunk_index'),
                    'type': result.payload.get('type')
                }
            })
        
        # Sort by combined score and return top_k
        ranked_results.sort(key=lambda x: x['score'], reverse=True)
        
        return ranked_results[:top_k]
    
    def retrieve_all_for_chat(
        self, 
        user_id: str, 
        chat_id: str, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all chunks for a specific user and chat (no query).
        
        Args:
            user_id: The user ID
            chat_id: The chat ID
            limit: Maximum number of results to return
        
        Returns:
            List[Dict]: List of all chunks for the chat
        """
        # Use scroll to get all points with filters
        results, _ = self.qdrant_client.scroll(
            collection_name=self.collection_name,
            scroll_filter=Filter(
                must=[
                    FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                    FieldCondition(key="chat_id", match=MatchValue(value=chat_id))
                ]
            ),
            limit=limit
        )
        
        chunks = []
        for result in results:
            chunks.append({
                'id': result.id,
                'text': result.payload.get('text', ''),
                'metadata': {
                    'user_id': result.payload.get('user_id'),
                    'chat_id': result.payload.get('chat_id'),
                    'chunk_index': result.payload.get('chunk_index'),
                    'type': result.payload.get('type')
                }
            })
        
        return chunks
