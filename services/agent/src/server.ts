import express from "express";
import type {Request, Response} from 'express';
import dotenv from 'dotenv';
import { initializeDatabase, healthCheck, waitForConnection } from './config/db';
import { doubtClearanceFlow } from './flows/doubtClearanceFlow';
import { worksheetFlow } from './flows/worksheetFlow';
import type { UserContext } from './mcpClient';

dotenv.config();

interface ChatRequest {
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  classroom_id: string;
  query: string;
  flow_type?: 'doubt_clearance' | 'worksheet_generation';
}

interface ChatResponse {
  user_id: string;
  chat_id: string;
  subject_id?: string | null;
  response: string;
}

const PORT = process.env.PORT? parseInt(process.env.PORT) : 3003;

const app = express();

app.use(express.json());

app.get("/health", async (_req: Request, res: Response)=>{
    try {
        const dbHealth = await healthCheck();
        return res.status(200).json({
            message: "Agent service is healthy",
            database: dbHealth
        });
    } catch (error) {
        return res.status(500).json({
            message: "Agent service is unhealthy",
            database: {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown database error'
            }
        });
    }
});

// Streaming chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
    try {
        // Ensure database connection is ready
        await waitForConnection();
        
        const { user_id, chat_id, subject_id, classroom_id, query, flow_type }: ChatRequest = req.body;

        if (!user_id || !chat_id || !classroom_id || !query) {
            return res.status(400).json({
                error: 'Missing required fields: user_id, chat_id, classroom_id, query'
            });
        }

        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
        });

        const userContext: UserContext = {
            userId: user_id,
            chatId: chat_id,
            subjectId: subject_id || '',
            classroomId: classroom_id
        };

        // Determine flow type
        const selectedFlowType = flow_type || 'doubt_clearance';

        try {
            // Send start event
            res.write(`data: ${JSON.stringify({ type: 'start', content: '' })}\n\n`);

            if (selectedFlowType === 'worksheet_generation') {
                // Use worksheet flow
                for await (const step of worksheetFlow({
                    query,
                    userContext
                })) {
                    if (step.type === 'text') {
                        res.write(`data: ${JSON.stringify({ type: 'token', content: step.text || '' })}\n\n`);
                    } else if (step.type === 'status') {
                        res.write(`data: ${JSON.stringify({ type: 'status', content: step.status || '' })}\n\n`);
                    } else if (step.type === 'finish') {
                        res.write(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`);
                        break;
                    }
                }
            } else {
                // Use doubt clearance flow (default)
                for await (const step of doubtClearanceFlow({
                    query,
                    userContext
                })) {
                    if (step.type === 'text') {
                        res.write(`data: ${JSON.stringify({ type: 'token', content: step.text || '' })}\n\n`);
                    } else if (step.type === 'status') {
                        res.write(`data: ${JSON.stringify({ type: 'status', content: step.status || '' })}\n\n`);
                    } else if (step.type === 'finish') {
                        res.write(`data: ${JSON.stringify({ type: 'done', content: '' })}\n\n`);
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error in chat flow:', error);
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                content: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
            })}\n\n`);
        }

        res.end();
        return;
    } catch (error) {
        console.error('Error setting up chat:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Synchronous chat endpoint
app.post("/api/chat/sync", async (req: Request, res: Response) => {
    try {
        // Ensure database connection is ready
        await waitForConnection();
        
        const { user_id, chat_id, subject_id, classroom_id, query, flow_type }: ChatRequest = req.body;

        if (!user_id || !chat_id || !classroom_id || !query) {
            return res.status(400).json({
                error: 'Missing required fields: user_id, chat_id, classroom_id, query'
            });
        }

        const userContext: UserContext = {
            userId: user_id,
            chatId: chat_id,
            subjectId: subject_id || '',
            classroomId: classroom_id
        };

        let fullResponse = '';
        const selectedFlowType = flow_type || 'doubt_clearance';

        try {
            if (selectedFlowType === 'worksheet_generation') {
                // Use worksheet flow
                for await (const step of worksheetFlow({
                    query,
                    userContext
                })) {
                    if (step.type === 'text') {
                        fullResponse += step.text || '';
                    }
                }
            } else {
                // Use doubt clearance flow (default)
                for await (const step of doubtClearanceFlow({
                    query,
                    userContext
                })) {
                    if (step.type === 'text') {
                        fullResponse += step.text || '';
                    }
                }
            }

            const response: ChatResponse = {
                user_id,
                chat_id,
                subject_id,
                response: fullResponse
            };

            return res.status(200).json(response);
        } catch (error) {
            console.error('Error in sync chat flow:', error);
            return res.status(500).json({
                error: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    } catch (error) {
        console.error('Error setting up sync chat:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Initialize database connection and start server
const startServer = async () => {
  console.log('🚀 Initializing database connection...');
  
  try {
    // Initialize database with event listeners
    initializeDatabase();
    
    // Wait for initial connection
    await waitForConnection();
    
    console.log('✅ Database connected successfully');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Agent service running at port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

