"""
Backend Worker - Consumer for ingest success events
Updates chat_files table when files are successfully indexed
"""
import os
import json
from kafka import KafkaConsumer
from dotenv import load_dotenv

from api.database import SessionLocal
from api.models import ChatFile, Chat

# Load environment variables
load_dotenv()

# Initialize Kafka consumer for ingest success events
kafka_bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")

success_consumer = KafkaConsumer(
    'ingest_success',
    bootstrap_servers=[kafka_bootstrap_servers],
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='earliest',
    enable_auto_commit=True,
    group_id='backend-success-processor-group'
)


def process_ingest_success(success_event):
    """
    Process ingest success event: Insert or update chat_files table with indexed = true.
    
    Args:
        success_event: Success event data from Kafka containing:
            - job_id: Job identifier
            - user_id: User who submitted the job
            - chat_id: Chat identifier
            - subject_id: Subject identifier
            - filename: Original filename
            - minio_object_name: Path in MinIO storage
            - content_type: File content type
            - inserted_count: Number of chunks inserted
            - status: "success"
    
    Returns:
        Result dict with update status
    """
    job_id = success_event.get("job_id")
    chat_id = success_event.get("chat_id")
    subject_id = success_event.get("subject_id")
    filename = success_event.get("filename")
    minio_object_name = success_event.get("minio_object_name")
    
    db = SessionLocal()
    try:
        # Check if chat exists, if not create it
        chat = db.query(Chat).filter(Chat.chat_id == chat_id).first()
        
        if not chat:
            # Create new chat record
            chat = Chat(
                chat_id=chat_id,
                subject_id=subject_id,
                chat_name=f"Chat {filename}"  # Default chat name based on first file
            )
            db.add(chat)
            db.commit()
            db.refresh(chat)
            print(f"Created new chat {chat_id} for subject {subject_id}")
        
        # Check if chat_file already exists using ORM
        chat_file = db.query(ChatFile).filter(
            ChatFile.chat_id == chat_id,
            ChatFile.minio_path == minio_object_name
        ).first()
        
        if chat_file:
            # Update existing record
            chat_file.indexed = True
            db.commit()
            db.refresh(chat_file)
            result_action = "updated"
            file_id = str(chat_file.file_id)
            print(f"Updated chat_file {file_id} - indexed set to TRUE")
        else:
            # Create new chat_file record using ORM
            from api.models import ChatType
            
            chat_file = ChatFile(
                chat_id=chat_id,
                minio_path=minio_object_name,
                type=ChatType.Input,
                indexed=True
            )
            db.add(chat_file)
            db.commit()
            db.refresh(chat_file)
            result_action = "created"
            file_id = str(chat_file.file_id)
            print(f"Created new chat_file {file_id} with indexed = TRUE")
        
        return {
            "status": "success",
            "action": result_action,
            "job_id": job_id,
            "chat_file_id": file_id,
            "chat_id": str(chat_id),
            "filename": filename
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error processing ingest success for job {job_id}: {str(e)}")
        raise
    
    finally:
        db.close()


def run_success_consumer():
    """
    Run the ingest success consumer.
    Listens to 'ingest_success' topic and processes events.
    """
    print("Backend Worker started - listening for ingest success events...")
    print(f"Kafka Bootstrap Servers: {kafka_bootstrap_servers}")
    print(f"Topic: ingest_success")
    print("-" * 60)
    
    try:
        for message in success_consumer:
            success_event = message.value
            job_id = success_event.get('job_id', 'unknown')
            print(f"\n[{job_id}] Received ingest success event")
            try:
                result = process_ingest_success(success_event)
                print(f"[{job_id}] Successfully {result['action']} chat_file: {result['chat_file_id']}")
            except Exception as e:
                print(f"[{job_id}] Failed to process ingest success: {str(e)}")
    except KeyboardInterrupt:
        print("\n\nShutting down Backend Worker...")
    finally:
        success_consumer.close()
        print("Backend Worker stopped.")


if __name__ == "__main__":
    run_success_consumer()
