"""Configuration management for Sudar Agent service."""

import os
from typing import Literal
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Config:
    """Configuration class for Sudar Agent service."""
    
    # LLM Configuration
    MODEL_PROVIDER: Literal["google", "groq", "ollama"] = os.getenv("MODEL_PROVIDER", "google")
    GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemini/gemini-2.5-flash-preview-04-17")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:latest")
    
    # Service URLs
    RAG_SERVICE_URL: str = os.getenv("RAG_SERVICE_URL", "http://localhost:3001")
    MCP_TOOLS_URL: str = os.getenv("MCP_TOOLS_URL", "http://localhost:3002")
    MD_TO_PDF_URL: str = os.getenv("MD_TO_PDF_URL", "http://localhost:3000/convert")
    
    # MongoDB Configuration
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "sudar_db")
    MONGODB_COLLECTION: str = os.getenv("MONGODB_COLLECTION", "chats")
    
    # Qdrant Configuration
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_COLLECTION_SHORT_TERM: str = os.getenv("QDRANT_COLLECTION_SHORT_TERM", "sudar_agent_short_term_memory")
    QDRANT_COLLECTION_LONG_TERM: str = os.getenv("QDRANT_COLLECTION_LONG_TERM", "sudar_agent_long_term_memory")
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "embeddinggemma:300m")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "3005"))
    
    @classmethod
    def get_llm_config(cls) -> dict:
        """Get LLM configuration based on provider."""
        if cls.MODEL_PROVIDER == "groq":
            return {
                "provider": cls.MODEL_PROVIDER,
                "model": f"groq/{cls.GROQ_MODEL}",
                "api_key": cls.GROQ_API_KEY,
                "temperature": 0.7,
            }
        elif cls.MODEL_PROVIDER == "google":
            return {
                "provider": cls.MODEL_PROVIDER,
                "model": f"gemini/{cls.GOOGLE_MODEL}",
                "api_key": cls.GOOGLE_API_KEY,
                "temperature": 0.7,
            }
        else:  # ollama
            return {
                "provider": cls.MODEL_PROVIDER,
                "model": f"ollama/{cls.OLLAMA_MODEL}",
                "temperature": 0.7,
            }


config = Config()
