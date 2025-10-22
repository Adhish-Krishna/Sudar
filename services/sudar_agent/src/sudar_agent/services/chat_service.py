"""
MongoDB Chat Service for storing chat history
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pymongo import MongoClient
from pymongo.collection import Collection

from ..config.config import config

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing chat history in MongoDB."""
    
    def __init__(self):
        """Initialize MongoDB connection."""
        self.client = MongoClient(config.MONGODB_URL)
        self.db = self.client[config.MONGODB_DATABASE]
        self.collection: Collection = self.db[config.MONGODB_COLLECTION]
        logger.info(f"Connected to MongoDB: {config.MONGODB_DATABASE}.{config.MONGODB_COLLECTION}")
    
    def save_message(
        self,
        user_id: str,
        chat_id: str,
        role: str,
        content: str,
        subject_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Save a chat message to MongoDB
        
        Args:
            user_id: User identifier
            chat_id: Chat session identifier
            role: Message role (user, agent, content_researcher, worksheet_generator, router)
            content: Message content
            subject_id: Optional classroom identifier for organizing by classroom
            metadata: Optional additional metadata
        
        Returns:
            Inserted document ID as string
        """
        document = {
            "user_id": user_id,
            "chat_id": chat_id,
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        # Add subject_id if provided
        if subject_id:
            document["subject_id"] = subject_id
        
        result = self.collection.insert_one(document)
        logger.debug(f"Saved {role} message for user {user_id}, chat {chat_id}, classroom {subject_id}")
        return str(result.inserted_id)
    
    def get_chat_history(
        self,
        user_id: str,
        chat_id: str,
        subject_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve chat history for a user and chat
        
        Args:
            user_id: User identifier
            chat_id: Chat session identifier
            subject_id: Optional classroom identifier to filter by classroom
            limit: Optional limit on number of messages to retrieve
        
        Returns:
            List of chat messages sorted by timestamp
        """
        query = {"user_id": user_id, "chat_id": chat_id}
        
        # Add subject_id filter if provided
        if subject_id:
            query["subject_id"] = subject_id
        
        cursor = self.collection.find(query).sort("timestamp", 1)
        
        if limit:
            cursor = cursor.limit(limit)
        
        messages = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
            messages.append(doc)
        
        return messages
    
    def delete_chat(self, user_id: str, chat_id: str, subject_id: Optional[str] = None) -> int:
        """
        Delete all messages for a specific chat
        
        Args:
            user_id: User identifier
            chat_id: Chat session identifier
            subject_id: Optional classroom identifier to filter by classroom
        
        Returns:
            Number of deleted messages
        """
        query = {"user_id": user_id, "chat_id": chat_id}
        
        # Add subject_id filter if provided
        if subject_id:
            query["subject_id"] = subject_id
        
        result = self.collection.delete_many(query)
        logger.info(f"Deleted {result.deleted_count} messages for chat {chat_id}, classroom {subject_id}")
        return result.deleted_count
    
    def close(self):
        """Close MongoDB connection."""
        self.client.close()
        logger.info("MongoDB connection closed")
