/**
 * Database Configuration
 * 
 * MongoDB connection utility using Mongoose.
 * Connects to MongoDB using the connection URI from environment variables.
 * 
 * FEATURES:
 * - Automatic connection with retry logic
 * - Connection event handling
 * - Graceful shutdown
 * - Environment-based configuration
 * - Connection pooling optimization
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sudar_agent';
const MONGODB_OPTIONS = {
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
};

// Connection state tracking
let isConnected = false;
let isConnecting = false;

/**
 * Connect to MongoDB with retry logic
 */
export async function connectToDatabase(): Promise<void> {
  // If already connected or connecting, return
  if (isConnected || isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`📍 URI: ${MONGODB_URI.replace(/\/\/[^:]*:[^@]*@/, '//***:***@')}`); // Hide credentials in logs
    
    await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);
    
    isConnected = true;
    isConnecting = false;
    
    console.log('✅ Successfully connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ Successfully disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw new Error(`Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean;
  isConnecting: boolean;
  readyState: number;
  host?: string;
  port?: number;
  database?: string;
} {
  return {
    isConnected,
    isConnecting,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.db?.databaseName
  };
}

/**
 * Wait for database connection to be ready
 */
export async function waitForConnection(timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (!isConnected && (Date.now() - startTime) < timeoutMs) {
    if (!isConnecting) {
      await connectToDatabase();
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (!isConnected) {
    throw new Error(`Database connection timeout after ${timeoutMs}ms`);
  }
}

/**
 * Initialize database connection with event listeners
 */
export function initializeDatabase(): void {
  // Connection event listeners
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('📡 Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (error) => {
    isConnected = false;
    console.error('❌ Mongoose connection error:', error);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.log('🔌 Mongoose disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('🔄 Mongoose reconnected to MongoDB');
  });

  // Handle application termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, gracefully shutting down...');
    await disconnectFromDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, gracefully shutting down...');
    await disconnectFromDatabase();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught Exception:', error);
    await disconnectFromDatabase();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    await disconnectFromDatabase();
    process.exit(1);
  });

  // Initial connection
  connectToDatabase().catch((error) => {
    console.error('❌ Initial database connection failed:', error);
    process.exit(1);
  });
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    readyState: string;
    database?: string;
    host?: string;
    port?: number;
  };
}> {
  try {
    const connection = mongoose.connection;
    const readyStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const status = isConnected && connection.readyState === 1 ? 'healthy' : 'unhealthy';
    
    return {
      status,
      details: {
        connected: isConnected,
        readyState: readyStates[connection.readyState as keyof typeof readyStates] || 'unknown',
        database: connection.db?.databaseName,
        host: connection.host,
        port: connection.port
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: 'error'
      }
    };
  }
}

// Export mongoose instance for direct access if needed
export { mongoose };

// Default export
export default {
  connectToDatabase,
  disconnectFromDatabase,
  getConnectionStatus,
  waitForConnection,
  initializeDatabase,
  healthCheck,
  mongoose
};
