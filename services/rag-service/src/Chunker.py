"""
Chunker.py - Handles text chunking using LangChain's RecursiveCharacterTextSplitter
"""
from typing import List
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter


class Chunker:
    """
    Chunks markdown content using LangChain's RecursiveCharacterTextSplitter.
    Recursively splits text by different separators to maintain semantic coherence.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ):
        """
        Initialize the Chunker with recursive text splitting.
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of overlapping characters between chunks
        """
        # Initialize recursive text splitter
        # Tries to split by these separators in order (markdown hierarchy, paragraphs, sentences, words, chars)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",      # Paragraph
                "\n",        # Line break
                ". ",        # Sentence
                " ",         # Word
                ""           # Character
            ]
        )
    
    def chunk(self, markdown_content: str) -> List[str]:
        """
        Split markdown content using recursive character splitting.
        
        Args:
            markdown_content: The markdown content to chunk
        
        Returns:
            List[str]: List of text chunks
        """
        if not markdown_content or not markdown_content.strip():
            return []
        
        try:
            chunks = self.text_splitter.split_text(markdown_content)
            return [chunk.strip() for chunk in chunks if chunk.strip()]
        except Exception as e:
            print(f"Error in chunking: {e}")
            return []
