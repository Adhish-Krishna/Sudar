/**
 * Chat Utilities
 * 
 * Helper functions for working with the chat schema.
 * Includes utilities for converting stream chunks to database format,
 * creating messages, and managing conversations.
 */

import { randomUUID } from 'crypto';
import { 
  ChatConversation, 
  IChatConversationDocument,
  IAgentStep,
  type IInputFile
} from '../models/chatSchema';
import type { UserContext } from '../mcpClient';

/**
 * Extract files from a query and convert to IInputFile format
 */
export function createInputFiles(extractedFiles: string[]): IInputFile[] {
  return extractedFiles.map(filepath => ({
    filepath,
    filename: filepath.split('/').pop() || filepath,
    uploadedAt: new Date()
  }));
}

/**
 * Convert streaming chunk to IAgentStep format
 * Returns null for chunk types we don't want to store
 */
export function convertChunkToStep(chunk: any, phase: string, stepNumber: number): IAgentStep | null {
  // Skip chunk types we don't want to store in database
  const skipTypes = [
    'start', 'start-step', 'finish-step',
    'message-start', 'message-end', 
    'text-start', 'text-end', 
    'tool-input-start', 'tool-input-delta',
    'reasoning-start', 'reasoning-end', 
    'error', 'file', 'data'
  ];
  
  if (skipTypes.includes(chunk.type)) {
    return null;
  }

  const agentStep: IAgentStep = {
    step: stepNumber,
    phase: phase as any,
    type: 'text', // default type
    timestamp: new Date()
  };

  // Handle different chunk types from AI SDK
  switch (chunk.type) {
    case 'tool-input-available':
      agentStep.type = 'tool_call';
      agentStep.toolCall = {
        step: stepNumber,
        toolName: chunk.toolName || 'unknown',
        toolArgs: chunk.input,
        timestamp: new Date()
      };
      break;

    case 'tool-output-available':
      // Tool output chunks should have toolName added by the flow
      if (!chunk.toolName) {
        // Skip if toolName wasn't mapped (shouldn't happen if flow is working correctly)
        return null;
      }
      agentStep.type = 'tool_result';
      agentStep.toolResult = {
        step: stepNumber,
        toolName: chunk.toolName,
        toolResult: chunk.output,
        timestamp: new Date()
      };
      break;

    case 'text-delta':
      agentStep.type = 'text';
      agentStep.textChunk = {
        step: stepNumber,
        text: chunk.textDelta || chunk.delta || '',
        timestamp: new Date(),
        isStreaming: true
      };
      break;

    case 'finish':
      agentStep.type = 'finish';
      agentStep.finishReason = chunk.finishReason;
      break;

    default:
      // Handle any other types as text if they have text content
      if (chunk.text) {
        agentStep.type = 'text';
        agentStep.textChunk = {
          step: stepNumber,
          text: chunk.text,
          timestamp: new Date(),
          isStreaming: true
        };
      } else {
        // Skip unknown types without text
        return null;
      }
      break;
  }

  return agentStep;
}

/**
 * Add user message to conversation
 */
export async function addUserMessage(
  chatId: string,
  query: string,
  inputFiles: string[],
  userContext: UserContext
): Promise<void> {
  const messageId = randomUUID();
  
  let conversation = await ChatConversation.findOne({ chatId });
  
  if (!conversation) {
    // Create new conversation
    conversation = new ChatConversation({
      chatId,
      userId: userContext.userId,
      subjectId: userContext.subjectId,
      classroomId: userContext.classroomId,
      messages: [],
      conversationMetadata: {
        totalMessages: 0,
        totalUserQueries: 0,
        totalAgentResponses: 0,
        totalFilesProcessed: 0,
        conversationStartTime: new Date(),
        lastActivityTime: new Date()
      },
      status: 'active',
      isPublic: false,
      settings: {
        allowFileUploads: true,
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['.pdf', '.txt', '.md', '.doc', '.docx'],
        defaultResearchMode: 'moderate'
      }
    });
  }

  // Add user message
  conversation.messages.push({
    messageId,
    messageType: 'user',
    userMessage: {
      query,
      inputFiles: createInputFiles(inputFiles),
      timestamp: new Date()
    },
    timestamp: new Date()
  });

  // Update metadata
  conversation.conversationMetadata.totalMessages += 1;
  conversation.conversationMetadata.totalUserQueries += 1;
  conversation.conversationMetadata.totalFilesProcessed += inputFiles.length;
  conversation.conversationMetadata.lastActivityTime = new Date();

  await conversation.save();
}

/**
 * Initialize agent message (creates placeholder)
 */
export async function initializeAgentMessage(
  chatId: string,
  flowType: 'doubt_clearance' | 'worksheet_generation',
  inputFiles: string[]
): Promise<string> {
  const messageId = randomUUID();
  
  const conversation = await ChatConversation.findOne({ chatId });
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Add agent message placeholder
  conversation.messages.push({
    messageId,
    messageType: 'agent',
    agentMessage: {
      flowType,
      startTime: new Date(),
      totalSteps: 0,
      steps: [],
      research_findings: {
        content: '',
        researched_websites: []
      },
      worksheet_content: '',
      executionSummary: {
        success: false,
        totalToolCalls: 0,
        totalTextLength: 0,
        duration: 0,
        errorCount: 0,
        finalStatus: 'in_progress'
      },
      fileProcessing: {
        extractedFiles: inputFiles,
        fileRetrievals: 0,
        hasFiles: inputFiles.length > 0
      }
    },
    timestamp: new Date()
  });

  await conversation.save();
  return messageId;
}

/**
 * Add step to agent message
 */
export async function addStepToAgentMessage(
  chatId: string,
  messageId: string,
  step: IAgentStep
): Promise<void> {
  const conversation = await ChatConversation.findOne({ chatId });
  if (!conversation) return;

  const message = conversation.messages.find(m => m.messageId === messageId);
  if (!message || !message.agentMessage) return;

  message.agentMessage.steps.push(step);
  message.agentMessage.totalSteps += 1;

  await conversation.save();
}

/**
 * Finalize agent message with complete data
 */
export async function finalizeAgentMessage(
  chatId: string,
  messageId: string,
  researchFindings: string,
  researchedWebsites: string[],
  worksheetContent: string,
  executionSummary: {
    success: boolean;
    totalToolCalls: number;
    totalTextLength: number;
    duration: number;
    errorCount: number;
    finalStatus: string;
  }
): Promise<void> {
  const conversation = await ChatConversation.findOne({ chatId });
  if (!conversation) return;

  const message = conversation.messages.find(m => m.messageId === messageId);
  if (!message || !message.agentMessage) return;

  message.agentMessage.endTime = new Date();
  message.agentMessage.research_findings = {
    content: researchFindings,
    researched_websites: researchedWebsites
  };
  message.agentMessage.worksheet_content = worksheetContent;
  message.agentMessage.executionSummary = executionSummary;

  // Update conversation metadata
  conversation.conversationMetadata.totalMessages += 1;
  conversation.conversationMetadata.totalAgentResponses += 1;
  conversation.conversationMetadata.lastActivityTime = new Date();

  await conversation.save();
}

/**
 * Get conversation by chatId
 */
export async function getConversation(chatId: string): Promise<IChatConversationDocument | null> {
  return await ChatConversation.findOne({ chatId, status: { $ne: 'deleted' } });
}

/**
 * Get chats by subject
 */
export async function getChatsBySubject(
  userId: string,
  subjectId: string,
  page: number = 1,
  limit: number = 20
): Promise<IChatConversationDocument[]> {
  const skip = (page - 1) * limit;
  
  return await ChatConversation.find({
    userId,
    subjectId,
    status: { $ne: 'deleted' }
  })
  .sort({ 'conversationMetadata.lastActivityTime': -1 })
  .skip(skip)
  .limit(limit)
  .exec();
}

/**
 * Count chats by subject
 */
export async function countChatsBySubject(userId: string, subjectId: string): Promise<number> {
  return await ChatConversation.countDocuments({
    userId,
    subjectId,
    status: { $ne: 'deleted' }
  });
}

/**
 * Delete conversation (soft delete)
 */
export async function deleteConversation(chatId: string): Promise<void> {
  await ChatConversation.updateOne(
    { chatId },
    { $set: { status: 'deleted' } }
  );
}

/**
 * Permanently delete conversation
 */
export async function permanentlyDeleteConversation(chatId: string): Promise<void> {
  await ChatConversation.deleteOne({ chatId });
}
