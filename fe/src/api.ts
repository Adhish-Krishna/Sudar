// API client with fetch and JWT token handling

// Types
export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  schoolName: string;
  subject: string;
  experience: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  subject: string;
  experience: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Store reference to get access token
let getAccessToken: () => string | null = () => null;

// Function to set the token getter (called from AuthContext)
export const setTokenGetter = (getter: () => string | null) => {
  getAccessToken = getter;
};

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Enhanced fetch wrapper with automatic token handling
const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAccessToken();
  
  const config: RequestInit = {
    credentials: 'include', // Important for HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  return fetch(`${API_BASE_URL}${endpoint}`, config);
};

// API endpoints
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },
  
  signup: async (userData: SignUpData): Promise<AuthResponse> => {
    const response = await apiFetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Signup failed');
    }
    
    return response.json();
  },
  
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiFetch('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset email');
    }
    
    return response.json();
  },
  
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiFetch('/api/refresh-token', {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token refresh failed');
    }
    
    return response.json();
  },
  
  logout: async (): Promise<void> => {
    await apiFetch('/api/logout', {
      method: 'POST',
    });
  },
  
  getProfile: async (): Promise<User> => {
    const response = await apiFetch('/api/profile');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get profile');
    }
    
    return response.json();
  },
};

// Protected API endpoints
export const protectedAPI = {
  getClasses: async () => {
    const response = await apiFetch('/api/classes');
    
    if (!response.ok) {
      throw new Error('Failed to get classes');
    }
    
    return response.json();
  },
  
  getSubjects: async () => {
    const response = await apiFetch('/api/subjects');
    
    if (!response.ok) {
      throw new Error('Failed to get subjects');
    }
    
    return response.json();
  },
  
  createContent: async (data: Record<string, unknown>) => {
    const response = await apiFetch('/api/content', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create content');
    }
    
    return response.json();
  },
  
  generateWorksheet: async (data: Record<string, unknown>) => {
    const response = await apiFetch('/api/worksheet', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate worksheet');
    }
    
    return response.json();
  },
};

// Create enhanced API with automatic token refresh
export const createEnhancedProtectedAPI = (refreshTokenFn: () => Promise<boolean>) => {
  const enhancedApiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const makeRequest = async (retryAttempt = false): Promise<Response> => {
      const token = getAccessToken();
      
      const config: RequestInit = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      // If we get a 401 and haven't already retried, try to refresh token
      if (response.status === 401 && !retryAttempt) {
        const refreshSuccess = await refreshTokenFn();
        
        if (refreshSuccess) {
          // Retry the original request
          return makeRequest(true);
        }
      }

      return response;
    };

    return makeRequest();
  };

  return {
    getClasses: async () => {
      const response = await enhancedApiFetch('/api/classes');
      if (!response.ok) {
        throw new Error('Failed to get classes');
      }
      return response.json();
    },
    
    getSubjects: async () => {
      const response = await enhancedApiFetch('/api/subjects');
      if (!response.ok) {
        throw new Error('Failed to get subjects');
      }
      return response.json();
    },
    
    createContent: async (data: Record<string, unknown>) => {
      const response = await enhancedApiFetch('/api/content', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to create content');
      }
      return response.json();
    },
    
    generateWorksheet: async (data: Record<string, unknown>) => {
      const response = await enhancedApiFetch('/api/worksheet', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to generate worksheet');
      }
      return response.json();
    },
  };
};