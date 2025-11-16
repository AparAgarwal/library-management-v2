// Registers all feature module routes under /api/*
module.exports = (app) => {
  app.use('/api/auth', require('./auth/routes'));
  app.use('/api/users', require('./users/routes'));
  app.use('/api/books', require('./books/routes'));
  app.use('/api/circulation', require('./circulation/routes'));
  app.use('/api/admin', require('./admin/routes'));
  app.use('/api/requests', require('./requests/routes'));
};
