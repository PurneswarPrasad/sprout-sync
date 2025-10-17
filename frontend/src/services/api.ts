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

export const usersAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateUsername: (username: string) => api.patch('/api/users/username', { username }),
};

export const plantsAPI = {
  getAll: () => api.get('/api/plants'),
  getGifted: () => api.get('/api/plants/gifted'),
  getById: (id: string) => api.get(`/api/plants/${id}`),
  create: (data: any) => api.post('/api/plants', data),
  update: (id: string, data: any) => api.put(`/api/plants/${id}`, data),
  delete: (id: string) => api.delete(`/api/plants/${id}`),
  updateSlug: (id: string, slug: string) => api.patch(`/api/plants/${id}/slug`, { slug }),
  getTaskTemplates: () => api.get('/api/plants/task-templates'),
  completeTask: (plantId: string, taskId: string) => 
    api.post(`/api/tasks/${taskId}/complete`, {}),
  // Plant tracking endpoints
  getTrackingUpdates: (plantId: string, page?: number, limit?: number) => 
    api.get(`/api/plants/${plantId}/tracking`, { params: { page, limit } }),
  createTrackingUpdate: (plantId: string, data: any) => 
    api.post(`/api/plants/${plantId}/tracking`, data),
  deleteTrackingUpdate: (plantId: string, trackingId: string) => 
    api.delete(`/api/plants/${plantId}/tracking/${trackingId}`),
  // Plant photo endpoints
  createPhoto: (plantId: string, data: any) => 
    api.post(`/api/plants/${plantId}/photos`, data),
  // Social features
  appreciate: (plantId: string) => api.post(`/api/plants/${plantId}/appreciate`),
  getAppreciations: (plantId: string) => api.get(`/api/plants/${plantId}/appreciations`),
  addComment: (plantId: string, comment: string) => 
    api.post(`/api/plants/${plantId}/comments`, { comment }),
  getComments: (plantId: string) => api.get(`/api/plants/${plantId}/comments`),
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
  
  // For plant health analysis by URL
  analyzeHealthByUrl: (imageUrl: string) => api.post('/api/ai/identify/issue/url', { imageUrl }),
};

export const googleCalendarAPI = {
  // Get authorization URL
  getAuthUrl: () => api.get('/api/google-calendar/auth-url'),
  
  // Handle authorization callback
  handleCallback: (code: string) => api.post('/api/google-calendar/callback', { code }),
  
  // Get sync status and settings
  getStatus: () => api.get('/api/google-calendar/status'),
  
  // Update sync settings
  updateSettings: (data: {
    enabled: boolean;
    reminderMinutes?: number;
    syncedPlantIds?: string[];
  }) => api.put('/api/google-calendar/settings', data),
  
  // Sync specific tasks
  syncTasks: (data: {
    taskIds: string[];
    reminderMinutes: number;
  }) => api.post('/api/google-calendar/sync-tasks', data),
  
  // Revoke access
  revokeAccess: () => api.delete('/api/google-calendar/revoke'),
};

export const plantGiftsAPI = {
  // Create a plant gift
  createGift: (data: { plantId: string; message?: string }) => 
    api.post('/api/plant-gifts', data),
  
  // Get gift details by token (for accepting)
  getGiftByToken: (token: string) => 
    api.get(`/api/plant-gifts/gift/${token}`),
  
  // Accept a plant gift
  acceptGift: (data: { giftToken: string }) => 
    api.post('/api/plant-gifts/accept', data),
  
  // Get gifts sent by the user
  getSentGifts: () => 
    api.get('/api/plant-gifts/sent'),
  
  // Get gifts received by the user
  getReceivedGifts: () => 
    api.get('/api/plant-gifts/received'),
  
  // Cancel a gift
  cancelGift: (giftId: string) => 
    api.delete(`/api/plant-gifts/${giftId}`),
};

export const tutorialAPI = {
  // Get tutorial state
  getState: () => api.get('/api/tutorial/state'),
  
  // Update tutorial state
  updateState: (data: {
    completedSteps?: string[];
    skippedSteps?: string[];
    hasCompletedTutorial?: boolean;
  }) => api.post('/api/tutorial/state', data),
  
  // Mark tutorial as completed
  complete: () => api.post('/api/tutorial/complete'),
};

export default api;
