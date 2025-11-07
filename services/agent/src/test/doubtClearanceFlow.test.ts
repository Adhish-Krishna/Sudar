/**
 * Test file for Doubt Clearance Flow
 * 
 * This file demonstrates how to use the doubtClearanceFlow for quick
 * question answering and doubt resolution using web search.
 */

import { doubtClearanceFlow } from '../flows/doubtClearanceFlow';
import type { UserContext } from '../mcpClient';
import dotenv from 'dotenv';

dotenv.config();

async function testDoubtClearanceFlow() {
  const userContext: UserContext = {
    userId: 'student-123',
    chatId: 'doubt-chat-456',
    subjectId: 'general-studies-789',
    classroomId: 'test-classroom-897',
  };

  const query = 'What is the difference between renewable and non-renewable energy sources? Can you give me some examples of each?';

  console.log('❓ Starting Doubt Clearance Flow\n');
  console.log('═'.repeat(80));
  console.log('🎓 DOUBT CLEARANCE SESSION');
  console.log('═'.repeat(80));
  console.log('❓ Student Question:', query);
  console.log('👤 Student Context:', userContext);
  console.log('🌐 MCP Server URL:', process.env.MCP_SERVER_URL);
  console.log('═'.repeat(80));
  console.log();

  try {
    let fullResponse = '';
    let toolCallCount = 0;

    // Execute the doubt clearance flow
    for await (const step of doubtClearanceFlow({
      query,
      userContext
    })) {
      
      // Handle status messages
      if (step.type === 'status') {
        console.log(`\n${step.status}`);
      }
      
      // Handle tool calls
      else if (step.type === 'tool_call') {
        toolCallCount++;
        console.log(`\n🔧 Search #${toolCallCount}:`);
        console.log(`   Tool: ${step.toolName}`);
        if (step.toolName === 'web_search') {
          console.log(`   Query: "${(step.toolArgs as any)?.query}"`);
          console.log(`   Max Results: ${(step.toolArgs as any)?.max_results || 'default'}`);
        }
      }
      
      else if (step.type === 'tool_result') {
        console.log(`\n✅ Search Result: Found information`);
      }
      
      else if (step.type === 'text') {
        if (step.text) {
          fullResponse += step.text;
          process.stdout.write(step.text);
        }
      }
      
      else if (step.type === 'metadata') {
        console.log('\n\n');
        console.log('─'.repeat(80));
        console.log('📊 DOUBT CLEARANCE SUMMARY');
        console.log('─'.repeat(80));
        
        if (step.metadata?.searchQueries && step.metadata.searchQueries.length > 0) {
          console.log(`\n🔍 Searches Performed (${step.metadata.searchQueries.length}):`);
          step.metadata.searchQueries.forEach((q: string, i: number) => {
            console.log(`   ${i + 1}. ${q}`);
          });
        }
        
        console.log(`\n📊 Statistics:`);
        console.log(`   Total Searches: ${step.metadata?.totalSearches || 0}`);
        console.log(`   Response Length: ${step.metadata?.responseLength || 0} characters`);
        console.log(`   Completed: ${step.metadata?.completed ? '✅ Yes' : '❌ No'}`);
        console.log('─'.repeat(80));
      }
      
      else if (step.type === 'finish') {
        console.log('\n\n');
        console.log('═'.repeat(80));
        console.log('✨ DOUBT CLEARANCE COMPLETE!');
        console.log('═'.repeat(80));
        console.log(`   Finish Reason: ${step.finishReason}`);
        console.log(`   Total Tool Calls: ${toolCallCount}`);
        console.log(`   Response Length: ${fullResponse.length} characters`);
        
        if (step.finishReason === 'error' && step.text) {
          console.error(`\n❌ Error: ${step.text}`);
        }
      }
    }

    console.log('\n\n');
    console.log('═'.repeat(80));
    console.log('📝 COMPLETE RESPONSE');
    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('\n❌ Error during doubt clearance:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

console.log('🚀 Running Doubt Clearance Flow Test\n');
testDoubtClearanceFlow().catch(console.error);