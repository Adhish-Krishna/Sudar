/**
 * File Extraction Tests
 * 
 * Tests to verify that both doubtClearanceFlow and worksheetFlow
 * correctly extract file references from user queries and pass them
 * to the retrieve_content tool.
 */

import { doubtClearanceFlow } from '../flows/doubtClearanceFlow';
import { worksheetFlow } from '../flows/worksheetFlow';
import { extractFilesFromQuery } from '../utils/fileExtractor';

async function testFileExtraction() {
  console.log('🧪 Testing File Extraction Utility');
  console.log('=' .repeat(50));

  // Test various query patterns
  const testQueries = [
    '@sample.pdf use this doc and tell me what it is about.',
    'Based on @lesson1.pdf and @notes.txt, explain the concept',
    'Compare the data in @report1.xlsx with @report2.csv',
    'No files mentioned in this query',
    '@single-file.docx analysis please',
    'Multiple files: @file1.pdf @file2.txt and @final-report.xlsx'
  ];

  for (const query of testQueries) {
    const result = extractFilesFromQuery(query);
    console.log(`\nQuery: "${query}"`);
    console.log(`Files extracted: ${JSON.stringify(result.extractedFiles)}`);
    console.log(`Cleaned query: "${result.cleanedQuery}"`);
    console.log(`Has files: ${result.hasFiles}`);
  }
}

async function testDoubtClearanceWithFiles() {
  console.log('\n\n📚 Testing Doubt Clearance Flow with File References');
  console.log('=' .repeat(50));

  const userContext = {
    userId: 'test-user',
    chatId: 'test-chat',
    subjectId: 'test-subject',
    classroomId: 'test-classroom-897',
  };

  const queryWithFiles = '@lesson2.pdf @homework.txt explain the relationship between these documents and quantum mechanics';

  console.log(`Query: ${queryWithFiles}\n`);

  try {
    for await (const step of doubtClearanceFlow({
      query: queryWithFiles,
      userContext
    })) {
      if (step.type === 'status') {
        console.log(`[Step ${step.step}] ${step.status}`);
      } else if (step.type === 'tool_call') {
        console.log(`[Step ${step.step}] 🔧 ${step.toolName}: ${JSON.stringify(step.toolArgs, null, 2)}`);
      } else if (step.type === 'text') {
        if (step.text) {
          process.stdout.write(step.text);
        }
      } else if (step.type === 'metadata') {
        console.log('\n\n📊 Final Metadata:');
        console.log(JSON.stringify(step.metadata, null, 2));
      } else if (step.type === 'finish') {
        console.log(`\n\n✅ Completed: ${step.finishReason}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in doubt clearance flow:', error);
  }
}

async function testWorksheetFlowWithFiles() {
  console.log('\n\n📝 Testing Worksheet Flow with File References');
  console.log('=' .repeat(50));

  const userContext = {
    userId: 'test-user',
    chatId: 'test-chat',
    subjectId: 'test-subject',
    classroomId: 'test-classroom',
  };

  const queryWithFiles = '@syllabus.pdf @previous-exam.pdf create a comprehensive study worksheet covering the main topics';

  console.log(`Query: ${queryWithFiles}\n`);

  try {
    for await (const step of worksheetFlow({
      query: queryWithFiles,
      userContext,
      research_mode: 'moderate'
    })) {
      if (step.type === 'status') {
        console.log(`[${step.phase}] [Step ${step.step}] ${step.status}`);
      } else if (step.type === 'phase_change') {
        console.log(`\n🔄 ${step.phaseInfo?.message}\n`);
      } else if (step.type === 'tool_call') {
        console.log(`[${step.phase}] [Step ${step.step}] 🔧 ${step.toolName}: ${JSON.stringify(step.toolArgs, null, 2)}`);
      } else if (step.type === 'text') {
        if (step.text) {
          process.stdout.write(step.text);
        }
      } else if (step.type === 'metadata' && step.phase === 'flow') {
        console.log('\n\n📊 Final Flow Metadata:');
        console.log(JSON.stringify(step.metadata, null, 2));
      } else if (step.type === 'finish') {
        console.log(`\n\n✅ ${step.phase} Phase Completed: ${step.finishReason}`);
      }
    }
  } catch (error) {
    console.error('❌ Error in worksheet flow:', error);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting File Extraction Tests\n');
  
  await testFileExtraction();
  
  console.log('\n\n🔄 Starting Flow Tests...');
  console.log('Note: These tests will attempt to connect to MCP server');
  console.log('Make sure your MCP server is running and accessible\n');

  await testDoubtClearanceWithFiles();
  await testWorksheetFlowWithFiles();

  console.log('\n\n🎉 All tests completed!');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  testFileExtraction,
  testDoubtClearanceWithFiles,
  testWorksheetFlowWithFiles
};