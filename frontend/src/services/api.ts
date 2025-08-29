import axios from 'axios';

// Get API base URL from environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (development only)
api.interceptors.request.use(
  (config) => {
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
  status: () => api.get('/auth/status'),
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
    api.patch(`/api/plants/${plantId}/tasks/${taskId}/complete`, {}),
};

export const aiAPI = {
  identify: (data: FormData) => api.post('/api/ai/identify', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api;
