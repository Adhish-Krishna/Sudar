/**
 * Doubt Clearance Flow
 * 
 * A simple chat flow that responds to user queries using only web search.
 * This flow is designed for quick doubt resolution and question answering.
 * 
 * FLOW FEATURES:
 * - Uses only web_search tool for information gathering
 * - Streams text responses in real-time
 * - Maintains simple state tracking
 * - Accepts user context for personalized responses
 * 
 * USE CASES:
 * - Quick question answering
 * - Concept clarification
 * - Fact checking
 * - Simple doubt resolution
 */

import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { createMCPClientWithContext, type UserContext } from '../mcpClient';
import { extractFilesFromQuery } from '../utils/fileExtractor';
import { contentResearcher } from '../agent/contentResearcher';
import { 
  addUserMessage, 
  initializeAgentMessage, 
  finalizeAgentMessage,
  convertDoubtClearanceStep,
  createInputFiles
} from '../utils/chatUtils';
import { type UserMessageInput } from '../models/chatSchema';
import type { IAgentStep } from '../models/chatSchema';
import { doubtClearanceFlowPrompt } from '../prompts';
import dotenv from 'dotenv';

dotenv.config();

export interface DoubtClearanceStep {
  step: number;
  type: 'tool_call' | 'tool_result' | 'text' | 'finish' | 'status' | 'metadata';
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  text?: string;
  finishReason?: string;
  status?: string;
  metadata?: {
    searchQueries?: string[];
    totalSearches?: number;
    responseLength?: number;
    completed?: boolean;
    extractedFiles?: string[];
    fileRetrievals?: number;
    websitesReferenced?: string[];
  };
}

export interface DoubtClearanceOptions {
  query: string;
  userContext: UserContext;
  systemPrompt?: string;
  research_mode?: 'simple' | 'moderate' | 'deep';
}

export async function* doubtClearanceFlow(
  options: DoubtClearanceOptions
): AsyncGenerator<DoubtClearanceStep> {
  const {
    query,
    userContext,
    systemPrompt = doubtClearanceFlowPrompt,
    research_mode = 'moderate'
  } = options;

  const fileExtraction = extractFilesFromQuery(query);
  const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;
  const inputFiles = fileExtraction.extractedFiles;

  let stepCount = 0;
  let fullResponse = '';
  const allSteps: IAgentStep[] = [];
  const startTime = new Date();
  
  const doubtState = {
    searchQueries: [] as string[],
    totalSearches: 0,
    responseLength: 0,
    completed: false,
    extractedFiles: inputFiles,
    fileRetrievals: 0,
    websitesReferenced: [] as string[],
    researchFindings: ''
  };

  if (fileExtraction.hasFiles) {
    stepCount++;
    yield {
      step: stepCount,
      type: 'status' as const,
      status: `Detected ${inputFiles.length} file(s): ${inputFiles.join(', ')}`
    };
  }

  try {
    // Step 1: Use contentResearcher to gather research findings
    stepCount++;
    yield {
      step: stepCount,
      type: 'status' as const,
      status: `Starting research (Mode: ${research_mode.toUpperCase()})...`
    };

    let researchFindings = '';
    for await (const researchStep of contentResearcher({
      query: actualQuery,
      userContext,
      research_mode,
      inputFiles: fileExtraction.extractedFiles
    })) {
      if (researchStep.type === 'status') {
        yield {
          step: stepCount,
          type: 'status' as const,
          status: researchStep.status || ''
        };
      } else if (researchStep.type === 'tool_call') {
        stepCount++;
        yield {
          step: stepCount,
          type: 'tool_call' as const,
          toolName: researchStep.toolName,
          toolArgs: researchStep.toolArgs
        };
        allSteps.push(convertDoubtClearanceStep({
          step: stepCount,
          type: 'tool_call',
          toolName: researchStep.toolName,
          toolArgs: researchStep.toolArgs
        }));
      } else if (researchStep.type === 'tool_result') {
        stepCount++;
        yield {
          step: stepCount,
          type: 'tool_result' as const,
          toolName: researchStep.toolName,
          toolResult: researchStep.toolResult
        };
        allSteps.push(convertDoubtClearanceStep({
          step: stepCount,
          type: 'tool_result',
          toolName: researchStep.toolName,
          toolResult: researchStep.toolResult
        }));
      } else if (researchStep.type === 'text' && researchStep.text) {
        researchFindings += researchStep.text;
        yield {
          step: stepCount,
          type: 'text' as const,
          text: researchStep.text
        };
      } else if (researchStep.type === 'metadata' && researchStep.metadata) {
        doubtState.searchQueries = researchStep.metadata.searchQueries || [];
        doubtState.websitesReferenced = researchStep.metadata.websitesResearched || [];
        doubtState.totalSearches = researchStep.metadata.totalToolCalls || 0;
      }
    }

    doubtState.researchFindings = researchFindings;

    // Step 2: Use a simple agent to answer based on research findings
    const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: You have been provided with research findings below. Use these findings to answer the user's query clearly and concisely. Do not repeat the research findings verbatim - synthesize them into a helpful answer.

RESEARCH FINDINGS:
${researchFindings}`;

    const mcpClient = await createMCPClientWithContext(userContext);
    const tools = await mcpClient.tools();

    // Only allow retrieve_content for file access, no web_search needed as research is done
    const allowedTools = ['retrieve_content'];
    const filteredTools = Object.keys(tools)
      .filter(key => allowedTools.includes(key))
      .reduce((obj, key) => {
        obj[key] = tools[key];
        return obj;
      }, {} as typeof tools);

    stepCount++;
    yield {
      step: stepCount,
      type: 'status' as const,
      status: 'Generating answer based on research findings...'
    };

    const agent = new Agent({
      model: google('gemini-2.5-flash'),
      system: enhancedSystemPrompt,
      tools: filteredTools,
      stopWhen: stepCountIs(5),
      temperature: 0.7
    });

    const result = await agent.stream({
      prompt: actualQuery
    });

    for await (const part of result.fullStream) {
      if (part.type === 'tool-call') {
        stepCount++;
        const toolArgs = 'args' in part ? part.args : part.input;
        
        if (part.toolName === 'retrieve_content') {
          doubtState.fileRetrievals++;
          const filenames = (toolArgs as any)?.inputFiles || [];
          yield {
            step: stepCount,
            type: 'status' as const,
            status: `Retrieving content from: ${Array.isArray(filenames) ? filenames.join(', ') : filenames}...`
          };
        }
        
        const currentStep: DoubtClearanceStep = {
          step: stepCount,
          type: 'tool_call' as const,
          toolName: part.toolName,
          toolArgs: toolArgs
        };

        allSteps.push(convertDoubtClearanceStep(currentStep));
        yield currentStep;
      } else if (part.type === 'tool-result') {
        stepCount++;
        const toolResult = 'result' in part ? part.result : part.output;
        
        const currentStep: DoubtClearanceStep = {
          step: stepCount,
          type: 'tool_result' as const,
          toolName: part.toolName,
          toolResult: toolResult
        };

        allSteps.push(convertDoubtClearanceStep(currentStep));
        yield currentStep;
      } else if (part.type === 'text-delta') {
        if (part.text) {
          doubtState.responseLength += part.text.length;
          fullResponse += part.text;
        }
        
        yield {
          step: stepCount,
          type: 'text' as const,
          text: part.text
        };
      } else if (part.type === 'finish') {
        doubtState.completed = true;
        const endTime = new Date();
        
        // NOW save everything to database in one go
        try {
          // 1. Add user message
          const userMessage: UserMessageInput = {
            query,
            inputFiles: createInputFiles(inputFiles)
          };
          await addUserMessage(userContext.chatId, userMessage, userContext);

          // 2. Create complete agent message with all data
          const messageId = await initializeAgentMessage(userContext.chatId, 'doubt_clearance', inputFiles);

          const executionSummary = {
            success: part.finishReason !== 'error',
            totalToolCalls: doubtState.totalSearches + doubtState.fileRetrievals,
            totalTextLength: doubtState.responseLength,
            duration: endTime.getTime() - startTime.getTime(),
            errorCount: part.finishReason === 'error' ? 1 : 0,
            finalStatus: part.finishReason || 'completed'
          };

          const finalMetadata = {
            doubtClearance: {
              searchQueries: doubtState.searchQueries,
              totalSearches: doubtState.totalSearches,
              responseLength: doubtState.responseLength,
              completed: doubtState.completed,
              extractedFiles: doubtState.extractedFiles,
              fileRetrievals: doubtState.fileRetrievals,
              websitesReferenced: doubtState.websitesReferenced
            }
          };

          // 3. Finalize with all steps, response (stored in research_findings.content for doubt clearance), and metadata
          await finalizeAgentMessage(
            userContext.chatId, 
            messageId, 
            executionSummary,
            finalMetadata,
            allSteps,
            {
              content: fullResponse,
              researched_websites: doubtState.websitesReferenced.length > 0 
                ? doubtState.websitesReferenced 
                : []
            },
            undefined, // No worksheet content for doubt clearance
            endTime
          );
        } catch (error) {
          console.error('Failed to save conversation to database:', error);
        }
        
        yield {
          step: stepCount,
          type: 'metadata' as const,
          metadata: {
            searchQueries: doubtState.searchQueries,
            totalSearches: doubtState.totalSearches,
            responseLength: doubtState.responseLength,
            completed: doubtState.completed,
            extractedFiles: doubtState.extractedFiles,
            fileRetrievals: doubtState.fileRetrievals,
            websitesReferenced: doubtState.websitesReferenced
          }
        };
        
        yield {
          step: stepCount,
          type: 'finish' as const,
          finishReason: part.finishReason
        };
      }
    }

  } catch (error) {
    console.error('Error in doubt clearance flow:', error);
    const endTime = new Date();
    
    // Save error state to database
    try {
      const userMessage: UserMessageInput = {
        query,
        inputFiles: createInputFiles(inputFiles)
      };
      await addUserMessage(userContext.chatId, userMessage, userContext);

      const messageId = await initializeAgentMessage(userContext.chatId, 'doubt_clearance', inputFiles);

      const executionSummary = {
        success: false,
        totalToolCalls: doubtState.totalSearches + doubtState.fileRetrievals,
        totalTextLength: doubtState.responseLength,
        duration: endTime.getTime() - startTime.getTime(),
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
          content: fullResponse,
          researched_websites: doubtState.websitesReferenced.length > 0 
            ? doubtState.websitesReferenced 
            : []
        },
        undefined, // No worksheet content for doubt clearance
        endTime
      );
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
    }
    
    yield {
      step: stepCount,
      type: 'finish' as const,
      finishReason: 'error',
      text: `Doubt clearance failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
