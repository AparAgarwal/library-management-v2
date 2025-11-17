const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// Validate environment variables on startup
const { validateEnvironment, getConfig } = require('./config/env');
validateEnvironment();

const db = require('./config/db');
const redis = require('./config/redis');
const registerModules = require('./modules');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const config = getConfig();
const PORT = config.port;

// Middleware
// Security headers
app.use(helmet());

// Request logging (skip in test)
if (config.env !== 'test') {
  app.use(morgan('combined'));
}

// CORS with explicit origin
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting (tighter on auth routes)
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT NOW()');
    
    // Check Redis connection
    await redis.ping();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Basic route
app.get('/api', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      books: '/api/books',
      users: '/api/users',
      circulation: '/api/circulation',
    },
  });
});

// Feature Modules
registerModules(app);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
