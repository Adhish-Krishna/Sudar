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


export interface ResearchStep {
  step: number;
  type: 'tool_call' | 'tool_result' | 'text' | 'finish' | 'status' | 'metadata';
  toolName?: string;
  toolArgs?: any;
  toolResult?: any;
  text?: string;
  finishReason?: string;
  status?: string;
  metadata?: {
    websitesResearched?: string[];
    totalToolCalls?: number;
    searchQueries?: string[];
    researchMode?: 'simple' | 'moderate' | 'deep';
  };
}

export interface ResearchOptions {
  query: string;
  userContext: UserContext;
  systemPrompt?: string;
  research_mode?: 'simple' | 'moderate' | 'deep';
  inputFiles?: string[];
}

export async function* contentResearcher(
  options: ResearchOptions
): AsyncGenerator<ResearchStep> {
  const {
    query,
    userContext,
    systemPrompt = contentResearcherPrompt,
    research_mode = 'moderate',
    inputFiles = []
  } = options;

  // Research mode instructions
  const researchModeInstructions = {
    simple: `
RESEARCH MODE: SIMPLE
- Perform quick, focused research (2-3 tool calls maximum)
- Check existing knowledge base first with retrieve_content
- Do ONE web_search for the most relevant information
- Provide a concise, straightforward answer
- Skip website scraping unless absolutely necessary
- Focus on speed over depth
`,
    moderate: `
RESEARCH MODE: MODERATE (Default)
- Conduct balanced research (5-7 tool calls)
- Check existing knowledge base with retrieve_content
- Perform 2-3 web_search calls for different aspects of the query
- Scrape 1-2 of the most authoritative websites for detailed information
- Provide a comprehensive answer with proper citations
- Balance depth with efficiency
`,
    deep: `
RESEARCH MODE: DEEP
- Conduct exhaustive, thorough research (8-10 tool calls)
- Check existing knowledge base extensively with retrieve_content
- Perform multiple web_search calls (4-6) covering all angles of the query
- Scrape 3-5 authoritative websites for in-depth content
- Cross-reference information from multiple sources
- Provide a highly detailed, well-researched answer with extensive citations
- Prioritize comprehensiveness and accuracy over speed
`
  };

  const enhancedSystemPrompt = `${systemPrompt}

${researchModeInstructions[research_mode]}${inputFiles.length > 0 ? `

IMPORTANT: The user has referenced the following files: ${inputFiles.join(', ')}
You MUST use retrieve_content tool to get the contents of these files BEFORE conducting any web research.
These files should be your primary source of context for the research query.` : ''}`;

  const mcpClient = await createMCPClientWithContext(userContext);
  const tools = await mcpClient.tools();

  let stepCount = 0;
  
  const researchState = {
    websitesResearched: new Set<string>(),
    searchQueries: [] as string[],
    totalToolCalls: 0
  };

  try {
    const agent = new Agent({
      model: google('gemini-2.5-flash'),
      system: enhancedSystemPrompt,
      tools: tools,
      stopWhen: stepCountIs(12) // Increased to allow for file retrieval
    });

    // Construct the prompt with file information if files are provided
    const researchPrompt = inputFiles.length > 0 
      ? `${query}\n\nIMPORTANT: Please retrieve and analyze the contents of these files first: ${inputFiles.join(', ')}\nThen conduct additional research as needed to provide a comprehensive answer.`
      : query;

    const result = await agent.stream({
      prompt: researchPrompt
    });

    for await (const part of result.fullStream) {
      if (part.type === 'tool-call') {
        stepCount++;
        researchState.totalToolCalls++;
        const toolArgs = 'args' in part ? part.args : part.input;
        
        let statusMessage = '';
        if (part.toolName === 'web_search') {
          statusMessage = `🔍 Searching the web for: "${(toolArgs as any)?.query}"...`;
          researchState.searchQueries.push((toolArgs as any)?.query || 'unknown');
        } else if (part.toolName === 'scrape_websites') {
          statusMessage = `📄 Scraping ${(toolArgs as any)?.urls?.length || 0} website(s) for detailed content...`;
          const urls = (toolArgs as any)?.urls;
          if (urls && Array.isArray(urls)) {
            urls.forEach((url: string) => researchState.websitesResearched.add(url));
          }
        } else if (part.toolName === 'retrieve_content') {
          statusMessage = `📚 Checking existing knowledge base for: "${(toolArgs as any)?.query}"...`;
        } else if (part.toolName === 'save_content') {
          statusMessage = `💾 Saving content: "${(toolArgs as any)?.title}"...`;
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
    
        if (part.toolName === 'web_search' && toolResult) {
          try {
            const resultContent = (toolResult as any)?.content?.[0]?.text;
            if (resultContent) {
              const parsed = JSON.parse(resultContent);
              if (parsed.results && Array.isArray(parsed.results)) {
                parsed.results.forEach((result: any) => {
                  if (result.url) {
                    researchState.websitesResearched.add(result.url);
                  }
                });
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
            websitesResearched: Array.from(researchState.websitesResearched),
            totalToolCalls: researchState.totalToolCalls,
            searchQueries: researchState.searchQueries,
            researchMode: research_mode
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
    console.error('Error in content researcher:', error);
    yield {
      step: stepCount,
      type: 'finish' as const,
      finishReason: 'error',
      text: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
