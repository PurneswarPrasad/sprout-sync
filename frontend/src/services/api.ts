import axios from 'axios';

// Get API base URL from environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Changed to false since we're using JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token and logging
api.interceptors.request.use(
  (config) => {
    // Add JWT token to requests if available
    const token = localStorage.getItem('auth-storage') 
      ? JSON.parse(localStorage.getItem('auth-storage')!).state.token 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.status, error.response?.data);
    }
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const authAPI = {
  status: () => api.get('/auth/status/public'),
  profile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  googleAuth: () => window.location.href = `${API_BASE_URL}/auth/google`,
};

export const plantsAPI = {
  getAll: () => api.get('/api/plants'),
  getById: (id: string) => api.get(`/api/plants/${id}`),
  create: (data: any) => api.post('/api/plants', data),
  update: (id: string, data: any) => api.put(`/api/plants/${id}`, data),
  delete: (id: string) => api.delete(`/api/plants/${id}`),
  getTaskTemplates: () => api.get('/api/plants/task-templates'),
  completeTask: (plantId: string, taskId: string) => 
    api.post(`/api/plants/${plantId}/tasks/${taskId}/complete`, {}),
};

export const aiAPI = {
  // For camera captures (base64 data)
  identifyFromBase64: async (base64Data: string) => {
    // Convert base64 data URL to blob
    const base64Response = fetch(base64Data);
    const res = await base64Response;
    return await res.blob();
  },
  
  // For file uploads (camera capture converted to file)
  identifyFile: (data: FormData) => api.post('/api/ai/identify/file', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // For URL-based identification
  identifyByUrl: (imageUrl: string) => api.post('/api/ai/identify/url', { imageUrl }),
};

export default api;
