const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');
const { auth, isLibrarian } = require('../../middleware/auth');

router.use(auth, isLibrarian);
router.post('/checkout', asyncHandler(controller.checkoutBook));
router.post('/return', asyncHandler(controller.returnBook));
router.get('/checkouts', asyncHandler(controller.getAllCheckouts));
router.get('/stats', asyncHandler(controller.getLibraryStats));

module.exports = router;
