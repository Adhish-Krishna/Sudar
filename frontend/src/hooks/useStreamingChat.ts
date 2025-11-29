/**
 * useStreamingChat Hook
 * 
 * Handles streaming chat messages from the agent service.
 * Processes different chunk types from AI SDK and manages state for rendering.
 */

import { useState, useRef } from 'react';
import { sudarAgent } from '../api';
import { pollRenderStatus } from '../lib/renderPoller';
import { toast } from 'sonner';

export interface StreamChunk {
    type: string;
    phase?: 'research' | 'generation' | 'answer' | 'chat' | 'video';
    // Text chunks
    textDelta?: string;
    delta?: string;
    // Tool chunks
    toolCallId?: string;
    toolName?: string;
    input?: any;
    output?: any;
    // Metadata
    finishReason?: string;
    // Video-specific
    job_id?: string;
    video_url?: string;
    error?: string;
    [key: string]: any;
}

export interface ProcessedMessage {
    role: 'user' | 'assistant';
    content: string;
    steps?: StreamChunk[];
    metadata?: any;
    messageId?: string;
}

export interface StreamingState {
    isStreaming: boolean;
    currentPhase: 'research' | 'generation' | 'answer' | 'video' | null;
    accumulatedSteps: StreamChunk[];
    currentStepNumber: number;
}

interface UseStreamingChatOptions {
    chatId: string;
    classroomId: string;
    subjectId: string;
    onMessageComplete?: (message: ProcessedMessage) => void;
    onError?: (error: any) => void;
}

export const useStreamingChat = ({
    chatId,
    classroomId,
    subjectId,
    onMessageComplete,
    onError
}: UseStreamingChatOptions) => {
    const [streamingState, setStreamingState] = useState<StreamingState>({
        isStreaming: false,
        currentPhase: null,
        accumulatedSteps: [],
        currentStepNumber: 0
    });

    const abortControllerRef = useRef<(() => void) | null>(null);
    const chatIdRef = useRef<string | null>(chatId);
    const activePollsRef = useRef<Set<string>>(new Set());

    const sendMessage = async (
        message: string,
        flowType: 'doubt_clearance' | 'worksheet_generation' | 'content_creation',
        researchMode: 'simple' | 'moderate' | 'deep'
    ) => {
        if (!message.trim()) {
            toast.error("Message cannot be empty");
            return;
        }

        // Reset state for new message
        setStreamingState({
            isStreaming: true,
            currentPhase: null,
            accumulatedSteps: [],
            currentStepNumber: 0
        });

        const accumulatedSteps: StreamChunk[] = [];
        let currentPhase: 'research' | 'generation' | 'answer' | null = null;

        try {
            // capture chat id for fallback database lookups in case SSE connection dies
            chatIdRef.current = chatId;
            const abortFn = await sudarAgent.streamChat(
                {
                    chat_id: chatId,
                    classroom_id: classroomId,
                    subject_id: subjectId,
                    query: message,
                    flow_type: flowType,
                    research_mode: researchMode
                },
                {
                    onEvent: (event: any) => {
                        console.log('Raw SSE chunk:', event);

                        // Extract phase from chunk
                        if (event.phase) {
                            currentPhase = event.phase;
                            setStreamingState(prev => ({
                                ...prev,
                                currentPhase: event.phase
                            }));
                        }

                        // Handle flow-level 'done' event (server sends this when the flow is finished)
                        // Do NOT stop streaming on SDK 'finish' chunks (they can happen per-agent). Only stop on 'done' flow-level signals.
                        if (event.type === 'done' || event.type === 'error') {
                            console.log('Stream complete. Total steps:', accumulatedSteps.length);
                            
                            // Build final message content from text chunks
                            let finalContent = '';
                            for (const step of accumulatedSteps) {
                                if (step.type === 'text-delta') {
                                    finalContent += step.textDelta || step.delta || '';
                                }
                            }

                            const finalMessage: ProcessedMessage = {
                                role: 'assistant',
                                content: finalContent,
                                steps: accumulatedSteps,
                                metadata: event.metadata || {},
                                messageId: event.messageId || event.id || undefined
                            };

                            // Reset streaming state
                            setStreamingState({
                                isStreaming: false,
                                currentPhase: null,
                                accumulatedSteps: [],
                                currentStepNumber: 0
                            });

                            // Notify completion
                            if (onMessageComplete) {
                                onMessageComplete(finalMessage);
                            }
                            return;
                        }

                        // Normalize chunk and process
                        const processedChunk: StreamChunk = {
                            type: event.type,
                            phase: event.phase || currentPhase || undefined,
                            ...event
                        };

                        // Add to accumulated steps (skip meta chunks that don't represent actual content)
                        const skipTypes = ['start', 'start-step', 'finish-step', 'heartbeat'];
                        if (!skipTypes.includes(event.type)) {
                            accumulatedSteps.push(processedChunk);
                            
                            setStreamingState(prev => ({
                                ...prev,
                                accumulatedSteps: [...accumulatedSteps],
                                currentStepNumber: accumulatedSteps.length
                            }));
                        }

                        // If we received a 'video-processing' chunk start polling for the job status
                        if (processedChunk.phase === 'video' && processedChunk.type === 'video-processing') {
                            const jobId = getJobIdFromChunk(processedChunk);
                            if (jobId) {
                                if (activePollsRef.current.has(jobId)) return; // already polling this job
                                activePollsRef.current.add(jobId);
                                (async () => {
                                    try {
                                            const statusResp = await pollRenderStatus(jobId);
                                        if (!statusResp) {
                                            // timed out
                                            const timedOutChunk: StreamChunk = {
                                                type: 'video-error',
                                                phase: 'video',
                                                job_id: jobId,
                                                error: 'Render status polling timed out',
                                                status: 'error'
                                            };
                                            accumulatedSteps.push(timedOutChunk);
                                            setStreamingState(prev => ({ ...prev, accumulatedSteps: [...accumulatedSteps], currentStepNumber: accumulatedSteps.length }));
                                        } else if (statusResp.status === 'completed') {
                                                    const already = accumulatedSteps.some(c => c.type === 'video-completed' && getJobIdFromChunk(c) === jobId);
                                            if (!already) {
                                                const completedChunk: StreamChunk = {
                                                    type: 'video-completed',
                                                    phase: 'video',
                                                    job_id: jobId,
                                                    video_url: statusResp.url || statusResp.video_url || statusResp.videoUrl,
                                                    status: 'completed'
                                                };
                                                accumulatedSteps.push(completedChunk);
                                                setStreamingState(prev => ({ ...prev, accumulatedSteps: [...accumulatedSteps], currentStepNumber: accumulatedSteps.length }));
                                            }
                                        } else if (statusResp.status === 'error') {
                                            const alreadyErr = accumulatedSteps.some(c => c.type === 'video-error' && getJobIdFromChunk(c) === jobId);
                                            if (!alreadyErr) {
                                                const errorChunk: StreamChunk = {
                                                    type: 'video-error',
                                                    phase: 'video',
                                                    job_id: jobId,
                                                    error: statusResp.error || statusResp.error_details || 'Unknown renderer error',
                                                    status: 'error'
                                                };
                                                accumulatedSteps.push(errorChunk);
                                                setStreamingState(prev => ({ ...prev, accumulatedSteps: [...accumulatedSteps], currentStepNumber: accumulatedSteps.length }));
                                            }
                                        }
                                    } catch (err) {
                                        console.warn('Render status poll failed:', err);
                                    } finally {
                                        activePollsRef.current.delete(jobId);
                                    }
                                })();
                            }
                        }
                    },
                    onError: (error: any) => {
                        console.error('Stream error:', error);
                        toast.error(error.message || "Failed to send message");
                        
                        // Build final message from what we have so far
                        let finalContent = '';
                        for (const step of accumulatedSteps) {
                            if (step.type === 'text-delta') {
                                finalContent += step.textDelta || step.delta || '';
                            }
                        }

                        const finalMessage: ProcessedMessage = {
                            role: 'assistant',
                            content: finalContent,
                            steps: accumulatedSteps,
                            metadata: { error: true }
                        };

                        setStreamingState({
                            isStreaming: false,
                            currentPhase: null,
                            accumulatedSteps: [],
                            currentStepNumber: 0
                        });

                        if (onMessageComplete) {
                            onMessageComplete(finalMessage);
                        }

                        if (onError) {
                            onError(error);
                        }
                    }
                }
            );

            abortControllerRef.current = abortFn;

        } catch (error: any) {
            console.error('Failed to start stream:', error);
            toast.error(error.message || "Failed to send message");
            
            setStreamingState({
                isStreaming: false,
                currentPhase: null,
                accumulatedSteps: [],
                currentStepNumber: 0
            });

            if (onError) {
                onError(error);
            }
        }
    };

    const getJobIdFromChunk = (chunk: StreamChunk | any) => {
        return chunk?.job_id || chunk?.chunkData?.job_id || chunk?.jobId || chunk?.data?.job_id || undefined;
    };

    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current();
            abortControllerRef.current = null;
        }

        // If there is partial content, finalize and emit it
        if (streamingState.isStreaming && streamingState.accumulatedSteps.length > 0) {
            let finalContent = '';
            for (const step of streamingState.accumulatedSteps) {
                if (step.type === 'text-delta') {
                    finalContent += step.textDelta || step.delta || '';
                }
            }

            const finalMessage: ProcessedMessage = {
                role: 'assistant',
                content: finalContent,
                steps: streamingState.accumulatedSteps,
                metadata: { stopped: true }
            };

            if (onMessageComplete) {
                onMessageComplete(finalMessage);
            }
        }

        setStreamingState({
            isStreaming: false,
            currentPhase: null,
            accumulatedSteps: [],
            currentStepNumber: 0
        });
    };

    return {
        streamingState,
        sendMessage,
        stopStreaming
    };
};
