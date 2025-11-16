import axios from 'axios';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Books API
export const booksAPI = {
  getAll: (page = 1, limit = 10) => api.get(`/books?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/books/${id}`),
  search: (query) => api.get(`/books/search?q=${query}`),
  searchAutosuggest: (q) => api.get('/books/search', { params: { q, limit: 10 } }),
  add: (data) => api.post('/books', data),
  addItem: (data) => api.post('/books/items', data),
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
  listMembers: (params) => api.get('/admin/members', { params }),
  getMember: (id) => api.get(`/admin/members/${id}`),
};

// Requests API
export const requestsAPI = {
  create: (data) => api.post('/requests', data),
  listForAdmin: () => api.get('/requests'),
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
