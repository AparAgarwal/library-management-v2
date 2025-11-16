/**
 * Frontend application constants
 * Centralizes magic numbers and strings
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MEMBERS_DEFAULT_LIMIT: 25,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  BOOKS: {
    LIST: '/books',
    DETAIL: (id) => `/books/${id}`,
    SEARCH: '/books/search',
    ADD: '/books',
    ADD_ITEM: '/books/items',
  },
  USERS: {
    MY_BOOKS: '/users/my-books',
    HISTORY: '/users/history',
    FINES: '/users/fines',
    DASHBOARD: '/users/dashboard-stats',
    PROFILE: '/users/profile',
    AVATAR: '/users/avatar',
  },
  ADMIN: {
    MEMBERS: '/admin/members',
    MEMBER_DETAIL: (id) => `/admin/members/${id}`,
  },
  CIRCULATION: {
    CHECKOUT: '/circulation/checkout',
    RETURN: '/circulation/return',
    CHECKOUTS: '/circulation/checkouts',
    STATS: '/circulation/stats',
  },
  REQUESTS: {
    CREATE: '/requests',
    LIST: '/requests',
    UPDATE: (id) => `/requests/${id}`,
  },
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
  AVATAR_UPDATE_SUCCESS: 'Avatar updated successfully!',
  BOOK_CHECKOUT_SUCCESS: 'Book checked out successfully!',
  BOOK_RETURN_SUCCESS: 'Book returned successfully!',
  REQUEST_CREATED: 'Request submitted successfully!',
};

export const USER_ROLES = {
  MEMBER: 'MEMBER',
  LIBRARIAN: 'LIBRARIAN',
};

export const BOOK_STATUS = {
  AVAILABLE: 'AVAILABLE',
  CHECKED_OUT: 'CHECKED_OUT',
  RESERVED: 'RESERVED',
  DAMAGED: 'DAMAGED',
  LOST: 'LOST',
};

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  CANCELLED: 'CANCELLED',
};

export const DATE_FORMAT_OPTIONS = {
  SHORT: { year: 'numeric', month: 'short', day: 'numeric' },
  LONG: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  BOOKS: '/books',
  BOOK_DETAIL: (id) => `/books/${id}`,
  PROFILE: '/profile',
  ADMIN_MEMBERS: '/dashboard/admin/members',
  ADMIN_MEMBER_DETAIL: (id) => `/dashboard/admin/members/${id}`,
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
};
