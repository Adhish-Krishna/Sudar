"""
Agent Package - AI Educational Content Assistant (CrewAI Version)
"""

# Import main modules
from . import tools
from . import prompts
from . import utils
from . import services

# Import CrewAI implementation (v2 with native tools and better routing)
from .sudar import SUDARCrew

# Import specific classes and functions for easy access
from .tools.RAG.Chunking import ChunkDocument
from .tools.RAG.Retrieve import RetrieveChunks
from .tools.RAG.RAG import RAG, DocumentRetrievalTool
from .tools.ContentSaver.contentSaverTool import ContentSaverTool
from .tools.WebSearch.websearchtool import WebSearchTool
from .tools.WebsiteScraper.website_scraper import WebScraperTool

# Services
from .services.chatService import ChatService

# Utility functions
from .utils.util import sanitize_collection_name, extract_filename, extract_extension
from .utils.chat_util import _detect_document_query, _process_input, _process_stream_chunk, _save_chat_session, _load_chat_session

__all__ = [
    # Modules
    'tools',
    'prompts',
    'utils',
    'services',
    
    # CrewAI Agent
    'SUDARCrew',
    
    # RAG Tools
    'ChunkDocument',
    'RetrieveChunks', 
    'RAG',
    'DocumentRetrievalTool',
    
    # Other Tools
    'ContentSaverTool',
    'WebSearchTool',
    'WebScraperTool',
    
    # Services
    'ChatService',
    
    # Utilities
    'sanitize_collection_name',
    'extract_filename', 
    'extract_extension',
    '_detect_document_query',
    '_process_input',
    '_process_stream_chunk', 
    '_save_chat_session',
    '_load_chat_session'
]
