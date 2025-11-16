/**
 * Helper utilities for common operations
 */

/**
 * Transforms database user row to API response format
 * Centralizes user data transformation logic
 * @param {Object} user - User data from database
 * @returns {Object} - Transformed user object
 */
const transformUserData = (user) => {
  if (!user) return null;

  return {
    id: user.user_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    phone: user.phone || null,
    address: user.address || null,
    avatarUrl: user.avatar_url || null,
    createdAt: user.created_at,
  };
};

/**
 * Calculates pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
const calculatePagination = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

/**
 * Invalidates cache keys matching a pattern
 * @param {Object} redis - Redis client
 * @param {string} pattern - Pattern to match (e.g., 'books:page:*')
 * @returns {Promise<void>}
 */
const invalidateCachePattern = async (redis, pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Cache invalidation error for pattern ${pattern}:`, error);
  }
};

/**
 * Calculates due date from checkout date
 * @param {Date} checkoutDate - Checkout date
 * @param {number} durationDays - Number of days until due
 * @returns {Date}
 */
const calculateDueDate = (checkoutDate = new Date(), durationDays = 14) => {
  const dueDate = new Date(checkoutDate);
  dueDate.setDate(dueDate.getDate() + durationDays);
  return dueDate;
};

/**
 * Calculates fine amount based on days late
 * @param {Date} dueDate - Original due date
 * @param {Date} returnDate - Actual return date
 * @param {number} finePerDay - Fine amount per day
 * @returns {number} - Total fine amount
 */
const calculateFine = (dueDate, returnDate, finePerDay = 0.5) => {
  if (returnDate <= dueDate) return 0;

  const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  return daysLate * finePerDay;
};

/**
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Creates a standardized success response
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @returns {Object}
 */
const successResponse = (message, data = null) => {
  const response = { success: true, message };
  if (data) response.data = data;
  return response;
};

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object}
 */
const errorResponse = (message, details = null) => {
  const response = { success: false, error: message };
  if (details) response.details = details;
  return response;
};

module.exports = {
  transformUserData,
  calculatePagination,
  invalidateCachePattern,
  calculateDueDate,
  calculateFine,
  asyncHandler,
  successResponse,
  errorResponse,
};
