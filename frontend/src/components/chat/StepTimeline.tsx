/**
 * StepTimeline Component
 * 
 * Optional timeline visualization of agent steps showing the chronological
 * flow of the agent's reasoning and actions.
 */

import React from 'react';
import { Circle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StreamChunk } from '../../hooks/useStreamingChat';

interface StepTimelineProps {
    steps: StreamChunk[];
    currentStepIndex?: number;
}

export const StepTimeline: React.FC<StepTimelineProps> = ({
    steps,
    currentStepIndex = steps.length - 1
}) => {
    const getStepLabel = (step: StreamChunk): string => {
        if (step.type === 'tool-input-available') {
            return `Calling ${step.toolName || 'tool'}`;
        }
        if (step.type === 'tool-output-available') {
            return `Received ${step.toolName || 'tool'} result`;
        }
        if (step.type === 'text-delta') {
            return 'Generating response';
        }
        return step.type;
    };

    const getPhaseColor = (phase?: string): string => {
        switch (phase) {
            case 'research':
                return 'text-blue-600 dark:text-blue-400';
            case 'generation':
                return 'text-purple-600 dark:text-purple-400';
            case 'answer':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-muted-foreground';
        }
    };

    // Filter out text-delta steps to avoid clutter
    const meaningfulSteps = steps.filter(s =>
        s.type === 'tool-input-available' ||
        s.type === 'tool-output-available'
    );

    if (meaningfulSteps.length === 0) {
        return null;
    }

    return (
        <div className="py-4">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Step Timeline</h4>
            <div className="space-y-3">
                {meaningfulSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                        <div key={index} className="flex items-start gap-3">
                            {/* Timeline dot */}
                            <div className="relative flex flex-col items-center">
                                <div className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200",
                                    isCompleted
                                        ? "bg-primary/10 border-primary"
                                        : "bg-background border-muted-foreground/30",
                                    isCurrent && "ring-2 ring-primary/20"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                    ) : (
                                        <Circle className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Connector line */}
                                {index < meaningfulSteps.length - 1 && (
                                    <div className={cn(
                                        "w-0.5 h-8 mt-1",
                                        isCompleted
                                            ? "bg-primary/30"
                                            : "bg-muted-foreground/20"
                                    )} />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 pb-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-sm",
                                        isCompleted ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {getStepLabel(step)}
                                    </span>
                                    {step.phase && (
                                        <span className={cn(
                                            "text-xs capitalize",
                                            getPhaseColor(step.phase)
                                        )}>
                                            {step.phase}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepTimeline;
