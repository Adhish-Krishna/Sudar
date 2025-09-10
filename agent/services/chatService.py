from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime
from typing import List, Dict, Optional
from envconfig import MONGO_DB_URI

class ChatService:
    def __init__(self, db_name: str, collection_name: str):
        self.db_name = db_name
        self.collection_name = collection_name
        self.client = MongoClient(MONGO_DB_URI)
        self.db = self.client[self.db_name]
        if self.collection_name not in self.db.list_collection_names():
            self.collection = self.db.create_collection(self.collection_name)
        else:
            self.collection = self.db[self.collection_name]
        
    def insertAIMessage(self, message: str, user_id: str, chat_id: str, agent_name: str):
        try:   
            self.collection.insert_one({
                'user_id': user_id,
                'chat_id': chat_id,
                'thread_id': f"{user_id}_{chat_id}",
                'role': "AI",
                'message': message,
                'agent': agent_name,
                'timestamp': datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error inserting AI message: {e}")
            return False

    def insertHumanMessage(self, message: str, user_id: str, chat_id: str):
        try:   
            self.collection.insert_one({
                'user_id': user_id,
                'chat_id': chat_id,
                'thread_id': f"{user_id}_{chat_id}",
                'role': "User",
                'message': message,
                'timestamp': datetime.utcnow()
            })
            return True
        except Exception as e:
            print(f"Error inserting human message: {e}")
            return False

    def getUserChatList(self, user_id: str) -> List[Dict]:
        """Gets all the chat list of an user by chat_name"""
        try:
            # Get unique chat_ids for the user and create chat summaries
            pipeline = [
                {"$match": {"user_id": user_id}},
                {
                    "$group": {
                        "_id": "$chat_id",
                        "message_count": {"$sum": 1},
                        "first_message_time": {"$min": "$timestamp"},
                        "last_message_time": {"$max": "$timestamp"},
                        "first_message": {"$first": "$message"}
                    }
                },
                {
                    "$project": {
                        "chat_id": "$_id",
                        "message_count": 1,
                        "first_message_time": 1,
                        "last_message_time": 1,
                        "chat_name": {
                            "$cond": {
                                "if": {"$gt": [{"$strLenCP": "$first_message"}, 50]},
                                "then": {"$concat": [{"$substr": ["$first_message", 0, 50]}, "..."]},
                                "else": "$first_message"
                            }
                        },
                        "_id": 0
                    }
                },
                {"$sort": {"last_message_time": -1}}
            ]
            
            chat_list = list(self.collection.aggregate(pipeline))
            return chat_list
        except Exception as e:
            print(f"Error getting user chat list: {e}")
            return []

    def getUserChat(self, user_id: str, chat_id: str) -> List[Dict]:
        """Gets all the chat messages of an user by chat_id"""
        try:
            messages = list(self.collection.find(
                {"user_id": user_id, "chat_id": chat_id},
                {"_id": 0}  # Exclude the MongoDB _id field
            ).sort("timestamp", 1))  # Sort by timestamp ascending
            return messages
        except Exception as e:
            print(f"Error getting user chat: {e}")
            return []

    def getChatSummary(self, user_id: str, chat_id: str) -> Optional[Dict]:
        """Gets the chat summary like chat_name, no of message count like that and initial chat creation time like timestamp of the first message of the chat"""
        try:
            pipeline = [
                {"$match": {"user_id": user_id, "chat_id": chat_id}},
                {
                    "$group": {
                        "_id": None,
                        "message_count": {"$sum": 1},
                        "first_message_time": {"$min": "$timestamp"},
                        "last_message_time": {"$max": "$timestamp"},
                        "first_message": {"$first": "$message"}
                    }
                },
                {
                    "$project": {
                        "chat_id": chat_id,
                        "user_id": user_id,
                        "message_count": 1,
                        "first_message_time": 1,
                        "last_message_time": 1,
                        "chat_name": {
                            "$cond": {
                                "if": {"$gt": [{"$strLenCP": "$first_message"}, 50]},
                                "then": {"$concat": [{"$substr": ["$first_message", 0, 50]}, "..."]},
                                "else": "$first_message"
                            }
                        },
                        "_id": 0
                    }
                }
            ]
            
            result = list(self.collection.aggregate(pipeline))
            return result[0] if result else None
        except Exception as e:
            print(f"Error getting chat summary: {e}")
            return None

    def deleteChatHistory(self, user_id: str, chat_id: str) -> bool:
        """Deletes all messages for a specific chat"""
        try:
            result = self.collection.delete_many({"user_id": user_id, "chat_id": chat_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting chat history: {e}")
            return False

    def deleteAllUserChats(self, user_id: str) -> bool:
        """Deletes all chats for a specific user"""
        try:
            result = self.collection.delete_many({"user_id": user_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting all user chats: {e}")
            return False

    def close_connection(self):
        """Close the MongoDB connection"""
        try:
            self.client.close()
        except Exception as e:
            print(f"Error closing connection: {e}")

