/**
 * Chat Schema
 * 
 * Comprehensive mongoose schema for storing chat conversations between users and agents.
 * Supports both simple doubt clearance and complex worksheet generation flows.
 * 
 * FEATURES:
 * - User messages with file inputs
 * - Agent messages with complete step-by-step execution details
 * - Support for multiple flow types (doubt clearance, worksheet generation, etc.)
 * - Metadata tracking for research phases, tool calls, and generation phases
 * - File extraction and processing tracking
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IInputFile {
  filepath: string;
  filename?: string;
  filesize?: number;
  mimetype?: string;
  uploadedAt?: Date;
}

export interface IUserMessage {
  query: string;
  inputFiles: IInputFile[];
  timestamp: Date;
}

export interface IAgentStep {
  step: number;
  phase?: 'research' | 'generation' | 'answer' | 'chat' | 'evaluation'| 'video' | 'completion';
  type: string; // Store the original chunk type from AI SDK
  timestamp: Date;
  
  // Store the raw chunk data as-is from the stream
  chunkData: any;
}

export interface IAgentMessage {
  flowType: 'doubt_clearance' | 'worksheet_generation' | 'content_research' | 'generic_chat' | 'content_generation';
  startTime: Date;
  endTime?: Date;
  totalSteps: number;
  
  // Execution details
  steps: IAgentStep[];
  research_findings: {
    content: string;
    researched_websites: string[];
  }
  worksheet_content: string;
  
  // Execution summary
  executionSummary: {
    success: boolean;
    totalToolCalls: number;
    totalTextLength: number;
    duration: number;
    errorCount: number;
    finalStatus: string;
  };
  
  // File processing
  fileProcessing?: {
    extractedFiles: string[];
    fileRetrievals: number;
    hasFiles: boolean;
  };
}

export interface IChatConversation {
  chatId: string;
  userId: string;
  subjectId: string;
  classroomId: string;
  
  // Conversation metadata
  title?: string;
  description?: string;
  tags?: string[];
  
  // Messages
  messages: Array<{
    messageId: string;
    messageType: 'user' | 'agent';
    userMessage?: IUserMessage;
    agentMessage?: IAgentMessage;
    timestamp: Date;
  }>;
  
  // Conversation-level metadata
  conversationMetadata: {
    totalMessages: number;
    totalUserQueries: number;
    totalAgentResponses: number;
    totalFilesProcessed: number;
    conversationStartTime: Date;
    lastActivityTime: Date;
    averageResponseTime?: number;
  };
  
  // Status and settings
  status: 'active' | 'archived' | 'deleted';
  isPublic: boolean;
  settings: {
    allowFileUploads: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    defaultResearchMode: 'simple' | 'moderate' | 'deep';
  };
}

// Input File Schema
const InputFileSchema = new Schema<IInputFile>({
  filepath: { type: String, required: true },
  filename: { type: String },
  filesize: { type: Number },
  mimetype: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

// User Message Schema
const UserMessageSchema = new Schema<IUserMessage>({
  query: { type: String, required: true },
  inputFiles: [InputFileSchema],
  timestamp: { type: Date, default: Date.now }
});

// Agent Step Schema
const AgentStepSchema = new Schema<IAgentStep>({
  step: { type: Number, required: true },
  // Align allowed phases with all flows (content generation, doubt clearance, worksheet)
  phase: { type: String, enum: [
    'research',
    'script',
    'code',
    'refinement',
    'evaluation',
    'video',
    'completion',
    'generation',
    'answer',
    'chat'
  ] },
  type: { 
    type: String,
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  
  // Store raw chunk data as-is from the stream
  chunkData: { type: Schema.Types.Mixed, required: true }
});

// Agent Message Schema
const AgentMessageSchema = new Schema<IAgentMessage>({
  flowType: { 
    type: String, 
    enum: ['doubt_clearance', 'worksheet_generation', 'content_research', 'generic_chat', 'content_generation'],
    required: true 
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  totalSteps: { type: Number, default: 0 },
  
  steps: [AgentStepSchema],
  research_findings: {
    content: {type: String},
    researched_websites: [{
      type: String,
    }]
  },
  worksheet_content: { type: String, default: '' },
  
  executionSummary: {
    success: { type: Boolean, default: false },
    totalToolCalls: { type: Number, default: 0 },
    totalTextLength: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    finalStatus: { type: String, default: 'pending' }
  },
  
  fileProcessing: {
    extractedFiles: [{ type: String }],
    fileRetrievals: { type: Number, default: 0 },
    hasFiles: { type: Boolean, default: false }
  }
});

// Message Schema (Union of User and Agent messages)
const MessageSchema = new Schema({
  messageId: { type: String, required: true, unique: true },
  messageType: { type: String, enum: ['user', 'agent'], required: true },
  userMessage: UserMessageSchema,
  agentMessage: AgentMessageSchema,
  timestamp: { type: Date, default: Date.now }
});

// Main Chat Conversation Schema
const ChatConversationSchema = new Schema<IChatConversationDocument>({
  chatId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  subjectId: { type: String, required: true },
  classroomId: {type: String, required: true},
  
  title: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  
  messages: [MessageSchema],
  
  conversationMetadata: {
    totalMessages: { type: Number, default: 0 },
    totalUserQueries: { type: Number, default: 0 },
    totalAgentResponses: { type: Number, default: 0 },
    totalFilesProcessed: { type: Number, default: 0 },
    conversationStartTime: { type: Date, default: Date.now },
    lastActivityTime: { type: Date, default: Date.now },
    averageResponseTime: { type: Number }
  },
  
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
  isPublic: { type: Boolean, default: false },
  
  settings: {
    allowFileUploads: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 50 * 1024 * 1024 }, // 50MB
    allowedFileTypes: [{ type: String }],
    defaultResearchMode: { type: String, enum: ['simple', 'moderate', 'deep'], default: 'moderate' }
  }
}, {
  timestamps: true,
  collection: 'chatConversations'
});

// Indexes for better query performance
ChatConversationSchema.index({ userId: 1 });
ChatConversationSchema.index({ classroomId: 1 });
ChatConversationSchema.index({ subjectId: 1 });
ChatConversationSchema.index({ 'conversationMetadata.lastActivityTime': -1 });
ChatConversationSchema.index({ status: 1 });

// Document interface
export interface IChatConversationDocument extends IChatConversation, Document {
  _id: Types.ObjectId;
}

// Create and export the model
export const ChatConversation = model<IChatConversationDocument>('ChatConversation', ChatConversationSchema);

// Helper types for easier usage
export type UserMessageInput = Omit<IUserMessage, 'timestamp'>;
export type AgentMessageInput = Omit<IAgentMessage, 'startTime' | 'totalSteps' | 'fullResponse' | 'executionSummary'>;

export default ChatConversation;
