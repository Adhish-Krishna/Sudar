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
import type { UserContext } from '../mcpClient';
import type { Response } from 'express';
import {
  addUserMessage,
  initializeAgentMessage,
  addStepToAgentMessage,
  finalizeAgentMessage,
  convertChunkToStep
} from '../utils/chatUtils';

export interface WorksheetFlowOptions {
  query: string;
  userContext: UserContext;
  research_mode?: 'simple' | 'moderate' | 'deep';
  systemPromptResearch?: string;
  systemPromptWorksheet?: string;
  res: Response
}

export async function worksheetFlow(
  options: WorksheetFlowOptions
): Promise<void> {
  const {
    query,
    userContext,
    research_mode = 'moderate',
    systemPromptResearch,
    systemPromptWorksheet,
    res
  } = options;

  // Extract file references from query
  const fileExtraction = extractFilesFromQuery(query);
  const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;

  const startTime = Date.now();
  let stepNumber = 0;
  let toolCallCount = 0;
  let researchFindings = '';
  let worksheetContent = '';
  const researchedWebsites = new Set<string>();

  try {
    // Add user message to database
    await addUserMessage(
      userContext.chatId,
      query,
      fileExtraction.extractedFiles,
      userContext
    );

    // Initialize agent message
    const messageId = await initializeAgentMessage(
      userContext.chatId,
      'worksheet_generation',
      fileExtraction.extractedFiles
    );

    // Stream research phase
    for await (const result of contentResearcher({
      query: actualQuery,
      userContext,
      research_mode,
      inputFiles: fileExtraction.extractedFiles,
      ...(systemPromptResearch && { systemPrompt: systemPromptResearch })
    })) {
      const chunk = { phase: 'research', ...result.chunk };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      
      // Track tool calls
      if (result.chunk.type === 'tool-input-available') {
        toolCallCount++;
      }
      
      // Store step in database (skip if convertChunkToStep returns null)
      const step = convertChunkToStep(result.chunk, 'research', stepNumber + 1);
      if (step) {
        stepNumber++;
        await addStepToAgentMessage(userContext.chatId, messageId, step);
      }
      
      researchFindings = result.fullText;
    }

    // Stream worksheet generation phase
    for await (const chunk of worksheetGenerator({
      query,
      content: researchFindings,
      userContext,
      ...(systemPromptWorksheet && { systemPrompt: systemPromptWorksheet })
    })) {
      res.write(`data: ${JSON.stringify({ phase: 'generation', ...chunk })}\n\n`);
      
      // Track tool calls
      if (chunk.type === 'tool-input-available') {
        toolCallCount++;
      }
      
      // Capture worksheet content from text
      if (chunk.type === 'text-delta' && chunk.delta) {
        worksheetContent += chunk.delta;
      }
      
      // Store step in database (skip if convertChunkToStep returns null)
      const step = convertChunkToStep(chunk, 'generation', stepNumber + 1);
      if (step) {
        stepNumber++;
        await addStepToAgentMessage(userContext.chatId, messageId, step);
      }
    }

    // Finalize agent message
    const duration = Date.now() - startTime;
    await finalizeAgentMessage(
      userContext.chatId,
      messageId,
      researchFindings,
      Array.from(researchedWebsites),
      worksheetContent,
      {
        success: true,
        totalToolCalls: toolCallCount,
        totalTextLength: researchFindings.length + worksheetContent.length,
        duration,
        errorCount: 0,
        finalStatus: 'completed'
      }
    );
    
    res.write(`data: ${JSON.stringify({ type: 'done', phase: 'flow' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in worksheet flow:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
    res.end();
  }
}
