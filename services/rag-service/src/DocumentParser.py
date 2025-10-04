"""
DocumentParser.py - Handles document parsing using Docling
"""
import tempfile
import os
from pathlib import Path
from docling.document_converter import DocumentConverter


class DocumentParser:
    """
    A class responsible for parsing various document formats into markdown.
    Supports: PDF, DOCX, PPTX, XLSX, Markdown, TXT
    """
    
    def __init__(self):
        """Initialize the DocumentConverter from Docling."""
        self.converter = DocumentConverter()
    
    def parse(self, file_content: bytes, filename: str) -> str:
        """
        Parse a file and convert it to markdown format.
        
        Args:
            file_content: The binary content of the file
            filename: The name of the file (used to determine file type)
        
        Returns:
            str: The parsed content in markdown format
        
        Raises:
            ValueError: If the file format is not supported
        """
        # Supported extensions
        supported_extensions = ['.pdf', '.docx', '.pptx', '.xlsx', '.md', '.txt']
        
        # Check if file extension is supported
        if not any(filename.lower().endswith(ext) for ext in supported_extensions):
            raise ValueError(f"Unsupported file format. Supported formats: {', '.join(supported_extensions)}")
        
        # Get file extension
        file_ext = Path(filename).suffix
        
        # Create a temporary file with the correct extension
        # Docling requires a file path, not bytes
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name
        
        try:
            # Convert document to markdown using file path
            result = self.converter.convert(temp_path)
            
            # Export to markdown format
            markdown_content = result.document.export_to_markdown()
            
            return markdown_content
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
