import { Router } from "express";
import { streamChat, getChatMessages, getChatsBySubject, deleteChatById } from "../controller/chatController";
import { authMiddleware } from "../middlewares/authMiddleWare";

const chatRouter = Router();

// Apply auth middleware to all routes
chatRouter.use(authMiddleware);

// POST - Stream chat with AI
chatRouter.post("/sse", streamChat);

// GET - Retrieve all messages for a specific chat
chatRouter.get("/:chat_id/messages", getChatMessages);

// GET - Retrieve all chats for a specific subject
chatRouter.get("/subject/:subject_id", getChatsBySubject);

// DELETE - Delete a chat conversation
chatRouter.delete("/:chat_id", deleteChatById);

export default chatRouter;