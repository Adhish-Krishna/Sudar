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
import { models, get_model } from '../llm_models';
import { createMCPClientWithContext, type UserContext } from '../mcpClient';
import { extractFilesFromQuery } from '../utils/fileExtractor';
import { contentResearcher } from '../agent/contentResearcher';
import { doubtClearanceFlowPrompt } from '../prompts';
import dotenv from 'dotenv';
import { startHeartbeat } from '../utils/streamUtils';
import type { Response } from 'express';
import {
  addUserMessage,
  initializeAgentMessage,
  addStepToAgentMessage,
  finalizeAgentMessage,
  convertChunkToStep
} from '../utils/chatUtils';

dotenv.config();

export interface DoubtClearanceOptions {
  query: string;
  userContext: UserContext;
  systemPrompt?: string;
  research_mode?: 'simple' | 'moderate' | 'deep';
  res: Response
}

export async function doubtClearanceFlow(
  options: DoubtClearanceOptions
): Promise<void> {
  const {
    query,
    userContext,
    systemPrompt = doubtClearanceFlowPrompt,
    research_mode = 'moderate',
    res
  } = options;

  const fileExtraction = extractFilesFromQuery(query);
  const actualQuery = fileExtraction.hasFiles ? fileExtraction.cleanedQuery : query;

  const startTime = Date.now();
  let stepNumber = 0;
  let toolCallCount = 0;
  let researchFindings = '';
  let finalAnswer = '';
  const researchedWebsites = new Set<string>();
  let stopHeartbeat: (() => void) | null = null;

  try {
    stopHeartbeat = startHeartbeat(res, 10000);
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
      'doubt_clearance',
      fileExtraction.extractedFiles
    );

    // Stream research phase
    for await (const result of contentResearcher({
      query: actualQuery,
      userContext,
      research_mode,
      inputFiles: fileExtraction.extractedFiles
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

    // Step 2: Use a simple agent to answer based on research findings
    const enhancedSystemPrompt = `${systemPrompt}

    IMPORTANT: You have been provided with research findings below. Use these findings to answer the user's query clearly and concisely. Do not repeat the research findings verbatim - synthesize them into a helpful answer.

    RESEARCH FINDINGS:
    ${researchFindings}`;

    const mcpClient = await createMCPClientWithContext(userContext);
    const tools = await mcpClient.tools();

    const allowedTools = ['retrieve_content'];
    const filteredTools = Object.keys(tools)
      .filter(key => allowedTools.includes(key))
      .reduce((obj, key) => {
        obj[key] = tools[key];
        return obj;
      }, {} as typeof tools);

    const agent = new Agent({
      model: get_model(models.doubt_clearance_agent.provider, models.doubt_clearance_agent.model),
      system: enhancedSystemPrompt,
      tools: filteredTools,
      stopWhen: stepCountIs(5),
      temperature: 0.7
    });

    const result = await agent.stream({
      prompt: actualQuery
    });

    const stream = result.toUIMessageStream();
    
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ phase: 'answer', ...chunk })}\n\n`);
      
      // Track tool calls
      if (chunk.type === 'tool-input-available') {
        toolCallCount++;
      }
      
      // Capture final answer from text
      if (chunk.type === 'text-delta' && chunk.delta) {
        finalAnswer += chunk.delta;
      }
      
      // Store step in database (skip if convertChunkToStep returns null)
      const step = convertChunkToStep(chunk, 'answer', stepNumber + 1);
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
      researchFindings + '\n\n' + finalAnswer,
      Array.from(researchedWebsites),
      '',
      {
        success: true,
        totalToolCalls: toolCallCount,
        totalTextLength: researchFindings.length + finalAnswer.length,
        duration,
        errorCount: 0,
        finalStatus: 'completed'
      }
    );
    
    // Stop heartbeat once flow completes
    stopHeartbeat();
    res.write(`data: ${JSON.stringify({ type: 'done', phase: 'completion' })}\n\n`);
    res.end();
    return;

  } catch (error) {
    console.error('Error in doubt clearance flow:', error);
    if (typeof stopHeartbeat === 'function') stopHeartbeat();
    res.write(`data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
    res.end();
  }
}
