import axios from 'axios';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Books API
export const booksAPI = {
  getAll: (page = 1, limit = 10, config = {}) => api.get(`/books`, { params: { page, limit }, ...config }),
  getById: (id, config = {}) => api.get(`/books/${id}`, { ...config }),
  search: (query, config = {}) => api.get(`/books/search`, { params: { q: query }, ...config }),
  searchAutosuggest: (q, config = {}) => api.get('/books/search', { params: { q, limit: 10 }, ...config }),
  add: (data, config = {}) => api.post('/books', data, { ...config }),
  addItem: (data, config = {}) => api.post('/books/items', data, { ...config }),
};

// Users API
export const usersAPI = {
  getMyBooks: () => api.get('/users/my-books'),
  getHistory: () => api.get('/users/history'),
  getFines: () => api.get('/users/fines'),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => {
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteAvatar: () => {
    // Send POST request with empty formData to delete avatar
    const formData = new FormData();
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Admin API
export const adminAPI = {
  // Accepts params possibly containing an AbortController signal.
  listMembers: (params = {}) => {
    const { signal, ...rest } = params || {};
    return api.get('/admin/members', { params: rest, ...(signal ? { signal } : {}) });
  },
  getMember: (id) => api.get(`/admin/members/${id}`),
};

// Requests API
export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  listForAdmin: () => api.get('/requests'),
  getMyRequests: () => api.get('/requests/my-requests'),
  update: (id, data) => api.put(`/requests/${id}`, data),
};

// Circulation API
export const circulationAPI = {
  checkout: (data) => api.post('/circulation/checkout', data),
  return: (data) => api.post('/circulation/return', data),
  getAllCheckouts: () => api.get('/circulation/checkouts'),
  getStats: () => api.get('/circulation/stats'),
};

export default api;
