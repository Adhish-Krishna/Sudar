# Sudar Agent Service

A Node.js/TypeScript AI agent service for educational assistance using AI SDK v5.

## Features

- **Streaming Chat API**: Real-time conversational AI with Server-Sent Events (SSE)
- **Dual Flow Support**: Doubt clearance and worksheet generation workflows
- **Authentication Middleware**: Cookie-based authentication with backend verification
- **CORS Support**: Configurable cross-origin resource sharing
- **Health Checks**: Built-in health monitoring endpoint

## API Endpoints

### POST /api/chat/sse
Streaming chat endpoint for AI conversations.

**Request Body:**
```json
{
  "chat_id": "string",
  "subject_id": "string",
  "classroom_id": "string",
  "query": "string",
  "flow_type": "doubt_clearance | worksheet_generation (optional)"
}
```

**Response:** Server-Sent Events stream with unified event format:
```json
{
  "type": "start|status|token|phase_change|metadata|done|error",
  "flowType": "doubt_clearance|worksheet_generation",
  "content": "string",
  "metadata": {}
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "message": "Agent service is healthy",
  "database": {
    "status": "healthy|unhealthy",
    "details": "..."
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3003` |
| `BACKEND_URL` | Backend service URL for auth verification | `http://localhost:8000/api` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | Required for Google provider |
| `MCP_TOOLS_URL` | MCP tools service URL | Required |
| `MONGODB_URI` | MongoDB connection URI | Required |

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database
- MongoDB
- Required AI service APIs

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

## Docker

### Build
```bash
docker build -t sudar-agent .
```

### Run
```bash
docker run -p 3003:3003 sudar-agent
```

### Docker Compose
The service is included in the main `docker-compose.yml` file and will be started with:
```bash
docker-compose up agent
```

## Architecture

- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **AI SDK v5**: AI model integration
- **Server-Sent Events**: Real-time streaming
- **Cookie Authentication**: Secure token handling
- **Multi-stage Docker**: Optimized production builds

## Security

- HTTP-only cookies for authentication
- CORS configuration for frontend access
- Input validation and sanitization
- Secure token verification with backend
- Non-root container execution