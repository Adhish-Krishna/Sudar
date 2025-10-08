# RAG Microservice

A powerful microservice for Retrieval-Augmented Generation (RAG) that handles document ingestion and context retrieval through REST API endpoints.

## Features

- **Document Ingestion**: Parse and process multiple document formats (PDF, DOCX, PPTX, XLSX, Markdown, TXT)
- **Intelligent Chunking**: Smart document chunking that respects semantic boundaries
- **Vector Embeddings**: Generate embeddings using Ollama models
- **Vector Storage**: Store and manage embeddings in Qdrant vector database
- **Context Retrieval**: Search and retrieve relevant context with reranking
- **REST API**: FastAPI-based RESTful endpoints for all operations

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         FastAPI Server              │
│  ┌──────────────────────────────┐   │
│  │  /ingest                     │   │
│  │  /retrieve                   │   │
│  │  /delete/{user_id}/{chat_id} │   │
│  │  /list/{user_id}/{chat_id}   │   │
│  └──────────────────────────────┘   │
└──────┬──────────────────────────────┘
       │
       ├──────────────┬───────────────┬──────────────┐
       ▼              ▼               ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  Document  │ │  Chunker   │ │  Embedder  │ │ Retriever  │
│   Parser   │ │            │ │            │ │            │
└────────────┘ └────────────┘ └─────┬──────┘ └─────┬──────┘
                                     │              │
                                     ▼              ▼
                              ┌──────────────────────────┐
                              │   Qdrant Vector DB       │
                              │   (localhost:6333)       │
                              └──────────────────────────┘
                                     ▲
                                     │
                              ┌──────┴──────┐
                              │   Ollama    │
                              │(localhost:11434)│
                              └─────────────┘
```

## Prerequisites

- Python 3.10 or higher
- [Qdrant](https://qdrant.tech/) running at `localhost:6333`
- [Ollama](https://ollama.ai/) running at `localhost:11434`
- Ollama embedding model installed (default: `nomic-embed-text`)

## Installation

1. **Clone the repository**:
   ```bash
   cd b:\ApplicationDevelopmentLaboratory\Sudar\services\rag-service
   ```

2. **Install dependencies**:
   ```bash
   pip install -e .
   ```

3. **Set up Qdrant** (if not already running):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

4. **Set up Ollama** (if not already running):
   - Download and install from [ollama.ai](https://ollama.ai/)
   - Pull the embedding model:
     ```bash
     ollama pull nomic-embed-text
     ```

5. **Configure environment variables**:
   - The `.env` file is already created with default settings
   - Modify if needed for your setup

## Environment Variables

The `.env` file contains the following configuration:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL_NAME=nomic-embed-text
EMBEDDING_DIMENSION=768

# Qdrant Configuration
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=rag_documents

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

## Usage

### Starting the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### 1. Health Check
```http
GET /
GET /health
```

### 2. Ingest Document
```http
POST /ingest
Content-Type: multipart/form-data

Parameters:
- file: File (PDF, DOCX, PPTX, XLSX, MD, TXT)
- user_id: string
- chat_id: string

Response:
{
  "status": "success",
  "message": "Successfully embedded and stored N chunks",
  "inserted_count": N,
  "user_id": "user123",
  "chat_id": "chat456",
  "filename": "document.pdf"
}
```

**Example (PowerShell)**:
```powershell
$headers = @{}
$form = @{
    file = Get-Item -Path "document.pdf"
    user_id = "user123"
    chat_id = "chat456"
}
Invoke-RestMethod -Uri "http://localhost:8000/ingest" -Method Post -Form $form
```

**Example (curl)**:
```bash
curl -X POST "http://localhost:8000/ingest" \
  -F "file=@document.pdf" \
  -F "user_id=user123" \
  -F "chat_id=chat456"
```

### 3. Retrieve Context
```http
POST /retrieve
Content-Type: application/json

Body:
{
  "query": "What is the main topic?",
  "user_id": "user123",
  "chat_id": "chat456",
  "top_k": 5
}

Response:
{
  "status": "success",
  "query": "What is the main topic?",
  "user_id": "user123",
  "chat_id": "chat456",
  "results": [
    {
      "id": "...",
      "text": "Chunk content...",
      "score": 0.95,
      "vector_score": 0.93,
      "rerank_score": 0.98,
      "metadata": {
        "user_id": "user123",
        "chat_id": "chat456",
        "chunk_index": 0,
        "type": "InsertedData"
      }
    }
  ],
  "count": 5
}
```

**Example (PowerShell)**:
```powershell
$body = @{
    query = "What is the main topic?"
    user_id = "user123"
    chat_id = "chat456"
    top_k = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/retrieve" -Method Post -Body $body -ContentType "application/json"
```

### 4. Delete Chat Data
```http
DELETE /delete/{user_id}/{chat_id}

Response:
{
  "status": "success",
  "message": "Deleted all chunks for user_id=user123, chat_id=chat456"
}
```

**Example (PowerShell)**:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/delete/user123/chat456" -Method Delete
```

### 5. List Chat Chunks
```http
GET /list/{user_id}/{chat_id}?limit=100

Response:
{
  "status": "success",
  "user_id": "user123",
  "chat_id": "chat456",
  "chunks": [...],
  "count": 10
}
```

**Example (PowerShell)**:
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/list/user123/chat456?limit=100"
```

## Components

### DocumentParser
- **Purpose**: Parse various document formats into markdown
- **Supported Formats**: PDF, DOCX, PPTX, XLSX, MD, TXT
- **Technology**: Docling library

### Chunker
- **Purpose**: Intelligently chunk markdown content
- **Strategy**: 
  - Respects document structure (headers, paragraphs)
  - Configurable chunk size and overlap
  - Maintains semantic boundaries

### Embedder
- **Purpose**: Generate embeddings and store in Qdrant
- **Features**:
  - Uses Ollama for embeddings
  - Stores with user_id and chat_id as filters
  - Automatic collection management

### Retriever
- **Purpose**: Retrieve and rerank relevant chunks
- **Features**:
  - Vector similarity search
  - Keyword-based reranking
  - Combined scoring (60% vector + 40% rerank)

## Development

### Project Structure
```
rag-service/
├── main.py                 # FastAPI application
├── pyproject.toml          # Project dependencies
├── .env                    # Environment configuration
├── README.md              # This file
└── src/
    ├── __init__.py
    ├── DocumentParser.py  # Document parsing
    ├── Chunker.py         # Content chunking
    ├── Embedder.py        # Embedding and storage
    └── Retriever.py       # Context retrieval
```

### Adding New Features

1. **Custom Rerankers**: Modify `Retriever._calculate_relevance_score()`
2. **Different Embedding Models**: Update `.env` file
3. **Custom Chunking Strategies**: Modify `Chunker.chunk()`
4. **Additional Metadata**: Add fields in `Embedder.embed_and_store()`
