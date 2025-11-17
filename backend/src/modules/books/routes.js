const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');
const { auth, isLibrarian } = require('../../middleware/auth');

router.get('/', asyncHandler(controller.getAllBooks));
router.get('/search', asyncHandler(controller.searchBooks));
router.get('/:id', asyncHandler(controller.getBookById));
router.post('/', auth, isLibrarian, asyncHandler(controller.addBook));
router.post('/items', auth, isLibrarian, asyncHandler(controller.addBookItem));

module.exports = router;
