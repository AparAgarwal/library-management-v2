/**
 * Centralized error handling middleware
 */

const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || ERROR_MESSAGES.SERVER_ERROR;
  let details = err.details || null;

  // Log error for debugging
  if (statusCode >= 500) {
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    console.warn('Client Error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = ERROR_MESSAGES.INVALID_TOKEN;
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    message = 'Duplicate entry';
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference';
  }

  if (err.code === '22P02') {
    // Invalid input syntax
    statusCode = 400;
    message = 'Invalid data format';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum limit';
    } else {
      message = 'File upload error';
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: ERROR_MESSAGES.ROUTE_NOT_FOUND,
    path: req.originalUrl,
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
};
