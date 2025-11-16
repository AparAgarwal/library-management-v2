const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth, isLibrarian } = require('../../middleware/auth');

router.use(auth, isLibrarian);
router.post('/checkout', controller.checkoutBook);
router.post('/return', controller.returnBook);
router.get('/checkouts', controller.getAllCheckouts);
router.get('/stats', controller.getLibraryStats);

module.exports = router;
