"""
MinIO Storage Module for RAG Service
Handles uploading and managing files in MinIO object storage
"""
import os
import tempfile
from typing import Optional
from minio import Minio
from minio.commonconfig import Tags
from minio.error import S3Error


class MinIOStorage:
    """MinIO storage handler for uploaded documents."""
    
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket_name: str,
        secure: bool = False
    ):
        """Initialize MinIO client.
        
        Args:
            endpoint: MinIO server endpoint (without http://)
            access_key: MinIO access key
            secret_key: MinIO secret key
            bucket_name: Bucket name for storing documents
            secure: Whether to use HTTPS (default: False)
        """
        self.bucket_name = bucket_name
        self.client = Minio(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"Created MinIO bucket: {self.bucket_name}")
        except S3Error as e:
            print(f"Error checking/creating bucket: {e}")
    
    def upload_file(
        self,
        file_content: bytes,
        filename: str,
        user_id: str,
        chat_id: str,
        classroom_id: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> dict:
        """Upload a file to MinIO.
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            user_id: User identifier
            chat_id: Chat identifier
            classroom_id: Optional classroom identifier
            content_type: MIME type of the file
            
        Returns:
            Dict with upload details
        """
        try:
            # Create object name with user/classroom/chat structure
            if classroom_id:
                object_name = f"{user_id}/{classroom_id}/{chat_id}/{filename}"
            else:
                object_name = f"{user_id}/{chat_id}/{filename}"
            
            # Prepare tags
            tags = Tags(for_object=True)
            tags["user_id"] = user_id
            tags["chat_id"] = chat_id
            if classroom_id:
                tags["classroom_id"] = classroom_id
            tags["type"] = "uploaded_document"
            tags["filename"] = filename
            
            # Determine content type if not provided
            if not content_type:
                content_type = self._get_content_type(filename)
            
            # Write to temporary file for upload
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            
            try:
                # Upload to MinIO
                self.client.fput_object(
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    file_path=temp_file_path,
                    content_type=content_type,
                    tags=tags
                )
                
                return {
                    "success": True,
                    "bucket": self.bucket_name,
                    "object_name": object_name,
                    "filename": filename,
                    "size": len(file_content),
                    "url": f"/{self.bucket_name}/{object_name}"
                }
            finally:
                # Clean up temp file
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    
        except S3Error as e:
            return {
                "success": False,
                "error": f"MinIO upload failed: {str(e)}",
                "filename": filename
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Upload failed: {str(e)}",
                "filename": filename
            }
    
    def _get_content_type(self, filename: str) -> str:
        """Determine content type from filename extension.
        
        Args:
            filename: The filename
            
        Returns:
            MIME type string
        """
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        
        content_types = {
            'pdf': 'application/pdf',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc': 'application/msword',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'ppt': 'application/vnd.ms-powerpoint',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'csv': 'text/csv',
            'json': 'application/json',
            'xml': 'application/xml',
            'html': 'text/html',
            'htm': 'text/html',
        }
        
        return content_types.get(extension, 'application/octet-stream')
    
    def delete_file(self, object_name: str) -> dict:
        """Delete a file from MinIO.
        
        Args:
            object_name: Full object path in MinIO
            
        Returns:
            Dict with deletion status
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            return {
                "success": True,
                "message": f"File {object_name} deleted successfully"
            }
        except S3Error as e:
            return {
                "success": False,
                "error": f"Deletion failed: {str(e)}"
            }
    
    def list_files(self, user_id: str, chat_id: Optional[str] = None) -> list:
        """List files for a user/chat.
        
        Args:
            user_id: User identifier
            chat_id: Optional chat identifier
            
        Returns:
            List of file objects
        """
        try:
            prefix = f"{user_id}/{chat_id}/" if chat_id else f"{user_id}/"
            objects = self.client.list_objects(
                self.bucket_name,
                prefix=prefix,
                recursive=True
            )
            
            files = []
            for obj in objects:
                files.append({
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified,
                    "etag": obj.etag
                })
            
            return files
        except S3Error as e:
            print(f"Error listing files: {e}")
            return []
