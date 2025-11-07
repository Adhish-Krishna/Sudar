/**
 * Worksheet Generation Flow
 * 
 * A comprehensive flow that orchestrates content research and worksheet generation.
 * This flow maintains complete state throughout the entire process and streams
 * all events from both the contentResearcher and worksheetGenerator agents.
 * 
 * FLOW STEPS:
 * 1. Initialize flow state
 * 2. Execute contentResearcher agent to gather research findings
 * 3. Pass research findings to worksheetGenerator agent
 * 4. Generate final worksheet PDF
 * 5. Return complete flow metadata
 * 
 * FEATURES:
 * - Maintains complete state across both research and generation phases
 * - Streams all events from both agents in real-time
 * - Aggregates metadata from both phases
 * - Handles errors gracefully with proper error states
 */

import { contentResearcher} from '../agent/contentResearcher';
import { worksheetGenerator} from '../agent/worksheetGenerator';
import { extractFilesFromQuery } from '../utils/fileExtractor';
import { 
  addUserMessage, 
  initializeAgentMessage, 
  updateAgentMessageStep, 
  appendTextToAgentMessage,
  finalizeAgentMessage,
  convertWorksheetFlowStep,
  createInputFiles
} from '../utils/chatUtils';
import { type UserMessageInput } from '../models/chatSchema';
import type { UserContext } from '../mcpClient';

export interface WorksheetFlowStep {
  step: number;
  phase: 'research' | 'generation' | 'flow';
  type: 'tool_call' | 'tool_result' | 'text' | 'finish' | 'status' | 'metadata' | 'phase_change';
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  text?: string;
  finishReason?: string;
  status?: string;
  metadata?: any;
  phaseInfo?: {
    previousPhase?: string;
    currentPhase: string;
    message: string;
  };
}

export interface WorksheetFlowOptions {
  query: string;
  userContext: UserContext;
  research_mode?: 'simple' | 'moderate' | 'deep';
  systemPromptResearch?: string;
  systemPromptWorksheet?: string;
}

interface WorksheetFlowState {
  extractedFiles: string[];
  hasFiles: boolean;
  
  researchPhase: {
    websitesResearched: string[];
    searchQueries: string[];
    totalToolCalls: number;
    researchMode: 'simple' | 'moderate' | 'deep';
    researchFindings: string;
    completed: boolean;
  };
  
  generationPhase: {
    worksheetTitle: string;
    contentLength: number;
    savedSuccessfully: boolean;
    pdfLocation: string;
    totalToolCalls: number;
    completed: boolean;
  };
  
  totalSteps: number;
  currentPhase: 'research' | 'generation' | 'complete';
  startTime: Date;
  endTime?: Date;
  success: boolean;
  errorMessage?: string;
}

export async function* worksheetFlow(
  options: WorksheetFlowOptions
): AsyncGenerator<WorksheetFlowStep> {
  const {
    query,
    userContext,
    research_mode = 'moderate',
    systemPromptResearch,
    systemPromptWorksheet
  } = options;

  // Extract file references from query
  const fileExtraction = extractFilesFromQuery(query);
  const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;

  // Add user message to database
  try {
    const userMessage: UserMessageInput = {
      query,
      inputFiles: createInputFiles(fileExtraction.extractedFiles)
    };
    await addUserMessage(userContext.chatId, userMessage, userContext);
  } catch (error) {
    console.error('Failed to add user message to database:', error);
  }

  // Initialize agent message in database
  let messageId: string;
  try {
    messageId = await initializeAgentMessage(userContext.chatId, 'worksheet_generation', fileExtraction.extractedFiles);
  } catch (error) {
    console.error('Failed to initialize agent message in database:', error);
    // Continue without database integration if initialization fails
    messageId = '';
  }

  const flowState: WorksheetFlowState = {
    extractedFiles: fileExtraction.extractedFiles,
    hasFiles: fileExtraction.hasFiles,
    
    researchPhase: {
      websitesResearched: [],
      searchQueries: [],
      totalToolCalls: 0,
      researchMode: research_mode,
      researchFindings: '',
      completed: false
    },
    generationPhase: {
      worksheetTitle: '',
      contentLength: 0,
      savedSuccessfully: false,
      pdfLocation: '',
      totalToolCalls: 0,
      completed: false
    },
    totalSteps: 0,
    currentPhase: 'research',
    startTime: new Date(),
    success: false
  };

  try {
    if (fileExtraction.hasFiles) {
      yield {
        step: ++flowState.totalSteps,
        phase: 'flow',
        type: 'status',
        status: `📁 Detected ${fileExtraction.extractedFiles.length} file(s) for context: ${fileExtraction.extractedFiles.join(', ')}`
      };
    }

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'phase_change',
      phaseInfo: {
        currentPhase: 'research',
        message: `🔬 Starting Research Phase (Mode: ${research_mode.toUpperCase()})`
      }
    };

    for await (const researchStep of contentResearcher({
      query: actualQuery,
      userContext,
      research_mode,
      inputFiles: fileExtraction.extractedFiles,
      ...(systemPromptResearch && { systemPrompt: systemPromptResearch })
    })) {
      const currentStep: WorksheetFlowStep = {
        step: ++flowState.totalSteps,
        phase: 'research' as const,
        type: researchStep.type,
        toolName: researchStep.toolName,
        toolArgs: researchStep.toolArgs,
        toolResult: researchStep.toolResult,
        text: researchStep.text,
        finishReason: researchStep.finishReason,
        status: researchStep.status,
        metadata: researchStep.metadata
      };

      // Update database with step
      if (messageId) {
        try {
          await updateAgentMessageStep(
            userContext.chatId, 
            messageId, 
            convertWorksheetFlowStep(currentStep)
          );
        } catch (error) {
          console.error('Failed to update research step in database:', error);
        }
      }

      // Update accumulated response for text steps
      if (researchStep.type === 'text' && researchStep.text && messageId) {
        try {
          flowState.researchPhase.researchFindings += researchStep.text;
          await appendTextToAgentMessage(userContext.chatId, messageId, flowState.researchPhase.researchFindings);
        } catch (error) {
          console.error('Failed to update research text in database:', error);
        }
      }

      yield currentStep;

      if (researchStep.type === 'text' && researchStep.text) {
        flowState.researchPhase.researchFindings += researchStep.text;
      }

      if (researchStep.type === 'metadata' && researchStep.metadata) {
        flowState.researchPhase.websitesResearched = researchStep.metadata.websitesResearched || [];
        flowState.researchPhase.searchQueries = researchStep.metadata.searchQueries || [];
        flowState.researchPhase.totalToolCalls = researchStep.metadata.totalToolCalls || 0;
        flowState.researchPhase.researchMode = researchStep.metadata.researchMode || research_mode;
      }

      if (researchStep.type === 'finish') {
        flowState.researchPhase.completed = true;
      }
    }

    if (!flowState.researchPhase.researchFindings || flowState.researchPhase.researchFindings.length < 100) {
      throw new Error('Research phase produced insufficient findings for worksheet generation');
    }

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'metadata',
      metadata: {
        researchSummary: {
          researchMode: flowState.researchPhase.researchMode,
          findingsLength: flowState.researchPhase.researchFindings.length,
          websitesResearched: flowState.researchPhase.websitesResearched,
          searchQueries: flowState.researchPhase.searchQueries,
          totalToolCalls: flowState.researchPhase.totalToolCalls,
          completed: flowState.researchPhase.completed
        }
      }
    };

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'status',
      status: `✅ Research Complete! Gathered ${flowState.researchPhase.researchFindings.length} characters from ${flowState.researchPhase.websitesResearched.length} websites using ${flowState.researchPhase.searchQueries.length} search queries.`
    };
    
    flowState.currentPhase = 'generation';
    
    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'phase_change',
      phaseInfo: {
        previousPhase: 'research',
        currentPhase: 'generation',
        message: `📝 Starting Worksheet Generation Phase (${flowState.researchPhase.researchFindings.length} chars of research)`
      }
    };

    for await (const worksheetStep of worksheetGenerator({
      query,
      content: flowState.researchPhase.researchFindings,
      userContext,
      ...(systemPromptWorksheet && { systemPrompt: systemPromptWorksheet })
    })) {
      const currentStep: WorksheetFlowStep = {
        step: ++flowState.totalSteps,
        phase: 'generation' as const,
        type: worksheetStep.type,
        toolName: worksheetStep.toolName,
        toolArgs: worksheetStep.toolArgs,
        toolResult: worksheetStep.toolResult,
        text: worksheetStep.text,
        finishReason: worksheetStep.finishReason,
        status: worksheetStep.status,
        metadata: worksheetStep.metadata
      };

      // Update database with step
      if (messageId) {
        try {
          await updateAgentMessageStep(
            userContext.chatId, 
            messageId, 
            convertWorksheetFlowStep(currentStep)
          );
        } catch (error) {
          console.error('Failed to update generation step in database:', error);
        }
      }

      yield currentStep;

      if (worksheetStep.type === 'metadata' && worksheetStep.metadata) {
        flowState.generationPhase.worksheetTitle = worksheetStep.metadata.worksheetTitle || '';
        flowState.generationPhase.contentLength = worksheetStep.metadata.contentLength || 0;
        flowState.generationPhase.savedSuccessfully = worksheetStep.metadata.savedSuccessfully || false;
        flowState.generationPhase.pdfLocation = worksheetStep.metadata.pdfLocation || '';
        flowState.generationPhase.totalToolCalls = worksheetStep.metadata.totalToolCalls || 0;
      }

      if (worksheetStep.type === 'finish') {
        flowState.generationPhase.completed = true;
      }
    }
    
    flowState.currentPhase = 'complete';
    flowState.endTime = new Date();
    flowState.success = flowState.researchPhase.completed && 
                        flowState.generationPhase.completed &&
                        flowState.generationPhase.savedSuccessfully;

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'metadata',
      metadata: {
        flowSummary: {
          success: flowState.success,
          totalSteps: flowState.totalSteps,
          duration: flowState.endTime.getTime() - flowState.startTime.getTime(),
          startTime: flowState.startTime.toISOString(),
          endTime: flowState.endTime.toISOString(),
          extractedFiles: flowState.extractedFiles,
          hasFiles: flowState.hasFiles
        },
        researchPhase: {
          websitesResearched: flowState.researchPhase.websitesResearched,
          searchQueries: flowState.researchPhase.searchQueries,
          totalToolCalls: flowState.researchPhase.totalToolCalls,
          researchMode: flowState.researchPhase.researchMode,
          findingsLength: flowState.researchPhase.researchFindings.length,
          completed: flowState.researchPhase.completed
        },
        generationPhase: {
          worksheetTitle: flowState.generationPhase.worksheetTitle,
          contentLength: flowState.generationPhase.contentLength,
          savedSuccessfully: flowState.generationPhase.savedSuccessfully,
          pdfLocation: flowState.generationPhase.pdfLocation,
          totalToolCalls: flowState.generationPhase.totalToolCalls,
          completed: flowState.generationPhase.completed
        }
      }
    };

    // Finalize agent message in database
    if (messageId) {
      try {
        const executionSummary = {
          success: flowState.success,
          totalToolCalls: flowState.researchPhase.totalToolCalls + flowState.generationPhase.totalToolCalls,
          totalTextLength: flowState.researchPhase.researchFindings.length,
          duration: flowState.endTime.getTime() - flowState.startTime.getTime(),
          errorCount: flowState.success ? 0 : 1,
          finalStatus: flowState.success ? 'completed' : 'completed_with_warnings'
        };

        const finalMetadata = {
          worksheetFlow: {
            flowSummary: {
              success: flowState.success,
              totalSteps: flowState.totalSteps,
              duration: flowState.endTime.getTime() - flowState.startTime.getTime(),
              startTime: flowState.startTime.toISOString(),
              endTime: flowState.endTime.toISOString(),
              extractedFiles: flowState.extractedFiles,
              hasFiles: flowState.hasFiles
            },
            researchPhase: {
              websitesResearched: flowState.researchPhase.websitesResearched,
              searchQueries: flowState.researchPhase.searchQueries,
              totalToolCalls: flowState.researchPhase.totalToolCalls,
              researchMode: flowState.researchPhase.researchMode,
              findingsLength: flowState.researchPhase.researchFindings.length,
              completed: flowState.researchPhase.completed
            },
            generationPhase: {
              worksheetTitle: flowState.generationPhase.worksheetTitle,
              contentLength: flowState.generationPhase.contentLength,
              savedSuccessfully: flowState.generationPhase.savedSuccessfully,
              pdfLocation: flowState.generationPhase.pdfLocation,
              totalToolCalls: flowState.generationPhase.totalToolCalls,
              completed: flowState.generationPhase.completed
            }
          }
        };

        await finalizeAgentMessage(
          userContext.chatId, 
          messageId, 
          executionSummary,
          finalMetadata
        );
      } catch (error) {
        console.error('Failed to finalize message in database:', error);
      }
    }

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'finish',
      finishReason: flowState.success ? 'success' : 'completed_with_warnings',
      status: flowState.success 
        ? '✅ Worksheet flow completed successfully!' 
        : '⚠️ Worksheet flow completed with warnings'
    };

  } catch (error) {
    flowState.success = false;
    flowState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    flowState.endTime = new Date();

    console.error('Error in worksheet flow:', error);
    
    // Finalize agent message with error in database
    if (messageId) {
      try {
        const executionSummary = {
          success: false,
          totalToolCalls: flowState.researchPhase.totalToolCalls + flowState.generationPhase.totalToolCalls,
          totalTextLength: flowState.researchPhase.researchFindings.length,
          duration: flowState.endTime.getTime() - flowState.startTime.getTime(),
          errorCount: 1,
          finalStatus: 'error'
        };

        await finalizeAgentMessage(
          userContext.chatId, 
          messageId, 
          executionSummary
        );
      } catch (dbError) {
        console.error('Failed to finalize error message in database:', dbError);
      }
    }
    
    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'finish',
      finishReason: 'error',
      status: `❌ Worksheet flow failed: ${flowState.errorMessage}`
    };
  }
}
