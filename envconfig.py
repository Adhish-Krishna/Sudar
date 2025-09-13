from dotenv import load_dotenv
import os

load_dotenv()

TAVILY_API_KEY=os.getenv("TAVILY_API_KEY")
MODEL_PROVIDER=os.getenv("MODEL_PROVIDER")
OLLAMA_MODEL=os.getenv("OLLAMA_MODEL")
GOOGLE_API_KEY=os.getenv("GOOGLE_API_KEY")
GOOGLE_MODEL_NAME=os.getenv("GOOGLE_MODEL_NAME")
GROQ_API_KEY=os.getenv("GROQ_API_KEY")
GROQ_MODEL_NAME=os.getenv("GROQ_MODEL_NAME")
MEM0_API_KEY=os.getenv("MEM0_API_KEY")
QDRANT_URL=os.getenv("QDRANT_URL")
MONGO_DB_URI=os.getenv("MONGO_DB_URI")
MINIO_URL=os.getenv("MINIO_URL")
MINIO_ACCESS_KEY=os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY=os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET_NAME=os.getenv("MINIO_BUCKET_NAME")
MD_TO_PDF_URL=os.getenv("MD_TO_PDF_URL")
#env only for testing
USER_ID = os.getenv("USER_ID")
CHAT_ID = os.getenv("CHAT_ID")