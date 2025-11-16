/**
 * Application-wide constants
 * Centralizes magic numbers and strings for easier maintenance
 */

module.exports = {
  // Transaction and Checkout
  CHECKOUT_DURATION_DAYS: 14,
  FINE_PER_DAY: parseFloat(process.env.FINE_PER_DAY || '0.5'),

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  DEFAULT_MEMBERS_LIMIT: 25,
  MAX_LIMIT: 100,
  MAX_HISTORY_ITEMS: 50,
  MAX_TRANSACTION_ITEMS: 100,
  MAX_REQUEST_ITEMS: 200,
  SEARCH_LIMIT: 20,

  // Cache TTL (in seconds)
  CACHE_TTL_SHORT: 300, // 5 minutes
  CACHE_TTL_MEDIUM: 1800, // 30 minutes
  CACHE_TTL_LONG: 3600, // 1 hour

  // File Upload
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['jpeg', 'jpg', 'png', 'gif', 'webp'],

  // User Roles
  ROLES: {
    MEMBER: 'MEMBER',
    LIBRARIAN: 'LIBRARIAN',
  },

  // Book Item Status
  BOOK_STATUS: {
    AVAILABLE: 'AVAILABLE',
    CHECKED_OUT: 'CHECKED_OUT',
    RESERVED: 'RESERVED',
    DAMAGED: 'DAMAGED',
    LOST: 'LOST',
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    ACTIVE: 'ACTIVE',
    RETURNED: 'RETURNED',
    OVERDUE: 'OVERDUE',
  },

  // Request Status
  REQUEST_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    DENIED: 'DENIED',
    CANCELLED: 'CANCELLED',
  },

  // Error Messages
  ERROR_MESSAGES: {
    REQUIRED_FIELDS: 'All required fields must be provided',
    INVALID_CREDENTIALS: 'Invalid credentials',
    EMAIL_EXISTS: 'Email already registered',
    USER_NOT_FOUND: 'User not found',
    BOOK_NOT_FOUND: 'Book not found',
    BOOK_ITEM_NOT_FOUND: 'Book item not found',
    BOOK_NOT_AVAILABLE: 'Book is not available for checkout',
    NO_ACTIVE_CHECKOUT: 'No active checkout found for this book',
    INVALID_STATUS: 'Invalid status',
    REQUEST_NOT_FOUND: 'Request not found',
    MEMBER_NOT_FOUND: 'Member not found',
    INVALID_MEMBER_ID: 'Invalid member id',
    NO_TOKEN: 'No token provided',
    INVALID_TOKEN: 'Invalid token',
    ACCESS_DENIED: 'Access denied. Librarian role required.',
    SERVER_ERROR: 'Server error',
    NO_FIELDS_TO_UPDATE: 'No fields to update',
    SEARCH_QUERY_REQUIRED: 'Search query required',
    ROUTE_NOT_FOUND: 'Route not found',
  },

  // JWT
  JWT_DEFAULT_EXPIRES_IN: '7d',

  // Open Library API
  OPEN_LIBRARY_TIMEOUT: 8000,
  OPEN_LIBRARY_DELAY: 300,

  // Database
  BCRYPT_SALT_ROUNDS: 10,
};
