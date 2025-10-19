import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api';
import type { Login, SignUp, EmailVerification, ForgotPassword, ResetPassword, Teacher } from '../api';

interface AuthContextType {
  user: Teacher | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (loginData: Login) => Promise<void>;
  verifyEmail: (verifyData: EmailVerification) => Promise<void>;
  signup: (signupData: SignUp) => Promise<void>;
  forgotPassword: (forgotData: ForgotPassword) => Promise<void>;
  resetPassword: (resetData: ResetPassword) => Promise<void>;
  logout: () => Promise<void>;
  getStatus: () => Promise<Teacher | null>;
  setUser: (user: Teacher | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true); // Start with true to prevent premature redirects

  const isAuthenticated = !!user;

  const login = async (loginData: Login): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.login(loginData);
      if (result.status && result.status !== 200) {
        throw new Error(result.message || 'Login failed');
      }
      // Set user from response
      if (result.teacher_id) {
        const userData: Teacher = {
          teacher_id: result.teacher_id,
          teacher_name: result.teacher_name,
          email: result.email,
        };
        setUser(userData);
      } else {
        throw new Error('No user data in login response');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (verifyData: EmailVerification): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.verifyEmail(verifyData);
      if (result.status && result.status !== 200) {
        throw new Error(result.message || 'Email verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (signupData: SignUp): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.signUp(signupData);
      if (result.status && result.status !== 201) {
        throw new Error(result.message || 'Signup failed');
      }
      // Assuming the API returns user data in the response
      if (result.teacher_id) {
        setUser({
          teacher_id: result.teacher_id,
          teacher_name: result.teacher_name,
          email: result.email,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (forgotData: ForgotPassword): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.forgotPassword(forgotData);
      if (result.status && result.status !== 200) {
        throw new Error(result.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetData: ResetPassword): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.resetPassword(resetData);
      if (result.status && result.status !== 200) {
        throw new Error(result.message || 'Password reset failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await authAPI.logout();
      if (result.status && result.status !== 200) {
        throw new Error(result.message || 'Logout failed');
      }
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const getStatus = async (): Promise<Teacher | null> => {
    setLoading(true);
    try {
      const result = await authAPI.getStatus();
      if (result.status && result.status !== 200) {
        return null;
      }
      setUser(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const result = await authAPI.getStatus();
        
        if (!isMounted) return;

        // Check if result has a status property (error response)
        if (result?.status && result.status !== 200) {
          // Authentication failed, user is not logged in
          setUser(null);
        } else if (result && result.teacher_id) {
          // Successfully got user data (has teacher_id means it's a valid user object)
          setUser(result);
        } else {
          // Unexpected response format
          setUser(null);
        }
      } catch (error) {
        // Network error or other unexpected issue
        if (isMounted) {
          console.error('Auth status check failed:', error);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuthStatus();

    // Cleanup function to prevent state updates on unmounted components
    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    verifyEmail,
    signup,
    forgotPassword,
    resetPassword,
    logout,
    getStatus,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the useAuth hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};