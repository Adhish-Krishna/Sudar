/**
 * Content Researcher Agent
 * 
 * An autonomous AI agent that conducts research using web search, web scraping,
 * and RAG retrieval tools to answer user queries with comprehensive, well-sourced information.
 * 
 * RESEARCH MODES:
 * - **simple**: Quick, focused research (2-3 tool calls) - checks existing knowledge and does one web search
 * - **moderate**: Balanced research (5-7 tool calls) - multiple searches and scrapes 1-2 authoritative sites
 * - **deep**: Exhaustive research (8-10 tool calls) - extensive searches, scrapes 3-5 sites, cross-references sources
 * 
 * FEATURES:
 * - Maintains state of all websites researched and search queries executed
 * - Streams status messages before each tool call (e.g., "Searching the web for...")
 * - Returns metadata with complete list of researched websites, queries, and tool call count
 */

import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { google } from '@ai-sdk/google';
import { createMCPClientWithContext, type UserContext } from '../mcpClient';
import { contentResearcherPrompt } from '../prompts';
import dotenv from 'dotenv';
dotenv.config();

export interface ResearchOptions {
  query: string;
  userContext: UserContext;
  systemPrompt?: string;
  research_mode?: 'simple' | 'moderate' | 'deep';
  inputFiles?: string[];
}

export interface ResearchResult {
  chunk: any;
  fullText: string;
}

export async function* contentResearcher(
  options: ResearchOptions
): AsyncGenerator<ResearchResult> {
  const {
    query,
    userContext,
    systemPrompt = contentResearcherPrompt,
    research_mode = 'moderate',
    inputFiles = []
  } = options;

  // Research mode instructions
  const researchModeInstructions = {
    simple: `RESEARCH MODE: SIMPLE
    - Perform quick, focused research (2-3 tool calls maximum)
    - Check existing knowledge base first with retrieve_content
    - Do ONE web_search for the most relevant information
    - Provide a concise, straightforward answer
    - Skip website scraping unless absolutely necessary
    - Focus on speed over depth
    `,
    moderate: `RESEARCH MODE: MODERATE (Default)
    - Conduct balanced research (5-7 tool calls)
    - Check existing knowledge base with retrieve_content
    - Perform 2-3 web_search calls for different aspects of the query
    - Scrape 1-2 of the most authoritative websites for detailed information
    - Provide a comprehensive answer with proper citations
    - Balance depth with efficiency
    `,
    deep: `RESEARCH MODE: DEEP
    - Conduct exhaustive, thorough research (8-10 tool calls)
    - Check existing knowledge base extensively with retrieve_content
    - Perform multiple web_search calls (4-6) covering all angles of the query
    - Scrape 3-5 authoritative websites for in-depth content
    - Cross-reference information from multiple sources
    - Provide a highly detailed, well-researched answer with extensive citations
    - Prioritize comprehensiveness and accuracy over speed
    `
  };

  const enhancedSystemPrompt = `${systemPrompt} ${researchModeInstructions[research_mode]}${inputFiles.length > 0 ? `

  IMPORTANT: The user has referenced the following files: ${inputFiles.join(', ')}
  You MUST use retrieve_content tool to get the contents of these files BEFORE conducting any web research.
  These files should be your primary source of context for the research query.` : ''}`;

  const mcpClient = await createMCPClientWithContext(userContext);
  const tools = await mcpClient.tools();

  try {
    const agent = new Agent({
      model: google('gemini-2.5-flash'),
      system: enhancedSystemPrompt,
      tools: tools,
      stopWhen: stepCountIs(12)
    });

    // Construct the prompt with file information if files are provided
    const researchPrompt = inputFiles.length > 0 
      ? `${query}\n\nIMPORTANT: Please retrieve and analyze the contents of these files first: ${inputFiles.join(', ')}\nThen conduct additional research as needed to provide a comprehensive answer.`
      : query;

    const result = await agent.stream({
      prompt: researchPrompt
    });

    let researchFindings = "";

    const stream = result.toUIMessageStream();
    
    for await (const chunk of stream) {
      if (chunk.type === 'text-delta' && chunk.delta) {
        researchFindings += chunk.delta;
      }
      yield {
        chunk,
        fullText: researchFindings
      };
    }

  } catch (error) {
    console.error('Error in content researcher:', error);
    throw error;
  }
}
