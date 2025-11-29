/**
 * useLoadChatHistory Hook
 * 
 * Loads chat history from the database and converts it to the same format
 * as streaming messages for consistent rendering.
 */

import { useState, useEffect, useRef } from 'react';
import { sudarAgent, type ChatMessage } from '../api';
import { pollRenderStatus } from '../lib/renderPoller';
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
    const skipNextFetchRef = useRef(false);

    useEffect(() => {
        const loadHistory = async () => {
            if (!chatId || !userId || !subjectId) {
                setMessages([]);
                return;
            }

            // Skip fetch if we just added a message locally
            if (skipNextFetchRef.current) {
                skipNextFetchRef.current = false;
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

                    for (const msg of response.messages as ChatMessage[]) {
                        if (msg.messageType === 'user' && msg.userMessage) {
                            // User message
                            loadedMessages.push({
                                role: 'user',
                                content: msg.userMessage.query,
                                messageId: msg.messageId || `user-${Date.now()}-${Math.random()}`
                            });
                        } else if (msg.messageType === 'agent' && msg.agentMessage) {
                            // Agent message - extract steps from database
                            const steps: StreamChunk[] = [];
                            let textContent = '';

                            // Convert database steps to StreamChunk format
                            if (msg.agentMessage.steps && Array.isArray(msg.agentMessage.steps)) {
                                for (const dbStep of msg.agentMessage.steps as any[]) {
                                    // Each step has: { step, phase, type, timestamp, chunkData }
                                    const rawData = (dbStep.chunkData && typeof dbStep.chunkData === 'object') ? dbStep.chunkData : {};
                                    const jobIdFromData = rawData?.job_id || rawData?.jobId || rawData?.jobId;
                                    const chunk: StreamChunk = {
                                        type: dbStep.type,
                                        phase: dbStep.phase,
                                        ...rawData,
                                        job_id: jobIdFromData
                                    };

                                    steps.push(chunk);

                                    // Accumulate text content
                                    if (dbStep.type === 'text-delta') {
                                        textContent += dbStep.chunkData.textDelta ||
                                            dbStep.chunkData.delta || '';
                                    }

                                    // If this is a historical video-processing step, query the renderer status once to update
                                    if (dbStep.phase === 'video' && dbStep.type === 'video-processing') {
                                        const jobId = dbStep.chunkData?.job_id || dbStep.chunkData?.jobId || dbStep.chunkData?.jobId;
                                        if (jobId) {
                                            (async () => {
                                                try {
                                                    const statusResp = await pollRenderStatus(jobId);
                                                    if (!statusResp) {
                                                        const errorChunk: StreamChunk = {
                                                            type: 'video-error',
                                                            phase: 'video',
                                                            job_id: jobId,
                                                            error: 'Render status polling timed out'
                                                        };
                                                        setMessages(prev => prev.map(m => {
                                                            if (m.messageId === msg.messageId) {
                                                                const newSteps = (m.steps || []).concat(errorChunk);
                                                                return { ...m, steps: newSteps };
                                                            }
                                                            return m;
                                                        }));
                                                    } else if (statusResp?.status === 'completed') {
                                                        const completedChunk: StreamChunk = {
                                                            type: 'video-completed',
                                                            phase: 'video',
                                                            job_id: jobId,
                                                            video_url: statusResp.url || statusResp.video_url || statusResp.videoUrl,
                                                        };
                                                        setMessages(prev => prev.map(m => {
                                                            if (m.messageId === msg.messageId) {
                                                                const newSteps = (m.steps || []).concat(completedChunk);
                                                                return { ...m, steps: newSteps };
                                                            }
                                                            return m;
                                                        }));
                                                    } else if (statusResp?.status === 'error') {
                                                        const errorChunk: StreamChunk = {
                                                            type: 'video-error',
                                                            phase: 'video',
                                                            job_id: jobId,
                                                            error: statusResp.error || statusResp.error_details || 'Unknown renderer error'
                                                        };
                                                        setMessages(prev => prev.map(m => {
                                                            if (m.messageId === msg.messageId) {
                                                                const newSteps = (m.steps || []).concat(errorChunk);
                                                                return { ...m, steps: newSteps };
                                                            }
                                                            return m;
                                                        }));
                                                    }
                                                } catch (err) {
                                                    console.warn('Failed to check historical render status:', err);
                                                }
                                            })();
                                        }
                                    }
                                }
                            }

                            // Create the processed message
                            loadedMessages.push({
                                role: 'assistant',
                                content: textContent,
                                messageId: msg.messageId || `agent-${Date.now()}-${Math.random()}`,
                                steps: steps,
                                metadata: msg.agentMessage.executionSummary || {}
                            });
                            // If the agent message contains final metadata with a video job id but we did not
                            // have a 'video-processing' step saved in steps, add one and then poll for its final status.
                            let finalMeta: any = msg.agentMessage?.finalMetadata || {};
                            // finalMetadata may be stored as a JSON string by the backend
                            if (typeof finalMeta === 'string') {
                                try { finalMeta = JSON.parse(finalMeta); } catch (err) { /* keep as string if JSON parse fails */ }
                            }
                            const jobIdInMeta = finalMeta?.video_job_id || finalMeta?.video_job || finalMeta?.videoId || finalMeta?.video?.job_id;
                            if (jobIdInMeta && !steps.some(s => s.phase === 'video' && (s.type === 'video-processing' || s.type === 'video-started' || s.type === 'video-completed'))) {
                                const jobId = jobIdInMeta;
                                const processingChunk: StreamChunk = {
                                    type: 'video-processing',
                                    phase: 'video',
                                    job_id: jobId,
                                    message: 'Video is processing (historic)'
                                };
                                // Append to the created message in the state
                                loadedMessages[loadedMessages.length - 1].steps = (loadedMessages[loadedMessages.length - 1].steps || []).concat(processingChunk);
                                // Poll for final state
                                (async () => {
                                    try {
                                        const statusResp = await pollRenderStatus(jobId);
                                        if (!statusResp) {
                                            const errChunk: StreamChunk = {
                                                type: 'video-error',
                                                phase: 'video',
                                                job_id: jobId,
                                                error: 'Render status polling timed out'
                                            };
                                            setMessages(prev => prev.map(m => {
                                                if (m.messageId === msg.messageId) {
                                                    const newSteps = (m.steps || []).concat(errChunk);
                                                    return { ...m, steps: newSteps };
                                                }
                                                return m;
                                            }));
                                        } else if (statusResp.status === 'completed') {
                                            const completedChunk: StreamChunk = {
                                                type: 'video-completed',
                                                phase: 'video',
                                                job_id: jobId,
                                                video_url: statusResp.url || statusResp.video_url || statusResp.videoUrl,
                                            };
                                            setMessages(prev => prev.map(m => {
                                                if (m.messageId === msg.messageId) {
                                                    const newSteps = (m.steps || []).concat(completedChunk);
                                                    return { ...m, steps: newSteps };
                                                }
                                                return m;
                                            }));
                                        } else if (statusResp.status === 'error') {
                                            const errorChunk: StreamChunk = {
                                                type: 'video-error',
                                                phase: 'video',
                                                job_id: jobId,
                                                error: statusResp.error || statusResp.error_details || 'Unknown renderer error'
                                            };
                                            setMessages(prev => prev.map(m => {
                                                if (m.messageId === msg.messageId) {
                                                    const newSteps = (m.steps || []).concat(errorChunk);
                                                    return { ...m, steps: newSteps };
                                                }
                                                return m;
                                            }));
                                        }
                                    } catch (err) {
                                        console.warn('Failed to check historical render status:', err);
                                    }
                                })();
                            }
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

    // Enhanced setMessages that marks the next fetch to be skipped AND deduplicates
    const setMessagesWithSkip = (updater: ProcessedMessage[] | ((prev: ProcessedMessage[]) => ProcessedMessage[])) => {
        skipNextFetchRef.current = true;

        setMessages(prevMessages => {
            const newMessages = typeof updater === 'function' ? updater(prevMessages) : updater;

            // Deduplicate messages
            const seen = new Set<string>();
            const deduplicated: ProcessedMessage[] = [];

            for (const msg of newMessages) {
                // Create a unique key based on message ID or content hash
                const key = msg.messageId || `${msg.role}-${msg.content.substring(0, 100)}`;

                if (!seen.has(key)) {
                    seen.add(key);
                    deduplicated.push(msg);
                }
            }

            return deduplicated;
        });
    };

    return { messages, loading, setMessages: setMessagesWithSkip };
};
