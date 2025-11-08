# Chat Routes Documentation

All chat routes require authentication via the auth middleware (access token in cookies).

## Routes Overview

### 1. Stream Chat (POST)
**Endpoint:** `POST /api/chat/sse`

Stream chat messages with AI using Server-Sent Events.

**Request Body:**
```json
{
  "chat_id": "string (UUID)",
  "subject_id": "string",
  "classroom_id": "string",
  "query": "string",
  "flow_type": "doubt_clearance | worksheet_generation (optional)"
}
```

**Response:** Server-Sent Events stream with unified event format
```json
{
  "type": "start|status|token|phase_change|metadata|done|error|tool_call|tool_result",
  "flowType": "doubt_clearance|worksheet_generation",
  "content": "string",
  "metadata": {}
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/chat/sse \
  -H "Content-Type: application/json" \
  -b "access_token=your_token" \
  -d '{
    "chat_id": "123e4567-e89b-12d3-a456-426614174000",
    "subject_id": "math",
    "classroom_id": "class-101",
    "query": "What is calculus?",
    "flow_type": "doubt_clearance"
  }'
```

---

### 2. Get Chat Messages (GET)
**Endpoint:** `GET /api/chat/:chat_id/messages`

Retrieve all messages for a specific chat conversation.

**Path Parameters:**
- `chat_id` (string, required): The unique chat ID

**Response:**
```json
{
  "success": true,
  "chatId": "string",
  "totalMessages": 10,
  "messages": [
    {
      "messageId": "string",
      "messageType": "user|agent",
      "userMessage": {
        "query": "string",
        "inputFiles": [],
        "timestamp": "ISO-8601 date"
      },
      "agentMessage": {
        "flowType": "doubt_clearance",
        "startTime": "ISO-8601 date",
        "totalSteps": 5,
        "steps": [],
        "fullResponse": "string",
        "executionSummary": {}
      },
      "timestamp": "ISO-8601 date"
    }
  ],
  "metadata": {
    "totalMessages": 10,
    "totalUserQueries": 5,
    "totalAgentResponses": 5,
    "totalFilesProcessed": 2,
    "conversationStartTime": "ISO-8601 date",
    "lastActivityTime": "ISO-8601 date"
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/chat/123e4567-e89b-12d3-a456-426614174000/messages" \
  -b "access_token=your_token"
```

---

### 3. Get Chats by Subject (GET)
**Endpoint:** `GET /api/chat/subject/:subject_id`

Retrieve all chat conversations for a specific subject.

**Path Parameters:**
- `subject_id` (string, required): The subject ID

**Query Parameters:**
- `page` (number, optional): Page number for pagination (default: 1)
- `limit` (number, optional): Number of chats per page (default: 20)

**Response:**
```json
{
  "success": true,
  "subject_id": "math",
  "totalChats": 5,
  "page": 1,
  "limit": 20,
  "chats": [
    {
      "chatId": "string",
      "title": "Chat 11/8/2025",
      "description": "string",
      "tags": ["tag1", "tag2"],
      "totalMessages": 10,
      "totalUserQueries": 5,
      "totalAgentResponses": 5,
      "conversationStartTime": "ISO-8601 date",
      "lastActivityTime": "ISO-8601 date",
      "status": "active|archived|deleted"
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:8000/api/chat/subject/math?page=1&limit=10" \
  -b "access_token=your_token"
```

---

### 4. Delete Chat (DELETE)
**Endpoint:** `DELETE /api/chat/:chat_id`

Delete (archive) a chat conversation. This performs a soft delete by setting the status to 'archived'.

**Path Parameters:**
- `chat_id` (string, required): The unique chat ID

**Response:**
```json
{
  "success": true,
  "message": "Chat conversation deleted successfully",
  "chatId": "string",
  "status": "archived"
}
```

**Example:**
```bash
curl -X DELETE "http://localhost:8000/api/chat/123e4567-e89b-12d3-a456-426614174000" \
  -b "access_token=your_token"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required parameter: chat_id"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token not found in cookies"
}
```

### 404 Not Found
```json
{
  "error": "Chat conversation not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Authentication

All routes require authentication via HTTP-only cookies:
- Cookie name: `access_token`
- The token is verified with the backend at `/api/auth/verify-token`
- User ID is extracted and attached to the request object (`req.user_id`)

---

## Database Schema

Chat conversations are stored in MongoDB with the following structure:

```typescript
{
  chatId: string (UUID),
  userId: string,
  subjectId: string,
  classroomId: string,
  title: string,
  messages: [
    {
      messageId: string,
      messageType: 'user' | 'agent',
      userMessage: { query, inputFiles, timestamp },
      agentMessage: { flowType, steps, fullResponse, executionSummary },
      timestamp: Date
    }
  ],
  conversationMetadata: {
    totalMessages: number,
    totalUserQueries: number,
    totalAgentResponses: number,
    totalFilesProcessed: number,
    conversationStartTime: Date,
    lastActivityTime: Date
  },
  status: 'active' | 'archived' | 'deleted'
}
```

---

## Usage Flow

1. **Authenticate** - Obtain access token from `/api/auth/login`
2. **Stream Chat** - POST to `/api/chat/sse` with chat parameters
3. **Get Messages** - GET `/api/chat/:chat_id/messages` to retrieve conversation
4. **Get Subject Chats** - GET `/api/chat/subject/:subject_id` to list all chats in a subject
5. **Delete Chat** - DELETE `/api/chat/:chat_id` to archive a conversation
