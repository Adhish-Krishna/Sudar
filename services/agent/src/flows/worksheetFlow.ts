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
  finalizeAgentMessage,
  convertWorksheetFlowStep,
  createInputFiles
} from '../utils/chatUtils';
import { type UserMessageInput, type IAgentStep } from '../models/chatSchema';
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
    worksheetContent: string;
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

  const allSteps: IAgentStep[] = [];

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
      worksheetContent: '',
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
        status: `Detected ${fileExtraction.extractedFiles.length} file(s) for context: ${fileExtraction.extractedFiles.join(', ')}`
      };
    }

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'phase_change',
      phaseInfo: {
        currentPhase: 'research',
        message: `Starting Research Phase (Mode: ${research_mode.toUpperCase()})`
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

      // Store step for later database save
      allSteps.push(convertWorksheetFlowStep(currentStep));

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
      status: `Research Complete! Gathered ${flowState.researchPhase.researchFindings.length} characters from ${flowState.researchPhase.websitesResearched.length} websites using ${flowState.researchPhase.searchQueries.length} search queries.`
    };
    
    flowState.currentPhase = 'generation';
    
    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'phase_change',
      phaseInfo: {
        previousPhase: 'research',
        currentPhase: 'generation',
        message: `Starting Worksheet Generation Phase (${flowState.researchPhase.researchFindings.length} chars of research)`
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

      // Store step for later database save
      allSteps.push(convertWorksheetFlowStep(currentStep));

      yield currentStep;

      // Accumulate worksheet content from text chunks
      if (worksheetStep.type === 'text' && worksheetStep.text) {
        flowState.generationPhase.worksheetContent += worksheetStep.text;
      }

      // Capture worksheet content from tool arguments when saving
      if (worksheetStep.type === 'tool_call' && worksheetStep.toolName === 'save_content' && worksheetStep.toolArgs) {
        const content = (worksheetStep.toolArgs as any)?.content;
        if (content) {
          flowState.generationPhase.worksheetContent = content;
        }
      }

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

    // Save everything to database in one go
    try {
      // 1. Add user message
      const userMessage: UserMessageInput = {
        query,
        inputFiles: createInputFiles(fileExtraction.extractedFiles)
      };
      await addUserMessage(userContext.chatId, userMessage, userContext);

      // 2. Create complete agent message with all data
      const messageId = await initializeAgentMessage(userContext.chatId, 'worksheet_generation', fileExtraction.extractedFiles);

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

      // 3. Finalize with all steps, research findings, worksheet content, and metadata
      await finalizeAgentMessage(
        userContext.chatId, 
        messageId, 
        executionSummary,
        finalMetadata,
        allSteps,
        {
          content: flowState.researchPhase.researchFindings,
          researched_websites: flowState.researchPhase.websitesResearched
        },
        flowState.generationPhase.worksheetContent,
        flowState.endTime
      );
    } catch (error) {
      console.error('Failed to save conversation to database:', error);
    }

    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'finish',
      finishReason: flowState.success ? 'success' : 'completed_with_warnings',
      status: flowState.success 
        ? 'Worksheet flow completed successfully!' 
        : 'Worksheet flow completed with warnings'
    };

  } catch (error) {
    flowState.success = false;
    flowState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    flowState.endTime = new Date();

    console.error('Error in worksheet flow:', error);
    
    // Save error state to database
    try {
      const userMessage: UserMessageInput = {
        query,
        inputFiles: createInputFiles(fileExtraction.extractedFiles)
      };
      await addUserMessage(userContext.chatId, userMessage, userContext);

      const messageId = await initializeAgentMessage(userContext.chatId, 'worksheet_generation', fileExtraction.extractedFiles);

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
        executionSummary,
        undefined,
        allSteps,
        {
          content: flowState.researchPhase.researchFindings,
          researched_websites: flowState.researchPhase.websitesResearched
        },
        flowState.generationPhase.worksheetContent,
        flowState.endTime
      );
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
    }
    
    yield {
      step: ++flowState.totalSteps,
      phase: 'flow',
      type: 'finish',
      finishReason: 'error',
      status: `Worksheet flow failed: ${flowState.errorMessage}`
    };
  }
}
