import type {Request, Response} from 'express';
import { waitForConnection } from '../config/db';
import type { UserContext } from '../mcpClient';
import { worksheetFlow } from '../flows/worksheetFlow';
import { doubtClearanceFlow } from '../flows/doubtClearanceFlow';

interface ChatRequest {
  chat_id: string;
  subject_id: string;
  classroom_id: string;
  query: string;
  flow_type?: 'doubt_clearance' | 'worksheet_generation';
}

const streamChat = async (req: Request, res: Response) => {
    try {
        // Ensure database connection is ready
        await waitForConnection();

        const user_id = req.user_id!;
        
        const { chat_id, subject_id, classroom_id, query, flow_type }: ChatRequest = req.body;

        if (!chat_id || !classroom_id || !query) {
            return res.status(400).json({
                error: 'Missing required fields: user_id, chat_id, classroom_id, query'
            });
        }

        // Set up SSE headers
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE'
        });

        const userContext: UserContext = {
            userId: user_id,
            chatId: chat_id,
            subjectId: subject_id || '',
            classroomId: classroom_id
        };

        // Determine flow type
        const selectedFlowType = flow_type || 'doubt_clearance';

        try {
            // Send start event
            res.write(`data: ${JSON.stringify({ 
                type: 'start', 
                flowType: selectedFlowType,
                content: '',
                metadata: {}
            })}\n\n`);

            if (selectedFlowType === 'worksheet_generation') {
                // Use worksheet flow
                for await (const step of worksheetFlow({
                    query,
                    userContext
                })) {
                    // Phase change events (flow level)
                    if (step.type === 'phase_change') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'phase_change',
                            flowType: selectedFlowType,
                            content: step.phaseInfo?.message || '',
                            metadata: {
                                currentPhase: step.phaseInfo?.currentPhase,
                                previousPhase: step.phaseInfo?.previousPhase,
                                phase: step.phase
                            }
                        })}\n\n`);
                    }
                    // Status messages (can come from any phase)
                    else if (step.type === 'status') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'status',
                            flowType: selectedFlowType,
                            content: step.status || '',
                            metadata: {
                                phase: step.phase
                            }
                        })}\n\n`);
                    }
                    // Text streaming (from research or generation agents)
                    else if (step.type === 'text') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'token',
                            flowType: selectedFlowType,
                            content: step.text || '',
                            metadata: {
                                phase: step.phase
                            }
                        })}\n\n`);
                    }
                    // Tool calls (from agents)
                    else if (step.type === 'tool_call') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'tool_call',
                            flowType: selectedFlowType,
                            content: `Calling ${step.toolName}`,
                            metadata: {
                                phase: step.phase,
                                toolName: step.toolName,
                                toolArgs: step.toolArgs
                            }
                        })}\n\n`);
                    }
                    // Tool results (from agents)
                    else if (step.type === 'tool_result') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'tool_result',
                            flowType: selectedFlowType,
                            content: `${step.toolName} completed`,
                            metadata: {
                                phase: step.phase,
                                toolName: step.toolName,
                                toolResult: step.toolResult
                            }
                        })}\n\n`);
                    }
                    // Metadata events
                    else if (step.type === 'metadata') {
                        // Handle different types of metadata based on phase and content
                        if (step.phase === 'flow' && step.metadata?.researchSummary) {
                            // Research phase summary
                            res.write(`data: ${JSON.stringify({ 
                                type: 'metadata',
                                flowType: selectedFlowType,
                                content: '',
                                metadata: {
                                    summaryType: 'research',
                                    phase: step.phase,
                                    researchMode: step.metadata.researchSummary.researchMode,
                                    findingsLength: step.metadata.researchSummary.findingsLength,
                                    websitesResearched: step.metadata.researchSummary.websitesResearched || [],
                                    searchQueries: step.metadata.researchSummary.searchQueries || [],
                                    totalToolCalls: step.metadata.researchSummary.totalToolCalls,
                                    completed: step.metadata.researchSummary.completed
                                }
                            })}\n\n`);
                        } else if (step.phase === 'flow' && step.metadata?.flowSummary) {
                            // Complete flow summary
                            res.write(`data: ${JSON.stringify({ 
                                type: 'metadata',
                                flowType: selectedFlowType,
                                content: '',
                                metadata: {
                                    summaryType: 'flow',
                                    phase: step.phase,
                                    flowSummary: step.metadata.flowSummary,
                                    researchPhase: step.metadata.researchPhase,
                                    generationPhase: step.metadata.generationPhase
                                }
                            })}\n\n`);
                        } else if (step.phase === 'research' && step.metadata) {
                            // Research phase metadata
                            res.write(`data: ${JSON.stringify({
                                type: 'metadata',
                                flowType: selectedFlowType,
                                content: '',
                                metadata: {
                                    summaryType: 'research_phase',
                                    phase: step.phase,
                                    researchMode: step.metadata.researchMode?.toUpperCase(),
                                    searchQueries: step.metadata.searchQueries || [],
                                    websitesResearched: step.metadata.websitesResearched || [],
                                    totalToolCalls: step.metadata.totalToolCalls || 0
                                }
                            })}\n\n`);
                        } else if (step.phase === 'generation' && step.metadata) {
                            // Generation phase metadata
                            res.write(`data: ${JSON.stringify({
                                type: 'metadata',
                                flowType: selectedFlowType,
                                content: '',
                                metadata: {
                                    summaryType: 'generation_phase',
                                    phase: step.phase,
                                    worksheetTitle: step.metadata.worksheetTitle,
                                    contentLength: step.metadata.contentLength,
                                    savedSuccessfully: step.metadata.savedSuccessfully,
                                    pdfLocation: step.metadata.pdfLocation,
                                    totalToolCalls: step.metadata.totalToolCalls || 0
                                }
                            })}\n\n`);
                        }
                    }
                    // Finish event
                    else if (step.type === 'finish') {
                        // Only send done event for flow-level finish
                        if (step.phase === 'flow') {
                            res.write(`data: ${JSON.stringify({ 
                                type: 'done',
                                flowType: selectedFlowType,
                                content: step.status || '',
                                metadata: {
                                    phase: step.phase,
                                    finishReason: step.finishReason
                                }
                            })}\n\n`);
                            break;
                        } else {
                            // Send phase completion event for phase-level finish
                            res.write(`data: ${JSON.stringify({ 
                                type: 'phase_complete',
                                flowType: selectedFlowType,
                                content: `${step.phase} phase completed`,
                                metadata: {
                                    phase: step.phase,
                                    finishReason: step.finishReason
                                }
                            })}\n\n`);
                        }
                    }
                }
            } else {
                // Use doubt clearance flow (default)
                let toolCallCount = 0;
                
                for await (const step of doubtClearanceFlow({
                    query,
                    userContext
                })) {
                    // Status messages
                    if (step.type === 'status') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'status',
                            flowType: selectedFlowType,
                            content: step.status || '',
                            metadata: {}
                        })}\n\n`);
                    }
                    else if(step.type === "tool_call"){
                        toolCallCount++;
                    }
                    // Text streaming
                    else if (step.type === 'text') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'token',
                            flowType: selectedFlowType,
                            content: step.text || '',
                            metadata: {}
                        })}\n\n`);
                    }
                    // Metadata summary
                    else if (step.type === 'metadata') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'metadata',
                            flowType: selectedFlowType,
                            content: '',
                            metadata: {
                                summaryType: 'doubt_clearance',
                                searchQueries: step.metadata?.searchQueries || [],
                                totalSearches: step.metadata?.totalSearches || 0,
                                responseLength: step.metadata?.responseLength || 0,
                                completed: step.metadata?.completed || false,
                                extractedFiles: step.metadata?.extractedFiles || [],
                                fileRetrievals: step.metadata?.fileRetrievals || 0,
                                websitesReferenced: step.metadata?.websitesReferenced || [],
                                totalToolCalls: toolCallCount
                            }
                        })}\n\n`);
                    }
                    // Finish event
                    else if (step.type === 'finish') {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'done',
                            flowType: selectedFlowType,
                            content: '✨ Doubt clearance complete!',
                            metadata: {
                                finishReason: step.finishReason,
                                totalToolCalls: toolCallCount
                            }
                        })}\n\n`);
                        
                        if (step.finishReason === 'error' && step.text) {
                            res.write(`data: ${JSON.stringify({ 
                                type: 'error',
                                flowType: selectedFlowType,
                                content: `❌ Error: ${step.text}`,
                                metadata: {}
                            })}\n\n`);
                        }
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Error in chat flow:', error);
            res.write(`data: ${JSON.stringify({ 
                type: 'error',
                flowType: selectedFlowType,
                content: `Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                metadata: {}
            })}\n\n`);
        }

        res.end();
        return;
    } catch (error) {
        console.error('Error setting up chat:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

export {streamChat};