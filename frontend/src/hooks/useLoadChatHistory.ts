/**
 * useLoadChatHistory Hook
 * 
 * Loads chat history from the database and converts it to the same format
 * as streaming messages for consistent rendering.
 */

import { useState, useEffect } from 'react';
import { sudarAgent } from '../api';
import type { ProcessedMessage, StreamChunk } from './useStreamingChat';
import { toast } from 'sonner';

interface UseLoadChatHistoryOptions {
    chatId: string | null;
    userId: string | undefined;
    subjectId: string | undefined;
}

export const useLoadChatHistory = ({
    chatId,
    userId,
    subjectId
}: UseLoadChatHistoryOptions) => {
    const [messages, setMessages] = useState<ProcessedMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (!chatId || !userId || !subjectId) {
                setMessages([]);
                return;
            }

            setLoading(true);
            try {
                const response = await sudarAgent.getChatMessages(chatId);
                
                console.log('Chat Messages Response:', response);
                
                if (response.success === false) {
                    // Error response from API
                    console.log('Error fetching chat:', response.message);
                    setMessages([]);
                } else if (response.messages && Array.isArray(response.messages)) {
                    // Success: response has messages array directly
                    console.log('Loading messages:', response.messages.length);
                    const loadedMessages: ProcessedMessage[] = [];
                    
                    for (const msg of response.messages) {
                        if (msg.messageType === 'user' && msg.userMessage) {
                            // User message
                            loadedMessages.push({
                                role: 'user',
                                content: msg.userMessage.query
                            });
                        } else if (msg.messageType === 'agent' && msg.agentMessage) {
                            // Agent message - extract steps from database
                            const steps: StreamChunk[] = [];
                            let textContent = '';

                            // Convert database steps to StreamChunk format
                            if (msg.agentMessage.steps && Array.isArray(msg.agentMessage.steps)) {
                                for (const dbStep of msg.agentMessage.steps) {
                                    // Each step has: { step, phase, type, timestamp, chunkData }
                                    const chunk: StreamChunk = {
                                        type: dbStep.type,
                                        phase: dbStep.phase,
                                        ...dbStep.chunkData // Spread the raw chunk data
                                    };

                                    steps.push(chunk);

                                    // Accumulate text content
                                    if (dbStep.type === 'text-delta') {
                                        textContent += dbStep.chunkData.textDelta || 
                                                      dbStep.chunkData.delta || '';
                                    }
                                }
                            }

                            // Create the processed message
                            loadedMessages.push({
                                role: 'assistant',
                                content: textContent,
                                steps: steps,
                                metadata: msg.agentMessage.executionSummary || {}
                            });
                        }
                    }
                    
                    setMessages(loadedMessages);
                }
            } catch (error: any) {
                console.error("Failed to load chat history:", error);
                toast.error("Failed to load chat history");
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [chatId, userId, subjectId]);

    return { messages, loading, setMessages };
};
