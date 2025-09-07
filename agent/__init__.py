"""
Agent Package - AI Educational Content Assistant
"""

# Import main modules
from . import tools
from . import prompts
from . import subagents
from . import utils

# Import specific classes and functions for easy access
from .tools.RAG.Chunking import ChunkDocument
from .tools.RAG.Retrieve import RetrieveChunks
from .tools.RAG.RAG import RAG, DocumentRetrieverTool
from .tools.ContentSaver.contentSaverTool import SaveContentTool
from .tools.WebSearch.websearchtool import WebSearchTool
from .tools.WebsiteScraper.website_scraper import WebScraperTool
from .subagents.ReActSubAgent import ReActSubAgent

# Utility functions
from .utils.util import sanitize_collection_name, extract_filename, extract_extension
from .utils.chat_util import _detect_document_query, _process_input, _process_stream_chunk, _save_chat_session, _load_chat_session

__all__ = [
    # Modules
    'tools',
    'prompts', 
    'subagents',
    'utils',
    
    # RAG Tools
    'ChunkDocument',
    'RetrieveChunks', 
    'RAG',
    'DocumentRetrieverTool',
    
    # Other Tools
    'SaveContentTool',
    'WebSearchTool',
    'WebScraperTool',
    
    # Sub Agents
    'ReActSubAgent',
    
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
