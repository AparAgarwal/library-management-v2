const express = require('express');
const cors = require('cors');
const path = require('path');
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
