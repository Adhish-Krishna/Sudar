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
import { extractFilesFromQuery, createFileContextPrompt } from '../utils/fileExtractor';
import { 
  addUserMessage, 
  initializeAgentMessage, 
  updateAgentMessageStep, 
  appendTextToAgentMessage,
  finalizeAgentMessage,
  convertDoubtClearanceStep,
  createInputFiles
} from '../utils/chatUtils';
import { type UserMessageInput } from '../models/chatSchema';
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
}

export async function* doubtClearanceFlow(
  options: DoubtClearanceOptions
): AsyncGenerator<DoubtClearanceStep> {
  const {
    query,
    userContext,
    systemPrompt = doubtClearanceFlowPrompt
  } = options;

  const fileExtraction = extractFilesFromQuery(query);
  const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;
  const inputFiles = fileExtraction.extractedFiles;

  const enhancedSystemPrompt = fileExtraction.hasFiles 
    ? systemPrompt + createFileContextPrompt(inputFiles)
    : systemPrompt;

  // Add user message to database
  try {
    const userMessage: UserMessageInput = {
      query,
      inputFiles: createInputFiles(inputFiles)
    };
    await addUserMessage(userContext.chatId, userMessage, userContext);
  } catch (error) {
    console.error('Failed to add user message to database:', error);
  }

  // Initialize agent message in database
  let messageId: string;
  try {
    messageId = await initializeAgentMessage(userContext.chatId, 'doubt_clearance', inputFiles);
  } catch (error) {
    console.error('Failed to initialize agent message in database:', error);
    // Continue without database integration if initialization fails
    messageId = '';
  }

  const mcpClient = await createMCPClientWithContext(userContext);
  const tools = await mcpClient.tools();

  const allowedTools = ['web_search', 'retrieve_content'];
  const filteredTools = Object.keys(tools)
    .filter(key => allowedTools.includes(key))
    .reduce((obj, key) => {
      obj[key] = tools[key];
      return obj;
    }, {} as typeof tools);

  let stepCount = 0;
  let fullResponse = '';
  
  const doubtState = {
    searchQueries: [] as string[],
    totalSearches: 0,
    responseLength: 0,
    completed: false,
    extractedFiles: inputFiles,
    fileRetrievals: 0,
    websitesReferenced: [] as string[]
  };

  if (fileExtraction.hasFiles) {
    stepCount++;
    yield {
      step: stepCount,
      type: 'status' as const,
      status: `📁 Detected ${inputFiles.length} file(s): ${inputFiles.join(', ')}`
    };
  }

  try {
    const agent = new Agent({
      model: google('gemini-2.5-flash'),
      system: enhancedSystemPrompt,
      tools: filteredTools,
      stopWhen: stepCountIs(10),
      temperature: 0.7
    });

    const result = await agent.stream({
      prompt: fileExtraction.hasFiles ? 
        `${actualQuery}\n\nNote: Please retrieve and analyze the following files first: ${inputFiles.join(', ')}` : 
        actualQuery
    });

    for await (const part of result.fullStream) {
      if (part.type === 'tool-call') {
        stepCount++;
        const toolArgs = 'args' in part ? part.args : part.input;
        
        let statusMessage = '';
        if (part.toolName === 'web_search') {
          doubtState.totalSearches++;
          const searchQuery = (toolArgs as any)?.query;
          doubtState.searchQueries.push(searchQuery || 'unknown');
          statusMessage = `🔍 Searching for: "${searchQuery}"...`;
        } else if (part.toolName === 'retrieve_content') {
          doubtState.fileRetrievals++;
          const filenames = (toolArgs as any)?.inputFiles || [];
          statusMessage = `📄 Retrieving content from: ${Array.isArray(filenames) ? filenames.join(', ') : filenames}...`;
        }
        
        if (statusMessage) {
          yield {
            step: stepCount,
            type: 'status' as const,
            status: statusMessage
          };
        }
        
        const currentStep: DoubtClearanceStep = {
          step: stepCount,
          type: 'tool_call' as const,
          toolName: part.toolName,
          toolArgs: toolArgs
        };

        // Update database with step
        if (messageId) {
          try {
            await updateAgentMessageStep(
              userContext.chatId, 
              messageId, 
              convertDoubtClearanceStep(currentStep)
            );
          } catch (error) {
            console.error('Failed to update step in database:', error);
          }
        }
        
        yield currentStep;
      } else if (part.type === 'tool-result') {
        const toolResult = 'result' in part ? part.result : part.output;
        
        // Extract websites from search results
        if (part.toolName === 'web_search' && toolResult) {
          try {
            // Parse search results to extract domains
            const resultText = JSON.stringify(toolResult);
            // Extract URLs using regex
            const urlMatches = resultText.match(/https?:\/\/[^\s"'\]},]+/g) || [];
            const domains = urlMatches.map(url => {
              try {
                return new URL(url).hostname;
              } catch {
                return null;
              }
            }).filter((domain): domain is string => domain !== null);
            
            // Add unique domains to websitesReferenced
            domains.forEach(domain => {
              if (!doubtState.websitesReferenced.includes(domain)) {
                doubtState.websitesReferenced.push(domain);
              }
            });
          } catch (error) {
            // Ignore errors in parsing search results
          }
        }
        
        const currentStep: DoubtClearanceStep = {
          step: stepCount,
          type: 'tool_result' as const,
          toolName: part.toolName,
          toolResult: toolResult
        };

        // Update database with step
        if (messageId) {
          try {
            await updateAgentMessageStep(
              userContext.chatId, 
              messageId, 
              convertDoubtClearanceStep(currentStep)
            );
          } catch (error) {
            console.error('Failed to update step in database:', error);
          }
        }
        
        yield currentStep;
      } else if (part.type === 'text-delta') {
        if (part.text) {
          doubtState.responseLength += part.text.length;
          fullResponse += part.text;
          
          // Update accumulated response in database
          if (messageId) {
            try {
              await appendTextToAgentMessage(userContext.chatId, messageId, fullResponse);
            } catch (error) {
              console.error('Failed to update response in database:', error);
            }
          }
        }
        
        yield {
          step: stepCount,
          type: 'text' as const,
          text: part.text
        };
      } else if (part.type === 'finish') {
        doubtState.completed = true;
        
        // Finalize agent message in database
        if (messageId) {
          try {
            const executionSummary = {
              success: part.finishReason !== 'error',
              totalToolCalls: doubtState.totalSearches + doubtState.fileRetrievals,
              totalTextLength: doubtState.responseLength,
              duration: 0, // Will be calculated by the database
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
    
    // Finalize agent message with error in database
    if (messageId) {
      try {
        const executionSummary = {
          success: false,
          totalToolCalls: doubtState.totalSearches + doubtState.fileRetrievals,
          totalTextLength: doubtState.responseLength,
          duration: 0,
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
      step: stepCount,
      type: 'finish' as const,
      finishReason: 'error',
      text: `Doubt clearance failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
