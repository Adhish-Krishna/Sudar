import express from "express";
import type {Request, Response} from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initializeDatabase, healthCheck, waitForConnection } from './config/db';
import chatRouter from "./routes/chatRoutes";
import { authMiddleware } from "./middlewares/authMiddleWare";

dotenv.config();

const PORT = process.env.PORT? parseInt(process.env.PORT) : 3003;

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
};

const app = express();

app.use(cors(corsOptions));

app.use(express.json());

app.use("/api/chat", authMiddleware, chatRouter);

app.get("/health", async (_req: Request, res: Response)=>{
    try {
        const dbHealth = await healthCheck();
        return res.status(200).json({
            message: "Agent service is healthy",
            database: dbHealth
        });
    } catch (error) {
        return res.status(500).json({
            message: "Agent service is unhealthy",
            database: {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown database error'
            }
        });
    }
});

// Initialize database connection and start server
const startServer = async () => {
  console.log('🚀 Initializing database connection...');
  
  try {
    // Initialize database with event listeners
    initializeDatabase();
    
    // Wait for initial connection
    await waitForConnection();
    
    console.log('✅ Database connected successfully');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Agent service running at port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

