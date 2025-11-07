/**
 * Test file for Content Researcher Agent
 * 
 * This file demonstrates how to use the contentResearcher agent
 * and prints the research process to the console.
 * 
 * Note: This test runs outside Docker, so it uses localhost URLs.
 * Make sure to set the MCP_SERVER_URL environment variable or
 * ensure the MCP server is running on localhost:3002
 */

import { contentResearcher } from '../agent/contentResearcher';
import type { UserContext } from '../mcpClient';

async function testContentResearcher() {

  const userContext: UserContext = {
    userId: 'test-user-123',
    chatId: 'test-chat-456',
    subjectId: 'test-subject-789',
    classroomId: 'test-classroom-897',
  };

  const query = `I need a comprehensive research report on the impact of artificial intelligence on healthcare systems. 
  
  Please investigate:
  1. Current AI applications in medical diagnosis and treatment planning
  2. Real-world case studies of hospitals or clinics successfully implementing AI systems
  3. Statistical data on AI accuracy compared to human doctors in specific medical fields
  4. Ethical concerns and regulatory challenges surrounding AI in healthcare
  5. Future predictions for AI integration in healthcare over the next 10 years
  6. Cost-benefit analysis of implementing AI systems in healthcare facilities
  
  I need specific examples, actual statistics, expert opinions from recent sources (2023-2025), 
  and references to peer-reviewed studies if available. Please search multiple sources and 
  scrape detailed information from the most authoritative websites. Also check if we have 
  any previously saved research on this topic.`;

  const researchMode: 'simple' | 'moderate' | 'deep' = 'simple';

  console.log('📝 Query:', query);
  console.log('🔍 Starting Content Research...');
  console.log('⚙️  Research Mode:', researchMode.toUpperCase());
  console.log('👤 User Context:', userContext);
  console.log('🌐 MCP Server URL:', process.env.MCP_SERVER_URL);
  console.log('─'.repeat(80));
  console.log();

  try {
    let fullAnswer = '';
    let toolCallCount = 0;

    for await (const step of contentResearcher({ 
      query, 
      userContext,
      research_mode: researchMode 
    })) {
      
      if (step.type === 'status') {
        console.log(`\n${step.status}`);
      }
      else if (step.type === 'tool_call') {
        toolCallCount++;
        // console.log(`\n🔧 Tool Call #${toolCallCount}:`);
        // console.log(`   Tool: ${step.toolName}`);
        // console.log(`   Args:`, JSON.stringify(step.toolArgs, null, 2));
      } 
    //   else if (step.type === 'tool_result') {
    //     // console.log(`\n✅ Tool Result:`);
    //     // console.log(`   Tool: ${step.toolName || 'unknown'}`);
    //     // const resultStr = JSON.stringify(step.toolResult);
    //     // if (resultStr.length > 500) {
    //     //   console.log(`   Result: ${resultStr.substring(0, 500)}... (truncated)`);
    //     // } else {
    //     //   console.log(`   Result:`, step.toolResult);
    //     // }
    //   } 
      else if (step.type === 'text') {
        if (step.text) {
          fullAnswer += step.text;
          process.stdout.write(step.text);
        }
      } 
      else if (step.type === 'metadata') {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('📊 RESEARCH METADATA');
        console.log('═'.repeat(80));
        if (step.metadata?.researchMode) {
          console.log(`\n⚙️  Research Mode: ${step.metadata.researchMode.toUpperCase()}`);
        }
        if (step.metadata?.searchQueries && step.metadata.searchQueries.length > 0) {
          console.log(`\n🔍 Search Queries (${step.metadata.searchQueries.length}):`);
          step.metadata.searchQueries.forEach((query, idx) => {
            console.log(`   ${idx + 1}. ${query}`);
          });
        }
        if (step.metadata?.websitesResearched && step.metadata.websitesResearched.length > 0) {
          console.log(`\n🌐 Websites Researched (${step.metadata.websitesResearched.length}):`);
          step.metadata.websitesResearched.forEach((url, idx) => {
            console.log(`   ${idx + 1}. ${url}`);
          });
        }
        console.log(`\n🔧 Total Tool Calls: ${step.metadata?.totalToolCalls || 0}`);
        console.log('═'.repeat(80));
      }
      else if (step.type === 'finish') {
        console.log('\n');
        console.log('─'.repeat(80));
        console.log(`\n✨ Research Complete!`);
        console.log(`   Finish Reason: ${step.finishReason}`);
        console.log(`   Total Tool Calls: ${toolCallCount}`);
        console.log(`   Answer Length: ${fullAnswer.length} characters`);
        
        if (step.finishReason === 'error' && step.text) {
          console.error(`\n❌ Error: ${step.text}`);
        }
      }
    }

    // console.log('\n');
    // console.log('═'.repeat(80));
    // console.log('FULL ANSWER:');
    // console.log('═'.repeat(80));
    // console.log(fullAnswer);
    // console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during research:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

async function testContentResearcherSimple() {
  const userContext: UserContext = {
    userId: 'test-user-123',
    chatId: 'test-chat-456',
    subjectId: 'test-subject-789',
    classroomId: 'test-classroom-897',
  };

  const query = 'What is the capital of France?';

  console.log('🔍 Simple Research Test');
  console.log('📝 Query:', query);
  console.log();

  let answer = '';
  
  for await (const step of contentResearcher({ query, userContext })) {
    if (step.type === 'text') {
      answer += step.text;
    } else if (step.type === 'tool_call') {
      console.log(`   → Using tool: ${step.toolName}`);
    }
  }

  console.log('\n📖 Answer:');
  console.log(answer);
}

if (require.main === module) {
  console.log('🚀 Running Content Researcher Test\n');
  
  testContentResearcher()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testContentResearcher, testContentResearcherSimple };
