# Streaming Chat Integration Guide

This guide explains how to integrate the new streaming hooks into your Chat.tsx component.

## Overview

The new streaming architecture consists of:

1. **`useStreamingChat`** - Handles real-time streaming from the agent
2. **`useLoadChatHistory`** - Loads historical messages from database
3. **`StreamingMessageRenderer`** - Renders messages with proper chunk handling

## Key Changes

### 1. Database now stores raw chunks

The backend now stores the exact same chunks that are streamed to the client. Each message in the database has:

```typescript
{
  messageType: 'agent',
  agentMessage: {
    flowType: 'doubt_clearance' | 'worksheet_generation',
    steps: [
      {
        step: 1,
        phase: 'research' | 'generation' | 'answer',
        type: 'text-delta' | 'tool-input-available' | 'tool-output-available' | 'finish',
        timestamp: Date,
        chunkData: { ...rawChunkFromAISDK }
      }
    ]
  }
}
```

### 2. Chunk Types

The streaming system now uses AI SDK's native chunk types:

- **`text-delta`** - Text content chunks (has `textDelta` or `delta` property)
- **`tool-input-available`** - Tool call initiated (has `toolName`, `toolCallId`, `input`)
- **`tool-output-available`** - Tool result received (has `toolCallId`, `output`, `toolName`)
- **`finish`** - Stream completed (has `finishReason`)

Skipped chunk types (not stored or rendered):
- `start`, `start-step`, `finish-step` - Metadata chunks

## Integration Steps for Chat.tsx

### Step 1: Import the hooks

```typescript
import { useStreamingChat, ProcessedMessage } from '@/hooks/useStreamingChat';
import { useLoadChatHistory } from '@/hooks/useLoadChatHistory';
import { StreamingMessageRenderer } from '@/components/chat/StreamingMessageRenderer';
```

### Step 2: Replace message state management

**Before:**
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [isStreaming, setIsStreaming] = useState(false);
const [currentResponse, setCurrentResponse] = useState("");
// ... many other state variables for phases, etc.
```

**After:**
```typescript
// Load historical messages
const { messages, loading: loadingMessages, setMessages } = useLoadChatHistory({
    chatId,
    userId: user?.teacher_id,
    subjectId: subject_id
});

// Handle streaming
const { streamingState, sendMessage: streamMessage, stopStreaming } = useStreamingChat({
    chatId: chatId!,
    classroomId: classroom_id!,
    subjectId: subject_id!,
    onMessageComplete: (message) => {
        // Add completed message to history
        setMessages(prev => [...prev, message]);
    },
    onError: (error) => {
        console.error('Stream error:', error);
    }
});
```

### Step 3: Update sendMessage function

**Before:**
```typescript
const sendMessage = async (message: string) => {
    // Complex SSE handling with many event types
    const abortFn = await sudarAgent.streamChat(
        request,
        {
            onEvent: (event) => {
                // Handle many different event types
                switch (event.type) {
                    case 'start': ...
                    case 'token': ...
                    case 'tool_call': ...
                    // etc.
                }
            }
        }
    );
};
```

**After:**
```typescript
const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ProcessedMessage = {
        role: 'user',
        content: message
    };
    setMessages(prev => [...prev, userMessage]);

    // Stream response (hook handles everything)
    await streamMessage(message, flowType, researchMode);
};
```

### Step 4: Update message rendering

**Before:**
```typescript
{messages.map((msg, idx) => (
    <>
        {msg.role === 'user' && <div>{msg.content}</div>}
        {msg.role === 'assistant' && (
            <>
                {msg.researchContent && <ResearchPhaseRenderer ... />}
                {msg.generationContent && <GenerationPhaseRenderer ... />}
                {/* Complex conditional rendering */}
            </>
        )}
    </>
))}
```

**After:**
```typescript
{messages.map((msg, idx) => (
    <div key={idx}>
        {msg.role === 'user' ? (
            <Card className="p-4 bg-primary/10">
                {msg.content}
            </Card>
        ) : (
            <Card className="p-4">
                {msg.steps && msg.steps.length > 0 ? (
                    <StreamingMessageRenderer
                        steps={msg.steps}
                        isStreaming={false}
                    />
                ) : (
                    <p>{msg.content}</p>
                )}
            </Card>
        )}
    </div>
))}

{/* Streaming message */}
{streamingState.isStreaming && (
    <Card className="p-4 border-primary">
        <StreamingMessageRenderer
            steps={streamingState.accumulatedSteps}
            isStreaming={true}
            currentPhase={streamingState.currentPhase}
        />
    </Card>
)}
```

## Benefits

1. **Consistency** - Database and streaming use identical chunk structure
2. **Simplicity** - No need to track phases, tool calls, etc. manually
3. **Reusability** - Same renderer for streaming and historical messages
4. **Maintainability** - Single source of truth for chunk types
5. **Extensibility** - Easy to add new chunk types

## Chunk Rendering

The `StreamingMessageRenderer` component automatically handles:

- **Tool Calls** - Shows tool name, arguments, and phase badge
- **Tool Results** - Shows tool name, output (markdown or JSON), and phase badge
- **Text Content** - Accumulates and renders as markdown
- **Streaming Indicators** - Shows loading animation and current phase
- **Finish Events** - Shows completion status

## Example Output

When rendering a message with these chunks:
```json
[
  { "type": "tool-input-available", "toolName": "search", "input": {...}, "phase": "research" },
  { "type": "tool-output-available", "toolName": "search", "output": "...", "phase": "research" },
  { "type": "text-delta", "textDelta": "Based on the research...", "phase": "answer" },
  { "type": "finish", "finishReason": "stop" }
]
```

You'll see:
1. A blue card showing "Tool Call: search" with the input
2. A green card showing "Tool Result: search" with the output
3. A text card with "Based on the research..." rendered as markdown
4. A small "Completed: stop" indicator

## Migration Checklist

- [ ] Import new hooks and components
- [ ] Replace message state with `useLoadChatHistory`
- [ ] Replace streaming logic with `useStreamingChat`
- [ ] Update message rendering to use `StreamingMessageRenderer`
- [ ] Remove old phase tracking state (researchPhaseData, generationPhaseData, etc.)
- [ ] Remove old SSE event handling code
- [ ] Test streaming with both flow types
- [ ] Test loading historical messages
- [ ] Verify tool calls render correctly
- [ ] Verify text accumulation works

## See Also

- `SimplifiedChatExample.tsx` - Complete working example
- `useStreamingChat.ts` - Hook documentation
- `StreamingMessageRenderer.tsx` - Renderer component
