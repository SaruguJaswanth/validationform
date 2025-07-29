import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    return response.data;
  },
  (error) => {
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Authentication endpoints
const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Course endpoints
const courses = {
  getAll: (params = {}) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  getMyCourses: () => api.get('/courses/my-courses'),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  updateProgress: (courseId, moduleId, data) => 
    api.put(`/courses/${courseId}/modules/${moduleId}/progress`, data),
};

// Admin endpoints
const admin = {
  // Dashboard
  getStats: () => api.get('/admin/stats'),
  
  // Users
  getUsers: () => api.get('/admin/users'),
  
  // Courses
  getCourses: () => api.get('/admin/courses'),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  
  // Modules
  createModule: (courseId, data) => api.post(`/admin/courses/${courseId}/modules`, data),
  updateModule: (id, data) => api.put(`/admin/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/admin/modules/${id}`),
  
  // File upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// File download helper
const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('File download error:', error);
    throw error;
  }
};

// Error handling helper
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      success: false,
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Something else happened
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

// API service object
export const apiService = {
  auth,
  courses,
  admin,
  downloadFile,
  handleApiError,
  
  // Direct access to axios instance for custom requests
  request: api,
};

// Helper function to build query parameters
export const buildQueryParams = (params) => {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => query.append(key, item));
      } else {
        query.append(key, value);
      }
    }
  });
  
  return query.toString();
};

// Helper function for file size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function for duration formatting
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`.trim();
  }
  
  return `${mins}m`;
};

export default apiService;