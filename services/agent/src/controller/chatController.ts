import type {Request, Response} from 'express';
import { waitForConnection } from '../config/db';
import type { UserContext } from '../mcpClient';
import { worksheetFlow } from '../flows/worksheetFlow';
import { doubtClearanceFlow } from '../flows/doubtClearanceFlow';
import { 
  getConversation, 
  getChatsBySubject as getChatsBySubjectUtil,
  countChatsBySubject,
  deleteConversation 
} from '../utils/chatUtils';
import { contentCreationFlow } from '../flows/contentCreationFlow';

interface ChatRequest {
    chat_id: string;
    subject_id: string;
    classroom_id: string;
    query: string;
    flow_type?: 'doubt_clearance' | 'worksheet_generation' | 'content_creation';
    research_mode?: 'simple' | 'moderate' | 'deep';
}

const streamChat = async (req: Request, res: Response) => {
    try {
        // Ensure database connection is ready
        await waitForConnection();

        const user_id = req.user_id!;

        const { chat_id, subject_id, classroom_id, query, flow_type, research_mode = 'moderate' }: ChatRequest = req.body;

        if (!chat_id || !classroom_id || !query) {
            return res.status(400).json({
                error: 'Missing required fields: user_id, chat_id, classroom_id, query'
            });
        }

        // Set up SSE headers
        const allowedOrigin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
        });

        const userContext: UserContext = {
            userId: user_id,
            chatId: chat_id,
            subjectId: subject_id || '',
            classroomId: classroom_id
        };

        const selectedFlowType = flow_type || 'doubt_clearance';

        switch (selectedFlowType) {
            case 'doubt_clearance':
                await doubtClearanceFlow({
                    query: query,
                    userContext: userContext,
                    research_mode: research_mode ? research_mode : 'simple',
                    res: res
                });
                break;

            case 'worksheet_generation':
                await worksheetFlow({
                    query: query,
                    userContext: userContext,
                    research_mode: research_mode ? research_mode : 'simple',
                    res: res
                });
                break;

            case 'content_creation':
                await contentCreationFlow({
                    query: query,
                    userContext: userContext,
                    research_mode: research_mode? research_mode : 'simple',
                    res: res
                });
                break;

            default:
                await doubtClearanceFlow({
                    query: query,
                    userContext: userContext,
                    research_mode: research_mode ? research_mode : 'simple',
                    res: res
                });
        }
        return;
    } catch (error) {
        console.error('Error setting up chat:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

/**
 * Get all messages for a specific chat
 * GET /api/chat/:chat_id/messages
 */
const getChatMessages = async (req: Request, res: Response) => {
    try {
        await waitForConnection();

        const { chat_id } = req.params;

        if (!chat_id) {
            return res.status(400).json({
                error: 'Missing required parameter: chat_id'
            });
        }

        const conversation = await getConversation(chat_id);

        if (!conversation) {
            return res.status(404).json({
                error: 'Chat conversation not found'
            });
        }

        return res.status(200).json({
            success: true,
            chatId: conversation.chatId,
            userId: conversation.userId,
            subjectId: conversation.subjectId,
            classroomId: conversation.classroomId,
            title: conversation.title,
            description: conversation.description,
            tags: conversation.tags || [],
            totalMessages: conversation.messages.length,
            messages: conversation.messages,
            metadata: conversation.conversationMetadata,
            status: conversation.status
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

/**
 * Get all chats for a specific subject
 * GET /api/chat/subject/:subject_id
 */
const getChatsBySubject = async (req: Request, res: Response) => {
    try {
        await waitForConnection();

        const user_id = req.user_id!;
        const { subject_id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        if (!subject_id) {
            return res.status(400).json({
                error: 'Missing required parameter: subject_id'
            });
        }

        const conversations = await getChatsBySubjectUtil(user_id, subject_id, page, limit);
        const totalChats = await countChatsBySubject(user_id, subject_id);

        return res.status(200).json({
            success: true,
            subject_id,
            totalChats,
            page,
            limit,
            chats: conversations.map(conv => {
                const lastMessage = conv.messages[conv.messages.length - 1];
                let lastMessagePreview = '';
                let lastMessageType = '';

                if (lastMessage) {
                    if (lastMessage.messageType === 'user' && lastMessage.userMessage) {
                        lastMessagePreview = lastMessage.userMessage.query.substring(0, 100);
                        lastMessageType = 'user';
                    } else if (lastMessage.messageType === 'agent' && lastMessage.agentMessage) {
                        const agentMsg = lastMessage.agentMessage;
                        lastMessagePreview = agentMsg.research_findings?.content
                            ? agentMsg.research_findings.content.substring(0, 100)
                            : 'Agent response';
                        lastMessageType = 'agent';
                    }
                }

                return {
                    chatId: conv.chatId,
                    title: conv.title,
                    description: conv.description,
                    tags: conv.tags,
                    totalMessages: conv.conversationMetadata.totalMessages,
                    conversationStartTime: conv.conversationMetadata.conversationStartTime,
                    lastActivityTime: conv.conversationMetadata.lastActivityTime,
                    status: conv.status,
                    lastMessage: {
                        type: lastMessageType,
                        preview: lastMessagePreview,
                        timestamp: lastMessage?.timestamp
                    }
                };
            })
        });

    } catch (error) {
        console.error('Error fetching chats by subject:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

/**
 * Delete a chat conversation
 * DELETE /api/chat/:chat_id
 */
const deleteChatById = async (req: Request, res: Response) => {
    try {
        await waitForConnection();

        const { chat_id } = req.params;

        if (!chat_id) {
            return res.status(400).json({
                error: 'Missing required parameter: chat_id'
            });
        }

        const conversation = await getConversation(chat_id);

        if (!conversation) {
            return res.status(404).json({
                error: 'Chat conversation not found'
            });
        }

        await deleteConversation(chat_id);

        return res.status(200).json({
            success: true,
            message: 'Chat conversation deleted',
            chatId: chat_id
        });

    } catch (error) {
        console.error('Error deleting chat:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export { streamChat, getChatMessages, getChatsBySubject, deleteChatById };