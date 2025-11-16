const express = require('express');
const router = express.Router();
const circulationController = require('../controllers/circulationController');
const { auth, isLibrarian } = require('../middleware/auth');

// All routes require librarian authentication
router.use(auth);
router.use(isLibrarian);

router.post('/checkout', circulationController.checkoutBook);
router.post('/return', circulationController.returnBook);
router.get('/checkouts', circulationController.getAllCheckouts);
router.get('/stats', circulationController.getLibraryStats);

module.exports = router;
