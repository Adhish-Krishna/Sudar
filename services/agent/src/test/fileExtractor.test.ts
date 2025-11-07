/**
 * Simple File Extraction Utility Test
 * 
 * A simple test to verify the file extraction utility works correctly
 * without needing MCP server connection.
 */

import { extractFilesFromQuery, createFileContextPrompt } from '../utils/fileExtractor';

console.log('🧪 Testing File Extraction Utility');
console.log('=' .repeat(50));

const testQueries = [
  '@sample.pdf use this doc and tell me what it is about.',
  'Based on @lesson1.pdf and @notes.txt, explain the concept',
  'Compare the data in @report1.xlsx with @report2.csv',
  'No files mentioned in this query',
  '@single-file.docx analysis please',
  'Multiple files: @file1.pdf @file2.txt and @final-report.xlsx',
  'Edge case: @file_with-special.chars.txt and @UPPERCASE.PDF',
  'Duplicate: @same.pdf and @same.pdf should only appear once'
];

for (const query of testQueries) {
  const result = extractFilesFromQuery(query);
  console.log(`\n📝 Query: "${query}"`);
  console.log(`📁 Files extracted: ${JSON.stringify(result.extractedFiles)}`);
  console.log(`✨ Cleaned query: "${result.cleanedQuery}"`);
  console.log(`✅ Has files: ${result.hasFiles}`);
  
  if (result.hasFiles) {
    const contextPrompt = createFileContextPrompt(result.extractedFiles);
    console.log(`📄 Context prompt:\n${contextPrompt}`);
  }
  console.log('-'.repeat(40));
}

console.log('\n🎉 File extraction utility test completed!');