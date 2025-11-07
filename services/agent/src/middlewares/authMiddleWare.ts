import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

// Extend Request interface to include user_id
declare global {
  namespace Express {
    interface Request {
      user_id?: string;
    }
  }
}

interface VerifyTokenResponse {
  valid: boolean;
  teacher_id: string;
  exp: number;
  iat: number;
  type: string;
  message: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get access token from cookies
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      res.status(401).json({
        error: 'Access token not found in cookies'
      });
      return;
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    // Verify token with backend
    const verifyResponse = await axios.post<VerifyTokenResponse>(`${backendUrl}/api/auth/verify-token`, {
      access_token: accessToken
    });

    const verifyData = verifyResponse.data;

    if (!verifyData.valid) {
      res.status(401).json({
        error: 'Invalid token'
      });
      return;
    }

    // Attach user_id to request
    req.user_id = verifyData.teacher_id;

    // Continue to next middleware/route handler
    next();

  } catch (error: any) {
    console.error('Auth middleware error:', error);

    if (error.isAxiosError || error.response) {
      // Handle axios-specific errors
      const status = error.response?.status || 500;
      const message = error.response?.data?.detail || 'Token verification failed';

      res.status(status).json({
        error: message
      });
      return;
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};