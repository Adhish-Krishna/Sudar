import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, setTokenGetter, createEnhancedProtectedAPI } from '../api';
import type { User, SignUpData } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignUpData) => Promise<void>;
  logout: () => void;
  setAccessToken: (token: string) => void;
  getAccessToken: () => string | null;
  enhancedAPI: ReturnType<typeof createEnhancedProtectedAPI> | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [enhancedAPI, setEnhancedAPI] = useState<ReturnType<typeof createEnhancedProtectedAPI> | null>(null);

  const isAuthenticated = !!user && !!accessToken;

  const setAccessToken = (token: string) => {
    setAccessTokenState(token);
  };

  const getAccessToken = () => {
    return accessToken;
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const data = await authAPI.refreshToken();
      setAccessTokenState(data.accessToken);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      setAccessTokenState(null);
      setUser(null);
      return false;
    }
  };

  // Set up the token getter and enhanced API
  useEffect(() => {
    setTokenGetter(() => accessToken);
    const api = createEnhancedProtectedAPI(refreshToken);
    setEnhancedAPI(api);
  }, [accessToken]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const data = await authAPI.login(email, password);
      
      // Set access token and user data
      setAccessTokenState(data.accessToken);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (userData: SignUpData): Promise<void> => {
    try {
      const data = await authAPI.signup(userData);
      
      // Set access token and user data
      setAccessTokenState(data.accessToken);
      setUser(data.user);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear refresh token cookie
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      setAccessTokenState(null);
      setUser(null);
    }
  };

  // Check for existing authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Try to refresh token to get initial auth state
      await refreshToken();
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
    setAccessToken,
    getAccessToken,
    enhancedAPI,
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