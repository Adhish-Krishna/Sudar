/**
 * Test file for Worksheet Flow
 * 
 * This file demonstrates the complete worksheet generation flow that:
 * 1. Researches content using contentResearcher agent
 * 2. Generates worksheet using worksheetGenerator agent
 * 3. Streams all events from both phases in real-time
 */

import { worksheetFlow } from '../flows/worksheetFlow';
import type { UserContext } from '../mcpClient';
import dotenv from 'dotenv';

dotenv.config();

async function testWorksheetFlow() {
  // Fake user context for testing
  const userContext: UserContext = {
    userId: 'test-user-123',
    chatId: 'test-chat-456',
    subjectId: 'test-subject-789',
    classroomId: 'test-classroom-897',
  };

  // User query for the complete flow
  const query = 'Create a worksheet about arithmetics for gade 2 students. Inlcude 10 MCQ questions alone.';

  const researchMode: 'simple' | 'moderate' | 'deep' = 'simple';

  console.log('🚀 Starting Complete Worksheet Flow\n');
  console.log('═'.repeat(80));
  console.log('📋 FLOW CONFIGURATION');
  console.log('═'.repeat(80));
  console.log('🎯 Query:', query);
  console.log('⚙️  Research Mode:', researchMode.toUpperCase());
  console.log('👤 User Context:', userContext);
  console.log('🌐 MCP Server URL:', process.env.MCP_SERVER_URL);
  console.log('═'.repeat(80));
  console.log();

  try {
    let researchText = '';
    let worksheetText = '';
    let currentPhase = '';

    for await (const step of worksheetFlow({
      query,
      userContext,
      research_mode: researchMode
    })) {
      
      if (step.type === 'phase_change' && step.phaseInfo) {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log(step.phaseInfo.message);
        console.log('═'.repeat(80));
        console.log();
        currentPhase = step.phaseInfo.currentPhase;
      }
      
      else if (step.type === 'status') {
        console.log(`\n${step.status}`);
      }
      
      // Handle tool calls
      else if (step.type === 'tool_call') {
        console.log(`\n🔧 [${step.phase.toUpperCase()}] Tool Call:`);
        console.log(`   Tool: ${step.toolName}`);
        if (step.toolName === 'web_search') {
          console.log(`   Query: ${(step.toolArgs as any)?.query}`);
        } else if (step.toolName === 'scrape_websites') {
          console.log(`   URLs: ${(step.toolArgs as any)?.urls?.length || 0} websites`);
        } else if (step.toolName === 'save_content') {
          console.log(`   Title: ${(step.toolArgs as any)?.title}`);
          console.log(`   Content: ${(step.toolArgs as any)?.content?.length || 0} characters`);
        }
      }
      
      else if (step.type === 'tool_result') {
        console.log(`\n✅ [${step.phase.toUpperCase()}] Tool Result: ${step.toolName}`);
      }
      
      else if (step.type === 'text') {
        if (step.text) {
          if (step.phase === 'research') {
            researchText += step.text;
          } else if (step.phase === 'generation') {
            worksheetText += step.text;
          }
          // Stream to console with phase indicator
          process.stdout.write(step.text);
        }
      }
      
      else if (step.type === 'metadata' && step.phase !== 'flow') {
        console.log('\n');
        console.log('─'.repeat(80));
        console.log(`📊 [${step.phase.toUpperCase()}] PHASE METADATA`);
        console.log('─'.repeat(80));
        
        if (step.phase === 'research' && step.metadata) {
          console.log(`⚙️  Research Mode: ${step.metadata.researchMode?.toUpperCase()}`);
          console.log(`🔍 Search Queries: ${step.metadata.searchQueries?.length || 0}`);
          step.metadata.searchQueries?.forEach((q: string, i: number) => {
            console.log(`   ${i + 1}. ${q}`);
          });
          console.log(`🌐 Websites Researched: ${step.metadata.websitesResearched?.length || 0}`);
          step.metadata.websitesResearched?.forEach((url: string, i: number) => {
            console.log(`   ${i + 1}. ${url}`);
          });
          console.log(`🔧 Tool Calls: ${step.metadata.totalToolCalls || 0}`);
        } else if (step.phase === 'generation' && step.metadata) {
          console.log(`📄 Worksheet Title: ${step.metadata.worksheetTitle}`);
          console.log(`📏 Content Length: ${step.metadata.contentLength} characters`);
          console.log(`💾 Saved Successfully: ${step.metadata.savedSuccessfully ? '✅ Yes' : '❌ No'}`);
          console.log(`📍 PDF Location: ${step.metadata.pdfLocation}`);
          console.log(`🔧 Tool Calls: ${step.metadata.totalToolCalls || 0}`);
        }
        console.log('─'.repeat(80));
      }

      // Handle research summary metadata from flow
      else if (step.type === 'metadata' && step.phase === 'flow' && step.metadata?.researchSummary) {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('📊 RESEARCH PHASE SUMMARY');
        console.log('═'.repeat(80));
        
        const summary = step.metadata.researchSummary;
        console.log(`\n⚙️  Research Mode: ${summary.researchMode?.toUpperCase()}`);
        console.log(`📝 Findings Gathered: ${summary.findingsLength} characters`);
        console.log(`🔧 Tool Calls Used: ${summary.totalToolCalls}`);
        
        if (summary.searchQueries && summary.searchQueries.length > 0) {
          console.log(`\n🔍 Search Queries (${summary.searchQueries.length}):`);
          summary.searchQueries.forEach((q: string, i: number) => {
            console.log(`   ${i + 1}. ${q}`);
          });
        }
        
        if (summary.websitesResearched && summary.websitesResearched.length > 0) {
          console.log(`\n🌐 Websites Researched (${summary.websitesResearched.length}):`);
          summary.websitesResearched.forEach((url: string, i: number) => {
            console.log(`   ${i + 1}. ${url}`);
          });
        }
        console.log('═'.repeat(80));
      }
      
      else if (step.type === 'metadata' && step.phase === 'flow' && step.metadata?.flowSummary) {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('📊 COMPLETE FLOW SUMMARY');
        console.log('═'.repeat(80));
        
        const metadata = step.metadata;
        
        if (metadata.flowSummary) {
          console.log('\n🎯 Overall Flow:');
          console.log(`   Success: ${metadata.flowSummary.success ? '✅ Yes' : '❌ No'}`);
          console.log(`   Total Steps: ${metadata.flowSummary.totalSteps}`);
          console.log(`   Duration: ${metadata.flowSummary.duration}ms`);
          console.log(`   Start Time: ${metadata.flowSummary.startTime}`);
          console.log(`   End Time: ${metadata.flowSummary.endTime}`);
        }
        
        if (metadata.researchPhase) {
          console.log('\n🔬 Research Phase:');
          console.log(`   Mode: ${metadata.researchPhase.researchMode?.toUpperCase()}`);
          console.log(`   Websites: ${metadata.researchPhase.websitesResearched?.length || 0}`);
          console.log(`   Queries: ${metadata.researchPhase.searchQueries?.length || 0}`);
          console.log(`   Tool Calls: ${metadata.researchPhase.totalToolCalls}`);
          console.log(`   Findings: ${metadata.researchPhase.findingsLength} characters`);
          console.log(`   Completed: ${metadata.researchPhase.completed ? '✅' : '❌'}`);
        }
        
        if (metadata.generationPhase) {
          console.log('\n📝 Generation Phase:');
          console.log(`   Title: ${metadata.generationPhase.worksheetTitle}`);
          console.log(`   Content: ${metadata.generationPhase.contentLength} characters`);
          console.log(`   Saved: ${metadata.generationPhase.savedSuccessfully ? '✅' : '❌'}`);
          console.log(`   Location: ${metadata.generationPhase.pdfLocation}`);
          console.log(`   Tool Calls: ${metadata.generationPhase.totalToolCalls}`);
          console.log(`   Completed: ${metadata.generationPhase.completed ? '✅' : '❌'}`);
        }
        
        console.log('═'.repeat(80));
      }
      
      else if (step.type === 'finish') {
        if (step.phase === 'flow') {
          console.log('\n');
          console.log('═'.repeat(80));
          console.log(step.status);
          console.log('═'.repeat(80));
        }
      }
    }

    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📈 CONTENT STATISTICS');
    console.log('═'.repeat(80));
    console.log(`Research Content: ${researchText.length} characters`);
    console.log(`Worksheet Content: ${worksheetText.length} characters`);
    console.log('═'.repeat(80));
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('\n❌ Error during worksheet flow:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testWorksheetFlow().catch(console.error);
