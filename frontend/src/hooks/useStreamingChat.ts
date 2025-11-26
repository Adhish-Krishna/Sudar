/**
 * useStreamingChat Hook
 * 
 * Handles streaming chat messages from the agent service.
 * Processes different chunk types from AI SDK and manages state for rendering.
 */

import { useState, useRef } from 'react';
import { sudarAgent } from '../api';
import { toast } from 'sonner';

export interface StreamChunk {
    type: string;
    phase?: 'research' | 'generation' | 'answer' | 'chat';
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
    currentPhase: 'research' | 'generation' | 'answer' | null;
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

    const sendMessage = async (
        message: string,
        flowType: 'doubt_clearance' | 'worksheet_generation',
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

                        // Handle finish event - complete the message
                        if (event.type === 'finish') {
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

                        // Process the chunk based on its type
                        // The backend now sends raw chunks with type like 'text-delta', 'tool-input-available', etc.
                        const processedChunk: StreamChunk = {
                            type: event.type,
                            phase: event.phase || currentPhase || undefined,
                            ...event
                        };

                        // Add to accumulated steps (skip meta chunks that don't represent actual content)
                        const skipTypes = ['start', 'start-step', 'finish-step'];
                        if (!skipTypes.includes(event.type)) {
                            accumulatedSteps.push(processedChunk);
                            
                            setStreamingState(prev => ({
                                ...prev,
                                accumulatedSteps: [...accumulatedSteps],
                                currentStepNumber: accumulatedSteps.length
                            }));
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

                        // Still notify completion with partial message
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

            // The stream will end when connection closes, so we handle completion here
            // by setting up a check after the stream function returns
            // Note: The actual completion will be detected when no more events arrive
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
