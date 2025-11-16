const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');
const { auth, isLibrarian } = require('../middleware/auth');

// Public routes
router.get('/', booksController.getAllBooks);
router.get('/search', booksController.searchBooks);
router.get('/:id', booksController.getBookById);

// Librarian only routes
router.post('/', auth, isLibrarian, booksController.addBook);
router.post('/items', auth, isLibrarian, booksController.addBookItem);

module.exports = router;
