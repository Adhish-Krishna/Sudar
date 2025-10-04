# Sudar Tools MCP Server

An MCP (Model Context Protocol) server built with FastMCP that provides web search, website scraping, and content saving tools via HTTP transport.

## Features

- **Web Search Tool**: Search the web using Tavily API
- **Website Scraper Tool**: Scrape content from multiple URLs
- **Content Saver Tool**: Convert markdown to PDF and save to MinIO storage

## Installation

1. Install dependencies:
```bash
uv pip install -e .
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your configuration to the `.env` file:
```
TAVILY_API_KEY=your_actual_api_key
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=sudar-content
MD_TO_PDF_URL=http://localhost:3000/convert
```

## Usage

### Running the Server

```bash
python run.py
```

The server will start on `http://localhost:3002` by default.

### Available Tools

#### 1. Web Search
Search the web using Tavily API.

**Parameters:**
- `query` (string): The search query
- `max_results` (int, optional): Maximum number of results (default: 5)

**Example:**
```json
{
  "query": "latest AI developments 2024",
  "max_results": 5
}
```

#### 2. Website Scraper
Scrape content from one or more URLs.

**Parameters:**
- `urls` (array of strings): List of URLs to scrape

**Example:**
```json
{
  "urls": ["https://example.com", "https://example.org"]
}
```

#### 3. Content Saver
Convert markdown content to PDF and save to MinIO storage.

**Parameters:**
- `content` (string): Markdown-formatted content
- `title` (string): Title for the PDF file
- `user_id` (string, optional): User ID for organizing content
- `chat_id` (string, optional): Chat ID for organizing content

**Example:**
```json
{
  "content": "# My Document\n\nThis is some **markdown** content.",
  "title": "My Assignment",
  "user_id": "user123",
  "chat_id": "chat456"
}
```

**Returns:**
- `success`: Whether the operation succeeded
- `message`: Success or error message
- `bucket`: MinIO bucket name
- `object_name`: Full path in MinIO (e.g., `user123/chat456/My Assignment.pdf`)
- `filename`: The PDF filename
- `url`: Direct URL to access the PDF

## Configuration

Environment variables:
- `TAVILY_API_KEY`: Your Tavily API key (required)
- `MINIO_URL`: MinIO server URL (default: http://localhost:9000)
- `MINIO_ACCESS_KEY`: MinIO access key (default: minioadmin)
- `MINIO_SECRET_KEY`: MinIO secret key (default: minioadmin)
- `MINIO_BUCKET_NAME`: MinIO bucket name (default: sudar-content)
- `MD_TO_PDF_URL`: MD to PDF conversion service URL (default: http://localhost:3000/convert)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 3002)

## Docker Deployment

### Using Docker Compose (Recommended)

From the root of the Sudar project:

```bash
docker-compose up -d sudar-tools-mcp-server
```

This will automatically start the MCP server along with its dependencies (MinIO and md-to-pdf service).

### Building the Docker Image

```bash
cd services/sudar-tools-mcp-server
docker build -t sudar-tools-mcp-server .
```

### Running the Container

```bash
docker run -d \
  -p 3002:3002 \
  -e TAVILY_API_KEY=your_key \
  -e MINIO_URL=http://minio:9000 \
  -e MINIO_ACCESS_KEY=minioadmin \
  -e MINIO_SECRET_KEY=minioadmin \
  -e MD_TO_PDF_URL=http://md-to-pdf:3000/convert \
  --name sudar-tools-mcp \
  --network sudar-network \
  sudar-tools-mcp-server
```

## Development

The server uses FastMCP with HTTP transport (SSE), making it accessible via standard HTTP requests.

### Dependencies

The MCP server depends on:
- **MinIO**: Object storage for saving PDF files
- **md-to-pdf**: Service for converting markdown to PDF

Make sure these services are running before starting the MCP server.

