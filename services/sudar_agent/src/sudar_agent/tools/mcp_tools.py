"""MCP Tools - Wrappers for connecting to Sudar MCP Tools Server."""

import httpx
from typing import List, Optional, Dict, Any
from crewai.tools import BaseTool
from pydantic import Field

from ..config.config import config


class WebSearchTool(BaseTool):
    """Tool for searching the web using Tavily API via MCP server."""
    
    name: str = "WebSearchTool"
    description: str = (
        "Search the web for educational content, facts, and information. "
        "Use this tool to find up-to-date information, educational resources, "
        "scientific facts, and learning materials from the internet."
    )
    
    def _run(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """Execute web search."""
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{config.MCP_TOOLS_URL}/tools/call",
                    json={
                        "name": "web_search",
                        "arguments": {
                            "query": query,
                            "max_results": max_results
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                # Extract content from MCP response
                if result.get("isError"):
                    return {"success": False, "error": result.get("content", [{}])[0].get("text", "Unknown error")}
                
                # Parse the result
                content = result.get("content", [{}])[0].get("text", "{}")
                import json
                return json.loads(content) if isinstance(content, str) else content
                
        except Exception as e:
            return {"success": False, "error": str(e)}


class WebsiteScraperTool(BaseTool):
    """Tool for scraping content from websites via MCP server."""
    
    name: str = "WebsiteScraperTool"
    description: str = (
        "Scrape and extract content from specific websites. "
        "Use this tool when you have URLs that contain valuable educational content "
        "that needs to be extracted and analyzed."
    )
    
    def _run(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Execute website scraping."""
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    f"{config.MCP_TOOLS_URL}/tools/call",
                    json={
                        "name": "scrape_websites",
                        "arguments": {
                            "urls": urls
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("isError"):
                    return [{"success": False, "error": result.get("content", [{}])[0].get("text", "Unknown error")}]
                
                content = result.get("content", [{}])[0].get("text", "[]")
                import json
                return json.loads(content) if isinstance(content, str) else content
                
        except Exception as e:
            return [{"success": False, "error": str(e)}]


class ContentSaverTool(BaseTool):
    """Tool for saving markdown content as PDF via MCP server."""
    
    name: str = "ContentSaverTool"
    description: str = (
        "Convert markdown content to PDF and save it to storage. "
        "Use this tool to save generated worksheets, assignments, or educational content. "
        "ALWAYS use this tool to save every worksheet you generate."
    )
    
    user_id: str = Field(default="")
    chat_id: str = Field(default="")
    
    def _run(self, content: str, title: str) -> Dict[str, Any]:
        """Save content as PDF."""
        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    f"{config.MCP_TOOLS_URL}/tools/call",
                    json={
                        "name": "save_content",
                        "arguments": {
                            "content": content,
                            "title": title,
                            "user_id": self.user_id,
                            "chat_id": self.chat_id
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("isError"):
                    return {"success": False, "error": result.get("content", [{}])[0].get("text", "Unknown error")}
                
                content_result = result.get("content", [{}])[0].get("text", "{}")
                import json
                return json.loads(content_result) if isinstance(content_result, str) else content_result
                
        except Exception as e:
            return {"success": False, "error": str(e)}


class ContentRetrieverTool(BaseTool):
    """Tool for retrieving content from ingested documents via MCP server."""
    
    name: str = "ContentRetrieverTool"
    description: str = (
        "Retrieve relevant content from previously ingested documents. "
        "Use this tool when the user's query contains @filename.ext references "
        "or when you need to fetch context from uploaded documents. "
        "This tool searches through user's documents and returns the most relevant chunks."
    )
    
    user_id: str = Field(default="")
    chat_id: str = Field(default="")
    
    def _run(self, query: str, filenames: Optional[List[str]] = None, top_k: int = 5) -> Dict[str, Any]:
        """Retrieve content from documents."""
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{config.MCP_TOOLS_URL}/tools/call",
                    json={
                        "name": "retrieve_content",
                        "arguments": {
                            "query": query,
                            "user_id": self.user_id,
                            "chat_id": self.chat_id,
                            "filenames": filenames,
                            "top_k": top_k
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("isError"):
                    return {"success": False, "error": result.get("content", [{}])[0].get("text", "Unknown error")}
                
                content = result.get("content", [{}])[0].get("text", "{}")
                import json
                return json.loads(content) if isinstance(content, str) else content
                
        except Exception as e:
            return {"success": False, "error": str(e)}
