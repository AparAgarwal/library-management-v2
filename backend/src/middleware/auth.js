const jwt = require('jsonwebtoken');
const { ERROR_MESSAGES, ROLES } = require('../config/constants');

/**
 * Verify JWT token middleware
 * Authenticates user and attaches user data to request
 */
exports.auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: ERROR_MESSAGES.NO_TOKEN });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    res.status(401).json({ error: ERROR_MESSAGES.INVALID_TOKEN });
  }
};

/**
 * Check if user is a librarian/admin
 * Must be used after auth middleware
 */
exports.isLibrarian = (req, res, next) => {
  if (req.user.role !== ROLES.LIBRARIAN) {
    return res.status(403).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }
  next();
};
