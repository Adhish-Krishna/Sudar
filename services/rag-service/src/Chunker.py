"""
Chunker.py - Handles intelligent chunking of markdown content
"""
from typing import List
import re


class Chunker:
    """
    A class responsible for intelligently chunking markdown content.
    Uses a combination of semantic boundaries and size limits.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize the Chunker.
        
        Args:
            chunk_size: Maximum size of each chunk in characters
            chunk_overlap: Number of overlapping characters between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def chunk(self, markdown_content: str) -> List[str]:
        """
        Chunk markdown content intelligently based on structure.
        
        Args:
            markdown_content: The markdown content to chunk
        
        Returns:
            List[str]: A list of chunked content
        """
        if not markdown_content or not markdown_content.strip():
            return []
        
        # Split by headers first (maintains document structure)
        sections = self._split_by_headers(markdown_content)
        
        # Further split large sections
        chunks = []
        for section in sections:
            if len(section) <= self.chunk_size:
                chunks.append(section.strip())
            else:
                # Split large sections by paragraphs
                sub_chunks = self._split_by_paragraphs(section)
                chunks.extend(sub_chunks)
        
        return [chunk for chunk in chunks if chunk.strip()]
    
    def _split_by_headers(self, content: str) -> List[str]:
        """
        Split content by markdown headers while preserving structure.
        
        Args:
            content: The markdown content
        
        Returns:
            List[str]: List of sections split by headers
        """
        # Pattern to match markdown headers (# Header, ## Header, etc.)
        header_pattern = r'(^#{1,6}\s+.+$)'
        
        # Split by headers but keep them with their content
        parts = re.split(header_pattern, content, flags=re.MULTILINE)
        
        sections = []
        current_section = ""
        
        for part in parts:
            if re.match(header_pattern, part, re.MULTILINE):
                if current_section:
                    sections.append(current_section)
                current_section = part
            else:
                current_section += part
        
        if current_section:
            sections.append(current_section)
        
        return sections
    
    def _split_by_paragraphs(self, content: str) -> List[str]:
        """
        Split large content by paragraphs with overlap.
        
        Args:
            content: The content to split
        
        Returns:
            List[str]: List of chunks
        """
        # Split by double newlines (paragraphs)
        paragraphs = re.split(r'\n\s*\n', content)
        
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If adding this paragraph exceeds chunk_size, save current chunk
            if len(current_chunk) + len(para) > self.chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                
                # Start new chunk with overlap from previous chunk
                overlap_text = self._get_overlap(current_chunk)
                current_chunk = overlap_text + "\n\n" + para if overlap_text else para
            else:
                current_chunk += "\n\n" + para if current_chunk else para
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _get_overlap(self, text: str) -> str:
        """
        Get the overlapping portion from the end of the text.
        
        Args:
            text: The text to get overlap from
        
        Returns:
            str: The overlapping portion
        """
        if len(text) <= self.chunk_overlap:
            return text
        
        # Get last chunk_overlap characters, but try to break at sentence boundary
        overlap_start = len(text) - self.chunk_overlap
        overlap_text = text[overlap_start:]
        
        # Try to find a sentence boundary (., !, ?)
        sentence_end = re.search(r'[.!?]\s', overlap_text)
        if sentence_end:
            return overlap_text[sentence_end.end():]
        
        return overlap_text
