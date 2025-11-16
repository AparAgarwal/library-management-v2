const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

router.get('/my-books', userController.getMyBooks);
router.get('/history', userController.getTransactionHistory);
router.get('/fines', userController.getMyFines);
router.get('/dashboard-stats', userController.getDashboardStats);

module.exports = router;
