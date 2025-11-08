/**
 * Chat Utilities
 * 
 * Helper functions for working with the chat schema.
 * Includes utilities for converting flow steps to database format,
 * creating messages, and managing conversations.
 */

import { randomUUID } from 'crypto';
import { 
  ChatConversation, 
  IChatConversationDocument,
  IAgentMessage,
  IAgentStep,
  UserMessageInput,
  type IInputFile
} from '../models/chatSchema';

// Import flow step types
import type { DoubtClearanceStep } from '../flows/doubtClearanceFlow';
import type { WorksheetFlowStep } from '../flows/worksheetFlow';

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
 * Convert DoubtClearanceStep to IAgentStep
 */
export function convertDoubtClearanceStep(step: DoubtClearanceStep): IAgentStep {
  const agentStep: IAgentStep = {
    step: step.step,
    phase: 'chat',
    type: step.type,
    timestamp: new Date()
  };

  // Handle different step types
  switch (step.type) {
    case 'tool_call':
      agentStep.toolCall = {
        step: step.step,
        toolName: step.toolName!,
        toolArgs: step.toolArgs,
        timestamp: new Date()
      };
      break;

    case 'tool_result':
      agentStep.toolResult = {
        step: step.step,
        toolName: step.toolName!,
        toolResult: step.toolResult,
        timestamp: new Date()
      };
      break;

    case 'text':
      agentStep.textChunk = {
        step: step.step,
        text: step.text!,
        timestamp: new Date(),
        isStreaming: true
      };
      break;

    case 'status':
      agentStep.statusMessage = {
        step: step.step,
        status: step.status!,
        timestamp: new Date()
      };
      break;

    case 'metadata':
      agentStep.doubtClearanceMetadata = {
        searchQueries: step.metadata?.searchQueries || [],
        totalSearches: step.metadata?.totalSearches || 0,
        responseLength: step.metadata?.responseLength || 0,
        completed: step.metadata?.completed || false,
        extractedFiles: step.metadata?.extractedFiles || [],
        fileRetrievals: step.metadata?.fileRetrievals || 0
      };
      break;

    case 'finish':
      agentStep.finishReason = step.finishReason;
      if (step.text) {
        agentStep.errorMessage = step.text;
      }
      break;
  }

  return agentStep;
}

/**
 * Convert WorksheetFlowStep to IAgentStep
 */
export function convertWorksheetFlowStep(step: WorksheetFlowStep): IAgentStep {
  const agentStep: IAgentStep = {
    step: step.step,
    phase: step.phase,
    type: step.type,
    timestamp: new Date()
  };

  // Handle different step types
  switch (step.type) {
    case 'tool_call':
      agentStep.toolCall = {
        step: step.step,
        toolName: step.toolName!,
        toolArgs: step.toolArgs,
        timestamp: new Date()
      };
      break;

    case 'tool_result':
      agentStep.toolResult = {
        step: step.step,
        toolName: step.toolName!,
        toolResult: step.toolResult,
        timestamp: new Date()
      };
      break;

    case 'text':
      agentStep.textChunk = {
        step: step.step,
        text: step.text!,
        timestamp: new Date(),
        isStreaming: true
      };
      break;

    case 'status':
      agentStep.statusMessage = {
        step: step.step,
        status: step.status!,
        timestamp: new Date()
      };
      break;

    case 'phase_change':
      agentStep.phaseChange = {
        step: step.step,
        previousPhase: step.phaseInfo?.previousPhase,
        currentPhase: step.phaseInfo!.currentPhase,
        message: step.phaseInfo!.message,
        timestamp: new Date()
      };
      break;

    case 'metadata':
      if (step.phase === 'flow' && step.metadata?.flowSummary) {
        // Final worksheet flow metadata
        agentStep.worksheetFlowMetadata = {
          flowSummary: step.metadata.flowSummary,
          researchPhase: step.metadata.researchPhase,
          generationPhase: step.metadata.generationPhase
        };
      } else if (step.phase === 'research' && step.metadata) {
        // Research phase metadata
        agentStep.researchMetadata = {
          websitesResearched: step.metadata.websitesResearched || [],
          searchQueries: step.metadata.searchQueries || [],
          totalToolCalls: step.metadata.totalToolCalls || 0,
          researchMode: step.metadata.researchMode || 'moderate',
          findingsLength: 0,
          completed: false
        };
      } else if (step.phase === 'generation' && step.metadata) {
        // Generation phase metadata
        agentStep.generationMetadata = {
          worksheetTitle: step.metadata.worksheetTitle || '',
          contentLength: step.metadata.contentLength || 0,
          savedSuccessfully: step.metadata.savedSuccessfully || false,
          pdfLocation: step.metadata.pdfLocation || '',
          totalToolCalls: step.metadata.totalToolCalls || 0,
          completed: step.metadata.completed || false
        };
      }
      break;

    case 'finish':
      agentStep.finishReason = step.finishReason;
      if (step.status) {
        agentStep.errorMessage = step.status;
      }
      break;
  }

  return agentStep;
}

/**
 * Create a new chat conversation
 */
export async function createChatConversation(
  userId: string,
  subjectId: string,
  classroomId: string,
  title?: string
): Promise<any> {
  const chatId = randomUUID();
  
  const conversation = new ChatConversation({
    chatId,
    userId,
    subjectId,
    classroomId,
    title: title || `Chat ${new Date().toLocaleDateString()}`,
    messages: [],
    conversationMetadata: {
      totalMessages: 0,
      totalUserQueries: 0,
      totalAgentResponses: 0,
      totalFilesProcessed: 0,
      conversationStartTime: new Date(),
      lastActivityTime: new Date()
    },
    status: 'active'
  });

  return await conversation.save();
}

/**
 * Ensure conversation exists and add a user message
 */
export async function addUserMessage(
  chatId: string,
  userMessage: UserMessageInput,
  userContext?: { userId: string; classroomId: string; subjectId: string }
): Promise<any> {
  const messageId = randomUUID();
  
  // First, try to find the conversation
  let conversation = await ChatConversation.findOne({ chatId });
  
  // If conversation doesn't exist and we have user context, create it
  if (!conversation && userContext) {
    conversation = new ChatConversation({
      chatId,
      userId: userContext.userId,
      subjectId: userContext.subjectId,
      classroomId: userContext.classroomId,
      title: `Chat ${new Date().toLocaleDateString()}`,
      messages: [],
      conversationMetadata: {
        totalMessages: 0,
        totalUserQueries: 0,
        totalAgentResponses: 0,
        totalFilesProcessed: 0,
        conversationStartTime: new Date(),
        lastActivityTime: new Date()
      },
      status: 'active'
    });
    await conversation.save();
  }
  
  const update = {
    $push: {
      messages: {
        messageId,
        messageType: 'user',
        userMessage: {
          ...userMessage,
          timestamp: new Date()
        },
        timestamp: new Date()
      }
    },
    $inc: {
      'conversationMetadata.totalMessages': 1,
      'conversationMetadata.totalUserQueries': 1,
      'conversationMetadata.totalFilesProcessed': userMessage.inputFiles?.length || 0
    },
    $set: {
      'conversationMetadata.lastActivityTime': new Date()
    }
  };

  return await ChatConversation.findOneAndUpdate(
    { chatId },
    update,
    { new: true }
  );
}

/**
 * Initialize an agent message (for streaming responses)
 */
export async function initializeAgentMessage(
  chatId: string,
  flowType: 'doubt_clearance' | 'worksheet_generation' | 'content_research' | 'generic_chat',
  extractedFiles: string[] = []
): Promise<string> {
  const messageId = randomUUID();
  
  const agentMessage: IAgentMessage = {
    flowType,
    startTime: new Date(),
    totalSteps: 0,
    steps: [],
    fullResponse: '',
    executionSummary: {
      success: false,
      totalToolCalls: 0,
      totalTextLength: 0,
      duration: 0,
      errorCount: 0,
      finalStatus: 'initializing'
    },
    fileProcessing: {
      extractedFiles,
      fileRetrievals: 0,
      hasFiles: extractedFiles.length > 0
    }
  };

  const update = {
    $push: {
      messages: {
        messageId,
        messageType: 'agent',
        agentMessage,
        timestamp: new Date()
      }
    },
    $inc: {
      'conversationMetadata.totalMessages': 1,
      'conversationMetadata.totalAgentResponses': 1
    },
    $set: {
      'conversationMetadata.lastActivityTime': new Date()
    }
  };

  await ChatConversation.findOneAndUpdate({ chatId }, update);
  return messageId;
}

/**
 * Update agent message with a new step
 */
export async function updateAgentMessageStep(
  chatId: string,
  messageId: string,
  step: IAgentStep
): Promise<any> {
  const updateOperations: any = {
    $push: {
      'messages.$[msg].agentMessage.steps': step
    },
    $inc: {
      'messages.$[msg].agentMessage.totalSteps': 1
    },
    $set: {
      'conversationMetadata.lastActivityTime': new Date()
    }
  };

  return await ChatConversation.findOneAndUpdate(
    { chatId },
    updateOperations,
    {
      new: true,
      arrayFilters: [{ 'msg.messageId': messageId }]
    }
    ) as IChatConversationDocument | null;
}

/**
 * Append text to agent message response
 */
export async function appendTextToAgentMessage(
  chatId: string,
  messageId: string,
  text: string
): Promise<any> {
  return await ChatConversation.findOneAndUpdate(
    { chatId },
    {
      $set: {
        'messages.$[msg].agentMessage.fullResponse': text,
        'conversationMetadata.lastActivityTime': new Date()
      }
    },
    {
      new: true,
      arrayFilters: [{ 'msg.messageId': messageId }]
    }
    ) as IChatConversationDocument | null;
}

/**
 * Finalize agent message with execution summary
 */
export async function finalizeAgentMessage(
  chatId: string,
  messageId: string,
  executionSummary: IAgentMessage['executionSummary'],
  finalMetadata?: IAgentMessage['finalMetadata']
): Promise<any> {
  const update: any = {
    $set: {
      'messages.$[msg].agentMessage.endTime': new Date(),
      'messages.$[msg].agentMessage.executionSummary': executionSummary,
      'conversationMetadata.lastActivityTime': new Date()
    }
  };

  if (finalMetadata) {
    update.$set['messages.$[msg].agentMessage.finalMetadata'] = finalMetadata;
  }

  return await ChatConversation.findOneAndUpdate(
    { chatId },
    update,
    {
      new: true,
      arrayFilters: [{ 'msg.messageId': messageId }]
    }
  );
}

/**
 * Get conversation by chatId
 */
export async function getConversation(chatId: string): Promise<any> {
  return await ChatConversation.findOne({ chatId });
}

/**
 * Get user conversations with pagination
 */
export async function getUserConversations(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<any[]> {
  const skip = (page - 1) * limit;
  
  return await ChatConversation.find({ userId, status: 'active' })
    .sort({ 'conversationMetadata.lastActivityTime': -1 })
    .skip(skip)
    .limit(limit);
}

/**
 * Get conversations by subject with pagination (direct Mongoose query)
 */
export async function getChatsBySubject(
  userId: string,
  subjectId: string,
  page: number = 1,
  limit: number = 20
): Promise<any[]> {
  const skip = (page - 1) * limit;
  
  return await ChatConversation.find({ 
    userId, 
    subjectId,
    status: 'active' 
  })
    .sort({ 'conversationMetadata.lastActivityTime': -1 })
    .skip(skip)
    .limit(limit);
}

/**
 * Count conversations by subject
 */
export async function countChatsBySubject(
  userId: string,
  subjectId: string
): Promise<number> {
  return await ChatConversation.countDocuments({ 
    userId, 
    subjectId,
    status: 'active' 
  });
}

/**
 * Archive a conversation
 */
export async function archiveConversation(chatId: string): Promise<any> {
  return await ChatConversation.findOneAndUpdate(
    { chatId },
    { 
      $set: { 
        status: 'archived',
        'conversationMetadata.lastActivityTime': new Date()
      } 
    },
    { new: true }
  );
}

/**
 * Permanently delete a conversation (hard delete)
 */
export async function deleteConversation(chatId: string): Promise<any> {
  return await ChatConversation.deleteOne({ chatId });
}

export {
  ChatConversation
};