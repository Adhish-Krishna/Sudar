"""
RAG Worker - Consumer for asynchronous document ingestion
"""
import os
import json
from kafka import KafkaConsumer
from dotenv import load_dotenv
import redis

from src.DocumentParser import DocumentParser
from src.Chunker import Chunker
from src.Embedder import Embedder
from src.MinIOStorage import MinIOStorage

# Load environment variables
load_dotenv()

# Initialize components
document_parser = DocumentParser()

# Initialize recursive text splitter chunker
chunker = Chunker(chunk_size=1000, chunk_overlap=200)

embedder = Embedder()

# Initialize MinIO storage
MINIO_URL = os.getenv("MINIO_URL", "http://localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "rag-documents")

# Parse MinIO endpoint (remove http:// or https://)
minio_endpoint = MINIO_URL.replace("http://", "").replace("https://", "")
minio_secure = MINIO_URL.startswith("https://")

minio_storage = MinIOStorage(
    endpoint=minio_endpoint,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    bucket_name=MINIO_BUCKET_NAME,
    secure=minio_secure
)

# Initialize Kafka consumer
kafka_bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
consumer = KafkaConsumer(
    'ingest_jobs',
    bootstrap_servers=[kafka_bootstrap_servers],
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='earliest',
    enable_auto_commit=True,
    group_id='rag-worker-group'
)

# Initialize Redis
redis_host = os.getenv("REDIS_HOST", "localhost")
redis_port = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)

def process_ingest_job(job_data):
    """
    Process an ingestion job: parse, chunk, embed, and store.
    
    Args:
        job_data: Job data from Kafka
    
    Returns:
        Result dict
    """
    job_id = job_data["job_id"]
    user_id = job_data["user_id"]
    chat_id = job_data["chat_id"]
    classroom_id = job_data["classroom_id"]
    filename = job_data["filename"]
    file_content = job_data["file_content"].encode('latin-1')  # Decode back
    content_type = job_data["content_type"]
    
    try:
        # Update status to processing
        redis_client.setex(f"job:{job_id}", 3600, json.dumps({
            "status": "processing",
            "user_id": user_id,
            "chat_id": chat_id,
            "classroom_id": classroom_id,
            "filename": filename,
            "updated_at": str(os.times()[4])
        }))
        
        # Step 1: Parse document to markdown
        markdown_content = document_parser.parse(file_content, filename)
        
        # Step 2: Chunk the markdown content
        chunks = chunker.chunk(markdown_content)
        
        if not chunks:
            raise ValueError("No content could be extracted from the document")
        
        # Step 3: Embed and store chunks
        result = embedder.embed_and_store(
            chunks=chunks,
            user_id=user_id,
            chat_id=chat_id,
            classroom_id=classroom_id,
            metadata={"filename": filename}
        )
        
        # Update status to completed
        redis_client.setex(f"job:{job_id}", 3600, json.dumps({
            "status": "completed",
            "user_id": user_id,
            "chat_id": chat_id,
            "classroom_id": classroom_id,
            "filename": filename,
            "inserted_count": result["inserted_count"],
            "updated_at": str(os.times()[4])
        }))
        
        return result
    
    except Exception as e:
        # Update status to failed
        redis_client.setex(f"job:{job_id}", 3600, json.dumps({
            "status": "failed",
            "user_id": user_id,
            "chat_id": chat_id,
            "classroom_id": classroom_id,
            "filename": filename,
            "error": str(e),
            "updated_at": str(os.times()[4])
        }))
        raise

if __name__ == "__main__":
    print("Starting RAG Worker...")
    for message in consumer:
        job_data = message.value
        print(f"Processing job: {job_data['job_id']}")
        try:
            process_ingest_job(job_data)
            print(f"Job {job_data['job_id']} completed successfully")
        except Exception as e:
            print(f"Job {job_data['job_id']} failed: {str(e)}")