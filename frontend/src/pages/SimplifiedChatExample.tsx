/**
 * Example: Chat Component using useStreamingChat and useLoadChatHistory
 * 
 * This shows how to integrate the streaming hooks into Chat.tsx
 */

import React, { useState } from 'react';
import { useStreamingChat, type ProcessedMessage } from '../hooks/useStreamingChat';
import { useLoadChatHistory } from '../hooks/useLoadChatHistory';
import { StreamingMessageRenderer } from '../components/chat/StreamingMessageRenderer';
import { ScrollArea } from '../components/ui/scroll-area';
import { Card } from '../components/ui/card';
import ChatInput from '../components/ChatInput';

interface SimplifiedChatProps {
    chatId: string;
    classroomId: string;
    subjectId: string;
    userId: string;
}

export const SimplifiedChatExample: React.FC<SimplifiedChatProps> = ({
    chatId,
    classroomId,
    subjectId,
    userId
}) => {
    const [flowType, setFlowType] = useState<'doubt_clearance' | 'worksheet_generation'>('doubt_clearance');
    const [researchMode, setResearchMode] = useState<'simple' | 'moderate' | 'deep'>('moderate');

    // Load chat history from database
    const { messages: historyMessages, loading: loadingHistory, setMessages } = useLoadChatHistory({
        chatId,
        userId,
        subjectId
    });

    // Handle streaming
    const { streamingState, sendMessage, stopStreaming } = useStreamingChat({
        chatId,
        classroomId,
        subjectId,
        onMessageComplete: (message) => {
            // Add completed message to history
            setMessages(prev => [...prev, message]);
        },
        onError: (error) => {
            console.error('Stream error:', error);
        }
    });

    const handleSendMessage = async (messageText: string) => {
        // Add user message immediately
        const userMessage: ProcessedMessage = {
            role: 'user',
            content: messageText
        };
        setMessages(prev => [...prev, userMessage]);

        // Start streaming
        await sendMessage(messageText, flowType, researchMode);
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                        <span>Loading messages...</span>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {/* Render historical messages */}
                        {historyMessages.map((msg, index) => (
                            <div key={index}>
                                {msg.role === 'user' ? (
                                    <Card className="p-4 bg-primary/10">
                                        <p className="text-sm">{msg.content}</p>
                                    </Card>
                                ) : (
                                    <Card className="p-4">
                                        {msg.steps && msg.steps.length > 0 ? (
                                            <StreamingMessageRenderer
                                                steps={msg.steps}
                                                isStreaming={false}
                                            />
                                        ) : (
                                            <p className="text-sm">{msg.content}</p>
                                        )}
                                    </Card>
                                )}
                            </div>
                        ))}

                        {/* Render currently streaming message */}
                        {streamingState.isStreaming && (
                            <Card className="p-4 border-primary">
                                <StreamingMessageRenderer
                                    steps={streamingState.accumulatedSteps}
                                    isStreaming={true}
                                    currentPhase={streamingState.currentPhase}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-4">
                <ChatInput
                    maxHeight={100}
                    messageHandler={handleSendMessage}
                    flowType={flowType}
                    onFlowTypeChange={setFlowType}
                    researchMode={researchMode}
                    onResearchModeChange={setResearchMode}
                    isUploadingFiles={false}
                    onAddFiles={() => {}}
                    onAddContext={() => {}}
                    contextOpen={false}
                    indexedFiles={[]}
                    loadingContext={false}
                    selectedContext={new Set()}
                    onToggleContext={() => {}}
                />
            </div>
        </div>
    );
};

export default SimplifiedChatExample;
