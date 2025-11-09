import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, ExternalLink, Search, Globe, Loader2, CheckCircle2, FileText } from "lucide-react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Response } from "@/components/ai-elements/response";

interface ResearchPhaseData {
  status: string[];
  searchQueries: string[];
  websitesResearched: string[];
  toolCalls: Array<{ toolName: string; timestamp: number }>;
  isComplete: boolean;
  content?: string; // Research phase text content
}

interface GenerationPhaseData {
  status: string[];
  worksheetTitle?: string;
  contentLength?: number;
  savedSuccessfully?: boolean;
  pdfLocation?: string;
  isComplete: boolean;
  content?: string; // Generation phase text content
}

interface ResearchPhaseRendererProps {
  data: ResearchPhaseData;
  isActive: boolean;
}

export const ResearchPhaseRenderer = ({ data, isActive }: ResearchPhaseRendererProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {data.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            Research Phase
            {isActive && !data.isComplete && (
              <span className="text-xs font-normal text-muted-foreground">(in progress...)</span>
            )}
          </CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {isExpanded ? (
                  <>
                    Collapse <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Expand <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription className="text-xs">
          Researching the topic and gathering information
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Research Content */}
            {data.content && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Research Findings:</p>
                  <ScrollArea className="h-[300px] rounded-md border bg-background/50 p-3">
                    <Response
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      parseIncompleteMarkdown={true}
                    >
                      {data.content}
                    </Response>
                  </ScrollArea>
                </div>
                <Separator />
              </>
            )}

            {/* Current Status */}
            {isActive && data.status.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current Activity:</p>
                <Shimmer className="text-xs" duration={2}>
                  {data.status[data.status.length - 1]}
                </Shimmer>
              </div>
            )}

            {/* Search Queries */}
            {data.searchQueries.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search Queries ({data.searchQueries.length})
                  </p>
                  <ScrollArea className="h-[100px] rounded-md border p-2 bg-background/50">
                    <ul className="space-y-1">
                      {data.searchQueries.map((query, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground pl-4 border-l-2 border-blue-300 dark:border-blue-700">
                          {query}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Websites Researched */}
            {data.websitesResearched.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Websites Researched ({data.websitesResearched.length})
                  </p>
                  <ScrollArea className="h-[150px] rounded-md border p-2 bg-background/50">
                    <ul className="space-y-1.5">
                      {data.websitesResearched.map((url, idx) => (
                        <li key={idx} className="text-xs">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-start gap-1 group"
                          >
                            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="break-all group-hover:underline">{url}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Tool Calls Summary */}
            {data.toolCalls.length > 0 && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Total operations: {data.toolCalls.length}
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

interface GenerationPhaseRendererProps {
  data: GenerationPhaseData;
  isActive: boolean;
}

export const GenerationPhaseRenderer = ({ data, isActive }: GenerationPhaseRendererProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {data.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-green-500" />
            )}
            Generation Phase
            {isActive && !data.isComplete && (
              <span className="text-xs font-normal text-muted-foreground">(in progress...)</span>
            )}
          </CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {isExpanded ? (
                  <>
                    Collapse <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Expand <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription className="text-xs">
          Generating worksheet based on research findings
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Generation Content */}
            {data.content && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Generated Worksheet:</p>
                  <ScrollArea className="h-[300px] rounded-md border bg-background/50 p-3">
                    <Response
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      parseIncompleteMarkdown={true}
                    >
                      {data.content}
                    </Response>
                  </ScrollArea>
                </div>
                <Separator />
              </>
            )}

            {/* Current Status */}
            {isActive && data.status.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current Activity:</p>
                <Shimmer className="text-xs" duration={2}>
                  {data.status[data.status.length - 1]}
                </Shimmer>
              </div>
            )}

            {/* Worksheet Details */}
            {data.worksheetTitle && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Worksheet Details
                  </p>
                  <div className="space-y-1.5 pl-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Title:</p>
                      <p className="text-xs font-medium">{data.worksheetTitle}</p>
                    </div>
                    {data.contentLength && (
                      <div>
                        <p className="text-xs text-muted-foreground">Length:</p>
                        <p className="text-xs font-medium">{data.contentLength.toLocaleString()} characters</p>
                      </div>
                    )}
                    {data.savedSuccessfully !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">Status:</p>
                        <p className={`text-xs font-medium ${data.savedSuccessfully ? 'text-green-600' : 'text-yellow-600'}`}>
                          {data.savedSuccessfully ? '✓ Saved successfully' : 'Generated'}
                        </p>
                      </div>
                    )}
                    {data.pdfLocation && (
                      <div>
                        <p className="text-xs text-muted-foreground">PDF Location:</p>
                        <p className="text-xs font-mono bg-muted/50 p-1.5 rounded break-all">
                          {data.pdfLocation.split('/').pop()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

interface DoubtClearanceData {
  status: string[];
  searchQueries: string[];
  websitesResearched: string[];
  researchFindings?: string; // Research findings from contentResearcher
  finalAnswer?: string; // Final synthesized answer
  isComplete: boolean;
  totalToolCalls?: number;
}

interface DoubtClearanceRendererProps {
  data: DoubtClearanceData;
  isActive: boolean;
}

export const DoubtClearanceRenderer = ({ data, isActive }: DoubtClearanceRendererProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {data.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
            )}
            Research Details
            {isActive && !data.isComplete && (
              <span className="text-xs font-normal text-muted-foreground">(in progress...)</span>
            )}
          </CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {isExpanded ? (
                  <>
                    Collapse <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Expand <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
        <CardDescription className="text-xs">
          Research sources and findings used to answer your question
        </CardDescription>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Research Findings */}
            {data.researchFindings && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Research Findings:</p>
                  <ScrollArea className="h-[300px] rounded-md border bg-background/50 p-3">
                    <Response
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      parseIncompleteMarkdown={true}
                    >
                      {data.researchFindings}
                    </Response>
                  </ScrollArea>
                </div>
                <Separator />
              </>
            )}

            {/* Current Status */}
            {isActive && data.status.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Current Activity:</p>
                <Shimmer className="text-xs" duration={2}>
                  {data.status[data.status.length - 1]}
                </Shimmer>
              </div>
            )}

            {/* Search Queries */}
            {data.searchQueries.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    Search Queries ({data.searchQueries.length})
                  </p>
                  <ScrollArea className="h-[100px] rounded-md border p-2 bg-background/50">
                    <ul className="space-y-1">
                      {data.searchQueries.map((query, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground pl-4 border-l-2 border-purple-300 dark:border-purple-700">
                          {query}
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Websites Researched */}
            {data.websitesResearched.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Websites Researched ({data.websitesResearched.length})
                  </p>
                  <ScrollArea className="h-[150px] rounded-md border p-2 bg-background/50">
                    <ul className="space-y-1.5">
                      {data.websitesResearched.map((url, idx) => (
                        <li key={idx} className="text-xs">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-start gap-1 group"
                          >
                            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="break-all group-hover:underline">{url}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              </>
            )}

            {/* Tool Calls Summary */}
            {data.totalToolCalls !== undefined && data.totalToolCalls > 0 && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Total operations: {data.totalToolCalls}
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};