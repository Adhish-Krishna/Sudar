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
 * - Uses student performance data to focus on areas needing improvement
 */

import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { createMCPClientWithContext, type UserContext } from '../mcpClient';
import { worksheetGeneratorPrompt } from '../prompts';
import dotenv from 'dotenv';
import { models, get_model } from '../llm_models';
dotenv.config();

export interface WorksheetOptions {
  query: string;
  content: string;
  userContext: UserContext;
  systemPrompt?: string;
  performanceInsights?: string;
}

export async function* worksheetGenerator(
  options: WorksheetOptions
): AsyncGenerator<any> {
  const {
    query,
    content,
    userContext,
    systemPrompt = worksheetGeneratorPrompt,
    performanceInsights
  } = options;

  const mcpClient = await createMCPClientWithContext(userContext);
  const tools = await mcpClient.tools();

  const saveContentTool = Object.keys(tools)
    .filter(key => key === 'save_content')
    .reduce((obj, key) => {
      obj[key] = tools[key];
      return obj;
    }, {} as typeof tools)

  try {
    const agent = new Agent({
      model: get_model(models.worksheet_generator.provider, models.worksheet_generator.model),
      system: systemPrompt,
      tools: saveContentTool,
      stopWhen: stepCountIs(5),
      temperature: 0.7
    });

    // Build performance context section if available
    const performanceSection = performanceInsights
      ? `\n\n    ${performanceInsights}\n\n    IMPORTANT: Based on the performance insights above, focus MORE questions on low-scoring areas and topics where students commonly struggle.`
      : '';

    const prompt = `USER QUERY: ${query}

    RESEARCH CONTENT (FOR YOUR REFERENCE ONLY - DO NOT INCLUDE THIS IN THE WORKSHEET):
    ${content}
${performanceSection}
    IMPORTANT: The research content above is provided to help you understand the topic and create relevant questions. DO NOT include this research content in the worksheet you save. 

    Your task:
    1. Use the research content to understand the topic thoroughly
    2. Create practice questions that test understanding of this material
    3. Include an answer key ONLY if the user's query explicitly asks for it (look for phrases like "with answer key", "include answers", "with solutions", etc.)
    4. Save ONLY the questions (and answer key if requested) using the save_content tool

    Generate a worksheet with diverse question types (MCQ, short answer, long answer, critical thinking) based on the research content. After creating the questions, save them as a PDF using the save_content tool.`;

    const result = await agent.stream({
      prompt: prompt
    });

    const stream = result.toUIMessageStream();

    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    console.error('Error in worksheet generator:', error);
  }
}
