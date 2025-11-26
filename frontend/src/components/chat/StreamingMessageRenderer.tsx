/**
 * StreamingMessageRenderer Component
 * 
 * Enhanced renderer for streaming messages with proper handling of different chunk types.
 * Displays tool calls, tool results, text chunks, and metadata with improved UI.
 * Features phase indicators, collapsible sections, and better visual hierarchy.
 */

import React, { useState } from 'react';
import type { StreamChunk } from '../../hooks/useStreamingChat';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ToolCallCard } from './ToolCallCard';
import { StepTimeline } from './StepTimeline';
import { cn } from '@/lib/utils';

interface StreamingMessageRendererProps {
    steps: StreamChunk[];
    isStreaming?: boolean;
    currentPhase?: 'research' | 'generation' | 'answer' | null;
    flowType?: 'doubt_clearance' | 'worksheet_generation';
}

export const StreamingMessageRenderer: React.FC<StreamingMessageRendererProps> = ({
    steps,
    isStreaming = false,
    currentPhase,
}) => {
    const [showTimeline, setShowTimeline] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        research: true,
        answer: true,
        generation: true
    });

    // Group steps by phase
    const groupStepsByPhase = () => {
        const groups: Record<string, StreamChunk[]> = {
            research: [],
            answer: [],
            generation: []
        };

        steps.forEach(step => {
            const phase = step.phase || 'answer';
            if (groups[phase]) {
                groups[phase].push(step);
            }
        });

        return groups;
    };

    const toggleSection = (phase: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [phase]: !prev[phase]
        }));
    };

    // Accumulate text content from text-delta chunks
    const getTextContentByPhase = (phaseSteps: StreamChunk[]) => {
        let content = '';
        for (const step of phaseSteps) {
            if (step.type === 'text-delta') {
                content += step.textDelta || step.delta || '';
            }
        }
        return content;
    };

    const groupedSteps = groupStepsByPhase();
    const hasMultiplePhases = Object.values(groupedSteps).filter(arr => arr.length > 0).length > 1;

    // Get tool-related steps (non-text)
    const getToolSteps = (phaseSteps: StreamChunk[]) => {
        return phaseSteps.filter(s =>
            s.type === 'tool-input-available' ||
            s.type === 'tool-output-available'
        );
    };

    const renderPhaseSection = (phase: 'research' | 'answer' | 'generation', phaseSteps: StreamChunk[]) => {
        if (phaseSteps.length === 0) return null;

        const toolSteps = getToolSteps(phaseSteps);
        const textContent = getTextContentByPhase(phaseSteps);
        const isExpanded = expandedSections[phase];
        const isCurrentPhase = currentPhase === phase;

        const phaseLabels = {
            research: 'Research Phase',
            answer: 'Answer Phase',
            generation: 'Generation Phase'
        };

        const phaseColors = {
            research: 'border bg-muted',
            answer: 'border bg-muted',
            generation: 'border bg-muted'
        };

        return (
            <div key={phase} className="space-y-3">
                {/* Phase Header - Collapsible */}
                {hasMultiplePhases && (
                    <button
                        onClick={() => toggleSection(phase)}
                        className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all",
                            phaseColors[phase],
                            isCurrentPhase && "ring-2 ring-primary/20"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isCurrentPhase && isStreaming && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            <span className="font-semibold text-sm">{phaseLabels[phase]}</span>
                            <Badge variant="secondary" className="text-xs">
                                {toolSteps.length} step{toolSteps.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>
                )}

                {/* Phase Content */}
                {isExpanded && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Tool Steps */}
                        {toolSteps.map((step, index) => {
                            if (step.type === 'tool-input-available') {
                                return (
                                    <div key={`tool-input-${index}`} className="animate-in slide-in-from-bottom-2 duration-300">
                                        <ToolCallCard
                                            type="input"
                                            toolName={step.toolName || ''}
                                            input={step.input}
                                            phase={step.phase as any}
                                        />
                                    </div>
                                );
                            }
                            if (step.type === 'tool-output-available') {
                                return (
                                    <div key={`tool-output-${index}`} className="animate-in slide-in-from-bottom-2 duration-300">
                                        <ToolCallCard
                                            type="output"
                                            toolName={step.toolName || ''}
                                            output={step.output}
                                            phase={step.phase as any}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {/* Text Content */}
                        {textContent && (
                            <Card className="p-4 bg-background animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-4 w-4 text-primary mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{textContent}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Streaming indicator for current phase */}
                        {isCurrentPhase && isStreaming && !textContent && toolSteps.length === 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Processing...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Optional Timeline Toggle */}
            {steps.length > 3 && (
                <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    {showTimeline ? 'Hide' : 'Show'} Step Timeline
                </button>
            )}

            {/* Timeline View */}
            {showTimeline && (
                <div className="pl-2 border-l-2 border-muted">
                    <StepTimeline steps={steps} />
                </div>
            )}

            {/* Phase Sections */}
            <div className="space-y-4">
                {renderPhaseSection('research', groupedSteps.research)}

                {/* Answer Phase - Always visible without box */}
                {groupedSteps.answer.length > 0 && (
                    <div className="space-y-3">
                        {/* Tool steps for answer phase */}
                        {getToolSteps(groupedSteps.answer).map((step, idx) => (
                            <div key={idx} className="animate-in slide-in-from-bottom-1">
                                <ToolCallCard
                                    type={step.type === 'tool-input-available' ? 'input' : 'output'}
                                    toolName={step.toolName || ''}
                                    output={step.output}
                                    phase={step.phase as any}
                                />
                            </div>
                        ))}

                        {/* Answer text content - no card wrapper */}
                        {getTextContentByPhase(groupedSteps.answer) && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{getTextContentByPhase(groupedSteps.answer)}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}

                {renderPhaseSection('generation', groupedSteps.generation)}
            </div>

            {/* Global Streaming Indicator */}
            {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating response...</span>
                </div>
            )}
        </div>
    );
};

export default StreamingMessageRenderer;
