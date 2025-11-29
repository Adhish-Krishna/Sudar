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
    currentPhase?: 'research' | 'generation' | 'answer' | 'video' | null;
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
        generation: true,
        video: true
    });

    // Group steps by phase
    const groupStepsByPhase = () => {
        const groups: Record<string, StreamChunk[]> = {
            research: [],
            answer: [],
            generation: [],
            video: []
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

        // Subtle, phase-specific accents without changing functionality
        const phaseColors = {
            research: 'border bg-muted/60 hover:bg-muted/70',
            answer: 'border bg-muted/60 hover:bg-muted/70',
            generation: 'border bg-muted/60 hover:bg-muted/70'
        };

        return (
            <div key={phase} className="space-y-3">
                {/* Phase Header - Collapsible */}
                {hasMultiplePhases && (
                    <button
                        onClick={() => toggleSection(phase)}
                        className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                            phaseColors[phase],
                            isCurrentPhase && "ring-2 ring-primary/20"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {isCurrentPhase && isStreaming && (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            )}
                            <span className="font-semibold text-sm">{phaseLabels[phase]}</span>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
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
                            <Card className="p-4 bg-background/60 backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-300 border border-border/50">
                                <div className="flex items-start gap-3">
                                    <FileText className="h-4 w-4 text-primary mt-1 shrink-0" />
                                    <div className="flex-1">
                                        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
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

    const renderVideoSection = (phaseSteps: StreamChunk[]) => {
        if (!phaseSteps || phaseSteps.length === 0) return null;

        // Build a map of jobId -> finalStatus so we can filter out in-progress rendering entries
        const jobStatus = new Map<string, 'completed' | 'error' | 'processing'>();
        for (const s of phaseSteps) {
            const id = (s as any).job_id || (s as any).chunkData?.job_id || (s as any).chunkData?.jobId || (s as any).jobId;
            if (!id) continue;
            if (s.type === 'video-completed') jobStatus.set(id, 'completed');
            if (s.type === 'video-error') jobStatus.set(id, 'error');
            if (s.type === 'video-processing' && !jobStatus.has(id)) jobStatus.set(id, 'processing');
        }

        return (
            <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border/50 bg-muted/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Video</span>
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {phaseSteps.length} step{phaseSteps.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {phaseSteps.map((step, idx) => {
                        if (step.type === 'video-processing') {
                            const id = (step as any).job_id || (step as any).chunkData?.job_id || (step as any).chunkData?.jobId || (step as any).jobId;
                            // If the job is already completed or errored, hide the processing step
                            if (id && (jobStatus.get(id) === 'completed' || jobStatus.get(id) === 'error')) {
                                return null;
                            }
                            return (
                                <Card key={idx} className="p-3 border-dashed">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <div>
                                            <div className="font-medium">Rendering video</div>
                                            <div className="text-xs text-muted-foreground">Job ID: {step.job_id || step.chunkData?.job_id || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">The video is being processed. This may take a few minutes.</div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        }
                        if (step.type === 'video-started') {
                            return (
                                <Card key={idx} className="p-3">
                                    <div className="font-medium">Video generation started</div>
                                    <div className="text-xs text-muted-foreground">Job ID: {step.job_id || step.chunkData?.job_id || 'N/A'}</div>
                                </Card>
                            );
                        }
                        if (step.type === 'video-completed') {
                            const src = (step as any).video_url || (step as any).chunkData?.video_url || (step as any).chunkData?.url;
                            return (
                                <Card key={idx} className="p-3">
                                    <div className="font-medium mb-2">Video ready</div>
                                    {src ? (
                                        <video controls className="w-full rounded">
                                            <source src={src} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">Video is ready! You can download it from files tab</div>
                                    )}
                                </Card>
                            );
                        }
                        if (step.type === 'video-error') {
                            return (
                                <Card key={idx} className="p-3 border-red-400">
                                    <div className="font-medium text-rose-600">Video generation failed</div>
                                    <div className="text-xs text-muted-foreground">{(step as any).error || (step as any).chunkData?.error || 'Unknown error'}</div>
                                </Card>
                            );
                        }
                        return null;
                    })}
                </div>
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

                                {/* Video Phase (moved out) */}
                        {/* Answer text content - no card wrapper */}
                        {getTextContentByPhase(groupedSteps.answer) && (
                            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                                <ReactMarkdown>{getTextContentByPhase(groupedSteps.answer)}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                )}

                {renderPhaseSection('generation', groupedSteps.generation)}

                {/* Video section should be rendered independently of the Answer phase */}
                {renderVideoSection(groupedSteps.video || [])}
            </div>

            {/* Global Streaming Indicator */}
            {isStreaming && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pt-2 border-t">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating response...</span>
                </div>
            )}
        </div>
    );
};

export default StreamingMessageRenderer;
