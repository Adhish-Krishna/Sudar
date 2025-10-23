from minio import Minio
from minio.error import S3Error
from fastapi import APIRouter, Path, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/documents", tags=["Douments"] )

MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_INPUT_BUCKET_NAME = os.getenv("MINIO_INPUT_BUCKET_NAME", "rag-documents")
MINIO_OUTPUT_BUCKET_NAME = os.getenv("MINIO_OUTPUT_BUCKET_NAME", "sudar-content")

minio_endpoint = MINIO_URL.replace("http://", "").replace("https://", "")
minio_secure = MINIO_URL.startswith("https://")

minio_client = Minio(
    endpoint=minio_endpoint,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=minio_secure
)

@router.get("/input-documents/{user_id}/{subject_id}/{chat_id}")
def get_input_documents(
    user_id: str = Path(..., description="User ID"),
    subject_id: str = Path(..., description="Classroom ID"),
    chat_id: str = Path(..., description="Chat ID")
):
    """
    Retrieve documents from the input bucket.
    
    Required parameters:
    - user_id: User ID
    - subject_id: Subject ID
    - chat_id: Chat ID
    
    Path structure: bucket_name/user_id/subject_id/chat_id
    """
    try:
        documents = []
        
        # Build the prefix from required parameters
        prefix = f"{user_id}/{subject_id}/{chat_id}/"
        
        # List objects in the input bucket with the given prefix
        objects = minio_client.list_objects(
            MINIO_INPUT_BUCKET_NAME,
            prefix=prefix,
            recursive=True
        )
        
        for obj in objects:
            # Skip directories (objects ending with /)
            if not obj.object_name.endswith('/'):
                documents.append({
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
                })
        
        return {
            "bucket": MINIO_INPUT_BUCKET_NAME,
            "prefix": prefix,
            "documents": documents,
            "count": len(documents)
        }
    
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")


@router.get("/output-documents/{user_id}/{subject_id}/{chat_id}")
def get_output_documents(
    user_id: str = Path(..., description="User ID"),
    subject_id: str = Path(..., description="Classroom ID"),
    chat_id: str = Path(..., description="Chat ID")
):
    """
    Retrieve documents from the output bucket.
    
    Required parameters:
    - user_id: User ID
    - subject_id: Classroom ID
    - chat_id: Chat ID
    
    Path structure: bucket_name/user_id/subject_id/chat_id
    """
    try:
        documents = []
        
        # Build the prefix from required parameters
        prefix = f"{user_id}/{subject_id}/{chat_id}/"
        
        # List objects in the output bucket with the given prefix
        objects = minio_client.list_objects(
            MINIO_OUTPUT_BUCKET_NAME,
            prefix=prefix,
            recursive=True
        )
        
        for obj in objects:
            # Skip directories (objects ending with /)
            if not obj.object_name.endswith('/'):
                documents.append({
                    "name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
                })
        
        return {
            "bucket": MINIO_OUTPUT_BUCKET_NAME,
            "prefix": prefix,
            "documents": documents,
            "count": len(documents)
        }
    
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")


@router.get("/download/{bucket_type}/{document_name:path}")
def download_document(
    bucket_type: str = Path(..., description="Bucket type: 'input' or 'output'"),
    document_name: str = Path(..., description="Full path of the document in the bucket")
):
    """
    Download a specific document from either input or output bucket.
    
    Parameters:
    - bucket_type: 'input' for input documents, 'output' for output documents
    - document_name: Full path of the document (e.g., user_id/subject_id/chat_id/filename.pdf)
    """
    try:
        # Determine which bucket to use
        if bucket_type.lower() == "input":
            bucket_name = MINIO_INPUT_BUCKET_NAME
        elif bucket_type.lower() == "output":
            bucket_name = MINIO_OUTPUT_BUCKET_NAME
        else:
            raise HTTPException(status_code=400, detail="bucket_type must be 'input' or 'output'")
        
        # Get the object from MinIO
        response = minio_client.get_object(bucket_name, document_name)
        
        return StreamingResponse(
            iter([response.read()]),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={document_name.split('/')[-1]}"}
        )
    
    except S3Error as e:
        if "NoSuchKey" in str(e):
            raise HTTPException(status_code=404, detail=f"Document not found: {document_name}")
        raise HTTPException(status_code=500, detail=f"MinIO error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading document: {str(e)}")