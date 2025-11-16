/**
 * Validation utilities for request data
 */

const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Validates required fields in an object
 * @param {Object} data - The data object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} - { isValid: boolean, missingFields: Array<string> }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} - { page: number, limit: number }
 */
const validatePagination = (page, limit, maxLimit = 100) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));

  return {
    page: validPage,
    limit: validLimit,
    offset: (validPage - 1) * validLimit,
  };
};

/**
 * Sanitizes search query
 * @param {string} query - Search query
 * @returns {string}
 */
const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  return query.trim().substring(0, 200); // Limit to 200 chars
};

/**
 * Validates book data
 * @param {Object} bookData - Book data to validate
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
const validateBookData = (bookData) => {
  const errors = [];

  if (!bookData.title || bookData.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!bookData.author || bookData.author.trim().length === 0) {
    errors.push('Author is required');
  }

  if (bookData.isbn && !/^[\d-]+$/.test(bookData.isbn)) {
    errors.push('Invalid ISBN format');
  }

  if (bookData.publicationYear) {
    const year = parseInt(bookData.publicationYear);
    if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
      errors.push('Invalid publication year');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates user registration data
 * @param {Object} userData - User data to validate
 * @returns {Object} - { isValid: boolean, errors: Array<string> }
 */
const validateUserRegistration = (userData) => {
  const errors = [];

  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Valid email is required');
  }

  if (!userData.password || userData.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!userData.firstName || userData.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  if (!userData.lastName || userData.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Creates a validation error response
 * @param {Array<string>|string} errors - Error message(s)
 * @returns {Object}
 */
const validationError = (errors) => {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  return {
    error: errorArray.length === 1 ? errorArray[0] : ERROR_MESSAGES.REQUIRED_FIELDS,
    details: errorArray,
  };
};

module.exports = {
  validateRequiredFields,
  isValidEmail,
  validatePagination,
  sanitizeSearchQuery,
  validateBookData,
  validateUserRegistration,
  validationError,
};
