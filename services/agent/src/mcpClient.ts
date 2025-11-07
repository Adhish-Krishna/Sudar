import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import dotenv from 'dotenv';

dotenv.config();

export interface UserContext {
  userId: string;
  chatId: string;
  subjectId: string;
  classroomId: string;
}

export async function createMCPClientWithContext(userContext: UserContext) {
  return await createMCPClient({
    transport: {
      type: 'http',
      url: process.env.MCP_SERVER_URL || 'http://sudar-tools-mcp-server:3002/mcp',
      headers: {
        'X-User-Id': userContext.userId,
        'X-Chat-Id': userContext.chatId,
        'X-Subject-Id': userContext.subjectId,
        'X-Classroom-Id': userContext.classroomId
      }
    },
  });
}

export default createMCPClientWithContext;

