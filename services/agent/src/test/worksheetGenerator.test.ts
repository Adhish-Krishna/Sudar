/**
 * Test file for Worksheet Generator Agent
 * 
 * This file demonstrates how to use the worksheetGenerator agent
 * to create educational worksheets from research content.
 */

import { worksheetGenerator } from '../agent/worksheetGenerator';
import type { UserContext } from '../mcpClient';
import dotenv from 'dotenv';

dotenv.config();

const SAMPLE_RESEARCH_CONTENT = `
# Research Report: The Impact of Artificial Intelligence on Healthcare Systems

## Introduction
This report examines the multifaceted impact of artificial intelligence (AI) on healthcare systems, addressing current applications, real-world implementations, statistical performance, ethical considerations, future predictions, and cost-benefit analyses.

## 1. Current AI Applications in Medical Diagnosis and Treatment Planning

### AI-Powered Diagnostics
- **Breast Cancer**: AI can convert mammograms into risk assessment tools, identifying aggressive cancers up to 12 months earlier than standard methods
- **Lung Cancer**: AI demonstrates comparable or superior performance to radiologists in detecting lung cancer tumors from low-dose CT scans
- **Pancreatic Cancer**: Machine learning tools can accurately identify different risk levels in pancreatic cysts

### Personalized Treatment Planning
- AI facilitates personalized medicine by considering individual patient data, preferences, and predicted responses to medication
- AI algorithms can personalize treatment recommendations for chronic conditions like multiple sclerosis and epilepsy

## 2. Real-World Case Studies

### Pacific Northwest Health System
- Implemented AI scheduling across 12 hospitals
- Results: 32% reduction in nurse overtime, 27% increase in staff satisfaction scores within six months

### Level I Trauma Center
- Integrated healthcare shift planning technology
- Results: 45% reduction in last-minute schedule changes, 28% decrease in agency staffing costs

## 3. Statistical Data on AI Accuracy

### Babylon Triage and Diagnostic System
- Demonstrated diagnostic accuracy comparable to human doctors in identifying conditions modeled by clinical vignettes
- Performance measured in terms of precision and recall

### Breast Cancer Detection
- AI risk algorithms can outperform trained radiologists in identifying patterns suggesting aggressive breast cancer risk

## 4. Ethical Concerns and Regulatory Challenges

- **Data Privacy**: Ensuring compliance with regulations like GDPR and HIPAA
- **Algorithmic Bias**: Addressing potential biases in AI algorithms to ensure equitable healthcare delivery
- **Transparency**: Providing clear explanations of AI decision-making processes
- **Legal Liability**: Establishing clear legal frameworks for AI-related errors and outcomes

## 5. Future Predictions (Next 10 Years)

- **Personalized Medicine at Scale**: AI will analyze genetic, environmental, and lifestyle data
- **AI-Powered Diagnostics**: Near-perfect accuracy in imaging-based diagnostics
- **Drug Discovery**: AI will accelerate drug discovery, cutting costs and timelines
- **Market Growth**: The AI healthcare market is expected to reach $194 billion by 2030

## 6. Cost-Benefit Analysis

### Cost Factors
- Basic AI functionality: ~$40,000
- Custom deep learning solutions: $100,000+
- Patient readmission prediction model: $35,000–$45,000
- Cancer diagnosis deep learning model: $60,000–$100,000

### Cost-Saving Potential
- Accenture analysis: AI could save the US healthcare economy $150 billion in annual expenditure
- Benefits: improved diagnosis, reduced readmissions, manual task automation, fraud prevention
`;


async function testWorksheetGenerator() {
  const userContext: UserContext = {
    userId: 'test-user-123',
    chatId: 'test-chat-456',
    subjectId: 'test-subject-789',
    classroomId: 'test-classroom-897',
  };

  const query = 'Create a comprehensive worksheet for high school students about AI in healthcare with multiple choice questions, short answers, and case studies';

  console.log('🎯 Query:', query);
  console.log('📝 Starting Worksheet Generation...');
  console.log('👤 User Context:', userContext);
  console.log('🌐 MCP Server URL:', process.env.MCP_SERVER_URL);
  console.log('─'.repeat(80));
  console.log();

  try {
    let fullText = '';
    let toolCallCount = 0;

    for await (const step of worksheetGenerator({ 
      query, 
      content: SAMPLE_RESEARCH_CONTENT,
      userContext 
    })) {
      
      if (step.type === 'status') {
        console.log(`\n${step.status}`);
      }
      else if (step.type === 'tool_call') {
        toolCallCount++;
        // console.log(`\n💾 Tool Call #${toolCallCount}:`);
        // console.log(`   Tool: ${step.toolName}`);
        // console.log(`   Title: ${(step.toolArgs as any)?.title || 'N/A'}`);
        // console.log(`   Content Length: ${(step.toolArgs as any)?.content?.length || 0} characters`);
      } 
    //   else if (step.type === 'tool_result') {
    //     console.log(`\n✅ Tool Result:`);
    //     console.log(`   Tool: ${step.toolName || 'unknown'}`);
        
    //     const resultStr = JSON.stringify(step.toolResult, null, 2);
    //     console.log(`   Result:`, resultStr);
    //   } 
      else if (step.type === 'text') {
        if (step.text) {
          fullText += step.text;
          process.stdout.write(step.text);
        }
      } 
      else if (step.type === 'metadata') {
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('📊 WORKSHEET GENERATION METADATA');
        console.log('═'.repeat(80));
        if (step.metadata?.worksheetTitle) {
          console.log(`\n📄 Worksheet Title: ${step.metadata.worksheetTitle}`);
        }
        if (step.metadata?.contentLength) {
          console.log(`📏 Content Length: ${step.metadata.contentLength} characters`);
        }
        if (step.metadata?.savedSuccessfully !== undefined) {
          console.log(`💾 Saved Successfully: ${step.metadata.savedSuccessfully ? '✅ Yes' : '❌ No'}`);
        }
        if (step.metadata?.pdfLocation) {
          console.log(`📍 PDF Location: ${step.metadata.pdfLocation}`);
        }
        console.log(`🔧 Total Tool Calls: ${step.metadata?.totalToolCalls || 0}`);
        console.log('═'.repeat(80));
      }
      else if (step.type === 'finish') {
        console.log('\n');
        console.log('─'.repeat(80));
        console.log(`\n✨ Worksheet Generation Complete!`);
        console.log(`   Finish Reason: ${step.finishReason}`);
        console.log(`   Total Tool Calls: ${toolCallCount}`);
        console.log(`   Text Output Length: ${fullText.length} characters`);
      }
    }

    // console.log('\n');
    // console.log('═'.repeat(80));
    // console.log('FULL TEXT OUTPUT:');
    // console.log('═'.repeat(80));
    // console.log(fullText);
    // console.log('═'.repeat(80));
    // console.log();
    console.log('✅ Test completed successfully');

  } catch (error) {
    console.error('\n❌ Error during worksheet generation:');
    console.error(error);
    process.exit(1);
  }
}

console.log('🚀 Running Worksheet Generator Test\n');
testWorksheetGenerator().catch(console.error);
