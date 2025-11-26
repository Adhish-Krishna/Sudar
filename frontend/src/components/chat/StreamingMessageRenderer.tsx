/**
 * StreamingMessageRenderer Component
 * 
 * Renders streaming messages with proper handling of different chunk types.
 * Displays tool calls, tool results, text chunks, and metadata.
 */

import React from 'react';
import type { StreamChunk } from '../../hooks/useStreamingChat';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Wrench, CheckCircle2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StreamingMessageRendererProps {
    steps: StreamChunk[];
    isStreaming?: boolean;
    currentPhase?: 'research' | 'generation' | 'answer' | null;
}

export const StreamingMessageRenderer: React.FC<StreamingMessageRendererProps> = ({
    steps,
    isStreaming = false,
    currentPhase
}) => {
    // Group consecutive text chunks for better rendering
    const renderStep = (step: StreamChunk, index: number) => {
        switch (step.type) {
            case 'text-delta':
                // Accumulate text chunks
                return null; // Will be rendered in accumulated text section
                
            case 'tool-input-available':
                return (
                    <Card key={`tool-call-${index}`} className="p-3 bg-muted/50 border-blue-200 dark:border-blue-900">
                        <div className="flex items-start gap-2">
                            <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">Tool Call</span>
                                    <Badge variant="outline" className="text-xs">
                                        {step.toolName || 'Unknown Tool'}
                                    </Badge>
                                    {step.phase && (
                                        <Badge variant="secondary" className="text-xs">
                                            {step.phase}
                                        </Badge>
                                    )}
                                </div>
                                {step.input && (
                                    <div className="text-xs text-muted-foreground font-mono bg-background/50 p-2 rounded">
                                        <pre className="whitespace-pre-wrap">
                                            {JSON.stringify(step.input, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
                
            case 'tool-output-available':
                return (
                    <Card key={`tool-result-${index}`} className="p-3 bg-muted/50 border-green-200 dark:border-green-900">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">Tool Result</span>
                                    <Badge variant="outline" className="text-xs">
                                        {step.toolName || 'Unknown Tool'}
                                    </Badge>
                                    {step.phase && (
                                        <Badge variant="secondary" className="text-xs">
                                            {step.phase}
                                        </Badge>
                                    )}
                                </div>
                                {step.output && (
                                    <div className="text-xs text-muted-foreground">
                                        {typeof step.output === 'string' ? (
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{step.output}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="font-mono bg-background/50 p-2 rounded">
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(step.output, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                );
                
            case 'finish':
                return (
                    <div key={`finish-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Completed{step.finishReason ? `: ${step.finishReason}` : ''}</span>
                    </div>
                );
                
            default:
                // Skip rendering for unknown chunk types
                return null;
        }
    };

    // Accumulate text content from text-delta chunks
    const getTextContent = () => {
        let content = '';
        for (const step of steps) {
            if (step.type === 'text-delta') {
                content += step.textDelta || step.delta || '';
            }
        }
        return content;
    };

    const textContent = getTextContent();
    const nonTextSteps = steps.filter(s => s.type !== 'text-delta');

    return (
        <div className="space-y-3">
            {/* Current Phase Indicator */}
            {isStreaming && currentPhase && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="capitalize">{currentPhase} Phase</span>
                </div>
            )}

            {/* Render non-text steps (tool calls, tool results, etc.) */}
            {nonTextSteps.map((step, index) => renderStep(step, index))}

            {/* Render accumulated text content */}
            {textContent && (
                <Card className="p-4 bg-background">
                    <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-1 shrink-0" />
                        <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{textContent}</ReactMarkdown>
                        </div>
                    </div>
                </Card>
            )}

            {/* Streaming indicator */}
            {isStreaming && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generating response...</span>
                </div>
            )}
        </div>
    );
};

export default StreamingMessageRenderer;
