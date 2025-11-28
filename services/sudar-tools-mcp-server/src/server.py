"""MCP Server with web search and scraping tools."""

import os
from typing import List, Optional
from dotenv import load_dotenv
from fastmcp import FastMCP
from fastmcp.server.dependencies import get_http_headers
from starlette.responses import JSONResponse

from .tools import WebSearchTool, WebsiteScraperTool, ContentSaverTool, ContentRetrieverTool

# Load environment variables
load_dotenv()

# Initialize MCP server
mcp = FastMCP("Sudar Tools Server")

# Initialize tools
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
if not TAVILY_API_KEY:
    raise ValueError("TAVILY_API_KEY environment variable is required")

# MinIO configuration
MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "sudar-content")

MD_TO_PDF_URL = os.getenv("MD_TO_PDF_URL", "http://localhost:3000/convert")

# RAG service configuration
RAG_SERVICE_URL = os.getenv("RAG_SERVICE_URL", "http://localhost:8001")

web_search_tool = WebSearchTool(api_key=TAVILY_API_KEY)
website_scraper_tool = WebsiteScraperTool()
content_saver_tool = ContentSaverTool(
    minio_url=MINIO_URL,
    minio_access_key=MINIO_ACCESS_KEY,
    minio_secret_key=MINIO_SECRET_KEY,
    minio_bucket_name=MINIO_BUCKET_NAME,
    md_to_pdf_url=MD_TO_PDF_URL
)
content_retriever_tool = ContentRetrieverTool(rag_service_url=RAG_SERVICE_URL)


@mcp.tool()
def web_search(query: str, max_results: int = 5) -> dict:
    """Search the web using Tavily API.
    
    Args:
        query: The search query to execute
        max_results: Maximum number of search results to return (default: 5)
    
    Returns:
        A dictionary containing:
        - success: Whether the search was successful
        - query: The original query
        - answer: AI-generated answer to the query
        - results: List of search results with title, url, content, and relevance score
    """
    return web_search_tool.search(query, max_results)


@mcp.tool()
def scrape_websites(urls: List[str]) -> list:
    """Scrape content from one or more websites.
    
    Args:
        urls: List of URLs to scrape content from
    
    Returns:
        A list of dictionaries, one for each URL, containing:
        - success: Whether the scraping was successful
        - url: The scraped URL
        - title: Page title
        - description: Meta description if available
        - content: Main text content (truncated to 10000 characters)
        - content_length: Total length of extracted content
        - error: Error message if scraping failed
    """
    return website_scraper_tool.scrape_urls(urls)


@mcp.tool()
def save_content(
    content: str,
    title: str
) -> dict:
    """Convert markdown content to PDF and save it to MinIO storage.
    
    This tool takes markdown-formatted content, converts it to PDF using the md-to-pdf service,
    and stores it in MinIO object storage. User context (user_id, chat_id, subject_id) is 
    automatically extracted from request headers sent by the agent service.
    
    Args:
        content: The markdown-formatted content to save as PDF
        title: The title for the PDF file (will be used as filename)
    
    Returns:
        A dictionary containing:
        - success: Whether the operation was successful
        - message: Success or error message
        - bucket: MinIO bucket name (if successful)
        - object_name: Full object path in MinIO (if successful)
        - filename: The PDF filename (if successful)
        - url: Direct URL to access the PDF (if successful)
        - error: Error details (if failed)
    
    Example:
        save_content(
            content="# My Document\\n\\nThis is the content.",
            title="My Assignment"
        )
    """
    # Extract user context from HTTP headers (injected by agent service)
    headers = get_http_headers(include_all=True)
    
    user_id = headers.get("x-user-id")
    chat_id = headers.get("x-chat-id")
    subject_id = headers.get("x-subject-id")
    classroom_id = headers.get("x-classroom-id")
    
    return content_saver_tool.save_content(
        content=content,
        title=title,
        user_id=user_id,
        chat_id=chat_id,
        subject_id=subject_id,
        classroom_id=classroom_id
    )


@mcp.tool()
def retrieve_content(
    query: str,
    filenames: Optional[List[str]] = None,
    top_k: int = 5
) -> dict:
    """Retrieve relevant content from ingested documents using RAG service.
    
    This tool searches through documents that have been previously ingested into the RAG system
    and retrieves the most relevant content chunks based on the query. User context (user_id, 
    chat_id, subject_id) is automatically extracted from request headers sent by the agent service.
    
    Args:
        query: The search query to find relevant content. Can include @filename.ext to reference specific files
        filenames: Optional list of specific filenames to filter results by. If not provided,
                  will auto-extract from query using @filename.ext pattern
        top_k: Number of most relevant results to return
    
    Returns:
        A dictionary containing:
        - success: Whether the retrieval was successful
        - query: The original search query
        - user_id: The user identifier
        - chat_id: The chat identifier
        - subject_id: The classroom identifier (if provided)
        - filenames: List of filenames used for filtering (if any)
        - context: Formatted context string combining all retrieved chunks
        - results: List of retrieved chunks with metadata and relevance scores
        - count: Number of results returned
        - error: Error message if retrieval failed
    
    Example:
        retrieve_content(
            query="Explain photosynthesis from @biology.pdf",
            top_k=5
        )
    """
    # Extract user context from HTTP headers (injected by agent service)
    headers = get_http_headers(include_all=True)
    
    user_id = headers.get("x-user-id")
    chat_id = headers.get("x-chat-id")
    subject_id = headers.get("x-subject-id")
    classroom_id = headers.get("x-classroom-id")
    
    # Validate required context
    if not user_id or not chat_id:
        return {
            "success": False,
            "error": "Missing required user context. Agent service must provide X-User-Id and X-Chat-Id headers."
        }
    
    return content_retriever_tool.retrieve(
        query=query,
        user_id=user_id,
        chat_id=chat_id,
        subject_id=subject_id,
        classroom_id=classroom_id,
        filenames=filenames,
        top_k=top_k
    )

# Add health check endpoint
@mcp.custom_route("/health", methods=["GET"])
def health_check(request):
    """Health check endpoint for Docker."""
    return JSONResponse({
        "status": "healthy",
        "service": "sudar-tools-mcp-server",
        "version": "0.1.0",
        "tools": ["web_search", "scrape_websites", "save_content", "retrieve_content", "generate_video"]
    })

def main():
    """Run the MCP server with HTTP transport."""
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    print(f"Starting Sudar Tools MCP Server on {host}:{port}")
    print(f"Available tools: web_search, scrape_websites, save_content, retrieve_content")
    print(f"MinIO: {MINIO_URL}")
    print(f"MD-to-PDF Service: {MD_TO_PDF_URL}")
    print(f"RAG Service: {RAG_SERVICE_URL}")
    
    # Run with HTTP transport
    mcp.run(transport="streamable-http", host=host, port=port)


if __name__ == "__main__":
    main()
