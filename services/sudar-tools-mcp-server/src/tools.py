"""Tools for web search and website scraping."""

import os
import re
import tempfile
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
from minio import Minio
from minio.commonconfig import Tags


class WebSearchTool:
    """Web search tool using Tavily API."""
    
    def __init__(self, api_key: str):
        """Initialize the web search tool.
        
        Args:
            api_key: Tavily API key
        """
        self.client = TavilyClient(api_key=api_key)
    
    def search(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """Search the web using Tavily API.
        
        Args:
            query: The search query
            max_results: Maximum number of results to return
            
        Returns:
            Dict containing search results
        """
        try:
            response = self.client.search(
                query=query,
                max_results=max_results,
                include_answer=True,
                include_raw_content=False
            )
            
            return {
                "success": True,
                "query": query,
                "answer": response.get("answer", ""),
                "results": [
                    {
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", ""),
                        "score": result.get("score", 0.0)
                    }
                    for result in response.get("results", [])
                ]
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            }


class WebsiteScraperTool:
    """Website scraper tool to extract content from URLs."""
    
    def __init__(self, timeout: int = 30):
        """Initialize the website scraper tool.
        
        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrape content from a single URL.
        
        Args:
            url: The URL to scrape
            
        Returns:
            Dict containing scraped content
        """
        try:
            response = requests.get(
                url,
                headers=self.headers,
                timeout=self.timeout,
                allow_redirects=True
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text(separator=' ', strip=True)
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            # Get title
            title = soup.title.string if soup.title else url
            
            # Get meta description
            description = ""
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc and meta_desc.get("content"):
                description = meta_desc["content"]
            
            return {
                "success": True,
                "url": url,
                "title": title,
                "description": description,
                "content": text[:10000],  # Limit content to 10000 chars
                "content_length": len(text)
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "url": url,
                "error": f"Request failed: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "url": url,
                "error": f"Scraping failed: {str(e)}"
            }
    
    def scrape_urls(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Scrape content from multiple URLs.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of dicts containing scraped content from each URL
        """
        results = []
        for url in urls:
            result = self.scrape_url(url)
            results.append(result)
        
        return results


class ContentSaverTool:
    """Content saver tool to convert markdown to PDF and save to MinIO."""
    
    def __init__(
        self,
        minio_url: str,
        minio_access_key: str,
        minio_secret_key: str,
        minio_bucket_name: str,
        md_to_pdf_url: str
    ):
        """Initialize the content saver tool.
        
        Args:
            minio_url: MinIO server URL
            minio_access_key: MinIO access key
            minio_secret_key: MinIO secret key
            minio_bucket_name: MinIO bucket name
            md_to_pdf_url: MD to PDF conversion service URL
        """
        self.minio_url = minio_url
        self.minio_access_key = minio_access_key
        self.minio_secret_key = minio_secret_key
        self.minio_bucket_name = minio_bucket_name
        self.md_to_pdf_url = md_to_pdf_url
        
        # Initialize MinIO client
        endpoint = self.minio_url.replace("http://", "").replace("https://", "")
        self.minio_client = Minio(
            endpoint=endpoint,
            access_key=self.minio_access_key,
            secret_key=self.minio_secret_key,
            secure=False
        )
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the MinIO bucket exists, create if it doesn't."""
        try:
            if not self.minio_client.bucket_exists(self.minio_bucket_name):
                self.minio_client.make_bucket(self.minio_bucket_name)
                print(f"Created bucket: {self.minio_bucket_name}")
        except Exception as e:
            print(f"Error checking/creating bucket: {e}")
    
    def save_content(
        self,
        content: str,
        title: str,
        user_id: Optional[str] = None,
        chat_id: Optional[str] = None,
        subject_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Save markdown content as PDF to MinIO.
        
        Args:
            content: Markdown formatted content to save
            title: Title for the PDF file (used as filename)
            user_id: Optional user ID for organizing content
            chat_id: Optional chat ID for organizing content
            subject_id: Optional classroom ID for organizing content
            
        Returns:
            Dict containing success status and details
        """
        temp_md_file = None
        temp_pdf_file = None
        
        try:
            # Sanitize title for filename
            safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
            pdf_filename = f"{safe_title}.pdf"
            
            # Build object name with optional user/chat/classroom context
            if user_id and chat_id and subject_id:
                object_name = f"{user_id}/{subject_id}/{chat_id}/{pdf_filename}"
            elif user_id and chat_id:
                object_name = f"{user_id}/{chat_id}/{pdf_filename}"
            elif user_id:
                object_name = f"{user_id}/{pdf_filename}"
            else:
                object_name = pdf_filename
            
            # Create temporary markdown file
            temp_md_file = tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.md',
                delete=False,
                encoding='utf-8'
            )
            temp_md_file.write(content)
            temp_md_file.close()
            
            # Convert markdown to PDF using the md-to-pdf service
            with open(temp_md_file.name, 'rb') as f:
                files = {'markdown': (f"{safe_title}.md", f, 'text/markdown')}
                response = requests.post(self.md_to_pdf_url, files=files, timeout=30)
                response.raise_for_status()
            
            # Save received PDF to temporary file
            temp_pdf_file = tempfile.NamedTemporaryFile(
                mode='wb',
                suffix='.pdf',
                delete=False
            )
            temp_pdf_file.write(response.content)
            temp_pdf_file.close()
            
            # Prepare tags
            tags = Tags(for_object=True)
            if user_id:
                tags["user_id"] = user_id
            if chat_id:
                tags["chat_id"] = chat_id
            if subject_id:
                tags["subject_id"] = subject_id
            tags["type"] = "GeneratedPDFContent"
            tags["title"] = safe_title
            
            # Upload to MinIO
            self.minio_client.fput_object(
                bucket_name=self.minio_bucket_name,
                object_name=object_name,
                file_path=temp_pdf_file.name,
                tags=tags,
                content_type="application/pdf"
            )
            
            return {
                "success": True,
                "message": f"Content saved successfully to MinIO",
                "bucket": self.minio_bucket_name,
                "object_name": object_name,
                "filename": pdf_filename,
                "url": f"{self.minio_url}/{self.minio_bucket_name}/{object_name}"
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"PDF conversion failed: {str(e)}",
                "message": "Failed to convert markdown to PDF"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to save content"
            }
        finally:
            # Clean up temporary files
            if temp_md_file and os.path.exists(temp_md_file.name):
                try:
                    os.remove(temp_md_file.name)
                except Exception as cleanup_err:
                    print(f"Error removing temporary markdown file: {cleanup_err}")
            
            if temp_pdf_file and os.path.exists(temp_pdf_file.name):
                try:
                    os.remove(temp_pdf_file.name)
                except Exception as cleanup_err:
                    print(f"Error removing temporary PDF file: {cleanup_err}")


class ContentRetrieverTool:
    """Content retriever tool to fetch relevant content from RAG service."""
    
    def __init__(self, rag_service_url: str):
        """Initialize the content retriever tool.
        
        Args:
            rag_service_url: Base URL of the RAG service
        """
        self.rag_service_url = rag_service_url.rstrip('/')
        self.retrieve_endpoint = f"{self.rag_service_url}/retrieve"
    
    @staticmethod
    def extract_filenames(query: str) -> List[str]:
        """Extract filenames from query that match @filename.ext pattern.
        
        Args:
            query: The user query that may contain @filename.ext patterns
            
        Returns:
            List of extracted filenames
        """
        # Pattern to match @filename.extension
        pattern = r'@([\w\-]+\.[\w]+)'
        matches = re.findall(pattern, query)
        return matches
    
    def retrieve(
        self,
        query: str,
        user_id: str,
        chat_id: str,
        subject_id: Optional[str] = None,
        filenames: Optional[List[str]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """Retrieve relevant content from RAG service.
        
        Args:
            query: The search query
            user_id: User identifier
            chat_id: Chat session identifier
            subject_id: Optional classroom identifier for filtering by classroom
            filenames: Optional list of filenames to filter by
            top_k: Number of top results to return
            
        Returns:
            Dict containing retrieved content and metadata
        """
        try:
            # If filenames not provided, try to extract from query
            if filenames is None:
                filenames = self.extract_filenames(query)
            
            payload = {
                "query": query,
                "user_id": user_id,
                "chat_id": chat_id,
                "top_k": top_k
            }
            
            # Add subject_id if provided
            if subject_id:
                payload["subject_id"] = subject_id
            
            # Add filenames if present
            if filenames and len(filenames) > 0:
                payload["filenames"] = filenames
            
            response = requests.post(
                self.retrieve_endpoint,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Format the response
            results = data.get("results", [])
            formatted_context = self._format_context(results)
            
            return {
                "success": True,
                "query": query,
                "user_id": user_id,
                "chat_id": chat_id,
                "subject_id": subject_id,
                "filenames": filenames,
                "context": formatted_context,
                "results": results,
                "count": len(results)
            }
            
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"RAG service request failed: {str(e)}",
                "query": query
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    def _format_context(self, results: List[Dict[str, Any]]) -> str:
        """Format retrieved results into a readable context string.
        
        Args:
            results: List of retrieved chunks with metadata
            
        Returns:
            Formatted context string
        """
        if not results:
            return "No relevant content found in the documents."
        
        context_parts = ["Retrieved Context from Documents:\n"]
        
        for i, result in enumerate(results, 1):
            text = result.get("text", "")
            metadata = result.get("metadata", {})
            filename = metadata.get("filename", "unknown")
            score = result.get("score", 0.0)
            
            context_parts.append(
                f"\n[{i}] From: {filename} (relevance: {score:.2f})\n{text}\n"
            )
        
        return "\n".join(context_parts)

