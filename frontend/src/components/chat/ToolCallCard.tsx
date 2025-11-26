/**
 * ToolCallCard Component
 * 
 * Displays tool/function calls and their results in a formatted, visually appealing card.
 * Supports collapsible sections for long outputs and syntax highlighting for JSON.
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Wrench, CheckCircle2, ChevronDown, ChevronRight, Search, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ToolCallCardProps {
    toolName: string;
    input?: any;
    output?: any;
    phase?: 'research' | 'generation' | 'answer';
    type: 'input' | 'output';
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({
    toolName,
    input,
    output,
    phase,
    type
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getToolIcon = () => {
        const iconClass = "h-4 w-4 shrink-0";

        if (toolName.includes('search') || toolName.includes('web')) {
            return <Search className={iconClass} />;
        }
        if (toolName.includes('retrieve') || toolName.includes('content')) {
            return <FileText className={iconClass} />;
        }
        if (toolName.includes('scrape') || toolName.includes('website')) {
            return <Globe className={iconClass} />;
        }
        return <Wrench className={iconClass} />;
    };

    const getToolDisplayName = (name: string): string => {
        // Convert snake_case to Title Case
        return name
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatData = (data: any): string => {
        if (typeof data === 'string') return data;
        return JSON.stringify(data, null, 2);
    };

    const shouldShowPreview = (): boolean => {
        const data = type === 'input' ? input : output;
        if (!data) return false;
        const formatted = formatData(data);
        return formatted.length > 200;
    };

    const getPreviewText = (): string => {
        const data = type === 'input' ? input : output;
        const formatted = formatData(data);
        return formatted.substring(0, 200) + '...';
    };

    const renderContent = () => {
        const data = type === 'input' ? input : output;
        if (!data) return null;

        const isCollapsible = shouldShowPreview();
        const displayText = isCollapsible && !isExpanded ? getPreviewText() : formatData(data);

        return (
            <>
                {typeof data === 'string' && type === 'output' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{isCollapsible && !isExpanded ? getPreviewText() : data}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="font-mono bg-background/50 p-3 rounded text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{displayText}</pre>
                    </div>
                )}

                {isCollapsible && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown className="h-3 w-3" />
                                Show less
                            </>
                        ) : (
                            <>
                                <ChevronRight className="h-3 w-3" />
                                Show more
                            </>
                        )}
                    </button>
                )}
            </>
        );
    };

    const borderColor = type === 'input'
        ? 'border-blue-200 dark:border-blue-900'
        : 'border-green-200 dark:border-green-900';

    const iconColor = type === 'input'
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-green-600 dark:text-green-400';

    return (
        <Card className={cn("p-4 bg-muted/50", borderColor)}>
            <div className="flex items-start gap-3">
                <div className={cn("mt-0.5", iconColor)}>
                    {type === 'input' ? getToolIcon() : <CheckCircle2 className="h-4 w-4" />}
                </div>

                <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                            {type === 'input' ? 'Tool Call' : 'Tool Result'}
                        </span>
                        {toolName.length > 0 && <Badge variant="outline" className="text-xs">

                            {getToolDisplayName(toolName)}
                        </Badge>}
                        
                        {phase && (
                            <Badge variant="secondary" className="text-xs capitalize">
                                {phase}
                            </Badge>
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-sm text-muted-foreground">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ToolCallCard;
