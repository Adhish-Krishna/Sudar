// Global reference to refresh function
let refreshTokenFunction: (() => Promise<boolean>) | null = null;

// Set the refresh token function (called from AuthContext)
export const setRefreshTokenFunction = (refreshFn: () => Promise<boolean>) => {
  refreshTokenFunction = refreshFn;
};

// Enhanced fetch wrapper with automatic 401 handling
export const apiWithRetry = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  const makeRequest = async (retryAttempt = false): Promise<Response> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // If we get a 401 and haven't already retried, try to refresh token
    if (response.status === 401 && !retryAttempt && refreshTokenFunction) {
      const refreshSuccess = await refreshTokenFunction();
      
      if (refreshSuccess) {
        // Retry the original request
        return makeRequest(true);
      }
    }

    return response;
  };

  return makeRequest();
};

// Update the existing API methods to use the retry wrapper
export const createApiWithRetry = (getAccessToken: () => string | null) => {
  const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
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

    return apiWithRetry(endpoint, config);
  };

  return {
    apiFetch,
    
    // Protected API endpoints with automatic retry
    protectedAPI: {
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
    },
  };
};