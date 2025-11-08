/**
 * Worksheet Generator Agent
 * 
 * An autonomous AI agent that creates comprehensive educational worksheets
 * from research findings and saves them as PDF files.
 * 
 * FEATURES:
 * - Generates structured worksheets with learning objectives, questions, and activities
 * - Converts markdown content to PDF automatically using save_content tool
 * - Maintains state tracking: worksheet title, content length, save status, PDF location
 * - Streams status messages before saving (e.g., "Saving worksheet: [title] as PDF...")
 * - Returns metadata with worksheet details and save confirmation
 */

import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { createMCPClientWithContext, type UserContext } from '../mcpClient';
import { worksheetGeneratorPrompt } from '../prompts';
import dotenv from 'dotenv';

dotenv.config();

export interface WorksheetStep {
  step: number;
  type: 'tool_call' | 'tool_result' | 'text' | 'finish' | 'status' | 'metadata';
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  text?: string;
  finishReason?: string;
  status?: string;
  metadata?: {
    worksheetTitle?: string;
    contentLength?: number;
    savedSuccessfully?: boolean;
    pdfLocation?: string;
    totalToolCalls?: number;
  };
}

export interface WorksheetOptions {
  query: string;
  content: string;
  userContext: UserContext;
  systemPrompt?: string;
}

export async function* worksheetGenerator(
  options: WorksheetOptions
): AsyncGenerator<WorksheetStep> {
  const {
    query,
    content,
    userContext,
    systemPrompt = worksheetGeneratorPrompt
  } = options;

  const mcpClient = await createMCPClientWithContext(userContext);
  const tools = await mcpClient.tools();

  const saveContentTool = Object.keys(tools)
    .filter(key => key === 'save_content')
    .reduce((obj, key) => {
      obj[key] = tools[key];
      return obj;
    }, {} as typeof tools);

  let stepCount = 0;
  
  const worksheetState = {
    worksheetTitle: '',
    contentLength: 0,
    savedSuccessfully: false,
    pdfLocation: '',
    totalToolCalls: 0
  };

  try {
    const agent = new Agent({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      tools: saveContentTool,
      stopWhen: stepCountIs(5),
      temperature: 0.7 
    });

    const prompt = `USER QUERY: ${query}

RESEARCH CONTENT TO CREATE WORKSHEET FROM:
${content}

Based on the above research findings, create a comprehensive educational worksheet that helps students learn about this topic. Structure the worksheet with clear sections, learning objectives, practice questions, and activities. After creating the worksheet content in Markdown format, save it as a PDF using the save_content tool.`;

    const result = await agent.stream({
      prompt: prompt
    });

    for await (const part of result.fullStream) {
      if (part.type === 'tool-call') {
        stepCount++;
        worksheetState.totalToolCalls++;
        const toolArgs = 'args' in part ? part.args : part.input;
        
        let statusMessage = '';
        if (part.toolName === 'save_content') {
          const title = (toolArgs as any)?.title;
          const contentLen = (toolArgs as any)?.content?.length || 0;
          worksheetState.worksheetTitle = title || 'Untitled Worksheet';
          worksheetState.contentLength = contentLen;
          statusMessage = `Saving worksheet: "${title}" (${contentLen} characters) as PDF...`;
        }
        
        if (statusMessage) {
          yield {
            step: stepCount,
            type: 'status' as const,
            status: statusMessage
          };
        }
        
        yield {
          step: stepCount,
          type: 'tool_call' as const,
          toolName: part.toolName,
          toolArgs: toolArgs
        };
      } else if (part.type === 'tool-result') {
        const toolResult = 'result' in part ? part.result : part.output;
        
        if (part.toolName === 'save_content' && toolResult) {
          try {
            const resultContent = (toolResult as any)?.content?.[0]?.text;
            if (resultContent) {
              const parsed = JSON.parse(resultContent);
              if (parsed.success) {
                worksheetState.savedSuccessfully = true;
                worksheetState.pdfLocation = parsed.object_name || parsed.url || 'Unknown location';
              }
            }
          } catch (e) {

            }
        }
        
        yield {
          step: stepCount,
          type: 'tool_result' as const,
          toolName: part.toolName,
          toolResult: toolResult
        };
      } else if (part.type === 'text-delta') {
        yield {
          step: stepCount,
          type: 'text' as const,
          text: part.text
        };
      } else if (part.type === 'finish') {
        yield {
          step: stepCount,
          type: 'metadata' as const,
          metadata: {
            worksheetTitle: worksheetState.worksheetTitle,
            contentLength: worksheetState.contentLength,
            savedSuccessfully: worksheetState.savedSuccessfully,
            pdfLocation: worksheetState.pdfLocation,
            totalToolCalls: worksheetState.totalToolCalls
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
    console.error('Error in worksheet generator:', error);
    yield {
      step: stepCount,
      type: 'finish' as const,
      finishReason: 'error',
      text: `Worksheet generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

