/**
 * Frontend helper utilities
 */

import { DATE_FORMAT_OPTIONS } from './constants';

/**
 * Formats a date string to a readable format
 * @param {string|Date} dateString - Date to format
 * @param {string} format - Format type ('SHORT' or 'LONG')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'SHORT') => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const options = DATE_FORMAT_OPTIONS[format] || DATE_FORMAT_OPTIONS.SHORT;
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Calculates days until a due date
 * @param {string|Date} dueDate - Due date
 * @returns {number} Number of days (negative if overdue)
 */
export const getDaysUntilDue = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Checks if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean}
 */
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

/**
 * Formats currency amount
 * @param {number|string} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

/**
 * Truncates text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Gets initials from a name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Gets error message from API error response
 * @param {Object} error - Error object from axios
 * @returns {string}
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Safely parses JSON from localStorage
 * @param {string} key - LocalStorage key
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*}
 */
export const safeJSONParse = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing JSON from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely stringifies and saves to localStorage
 * @param {string} key - LocalStorage key
 * @param {*} value - Value to save
 * @returns {boolean} Success status
 */
export const safeJSONStringify = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Creates a cancellable promise wrapper for API calls
 * @param {Promise} promise - Promise to wrap
 * @returns {Object} Object with promise and cancel function
 */
export const makeCancellable = (promise) => {
  let cancelled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then((value) => (cancelled ? reject({ cancelled: true }) : resolve(value)))
      .catch((error) => (cancelled ? reject({ cancelled: true }) : reject(error)));
  });

  return {
    promise: wrappedPromise,
    cancel: () => {
      cancelled = true;
    },
  };
};

/**
 * Generates a unique ID
 * @returns {string}
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalizes first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
