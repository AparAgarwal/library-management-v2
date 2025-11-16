const jwt = require('jsonwebtoken');

// Verify JWT token
exports.auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user is a librarian/admin
exports.isLibrarian = (req, res, next) => {
  if (req.user.role !== 'LIBRARIAN') {
    return res.status(403).json({ error: 'Access denied. Librarian role required.' });
  }
  next();
};
