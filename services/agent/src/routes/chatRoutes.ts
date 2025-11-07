import { Router } from "express";
import { streamChat } from "../controller/chatController";

const chatRouter = Router();

chatRouter.post("/sse", streamChat);

export default chatRouter;