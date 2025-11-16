const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth, isLibrarian } = require('../../middleware/auth');

router.get('/', controller.getAllBooks);
router.get('/search', controller.searchBooks);
router.get('/:id', controller.getBookById);
router.post('/', auth, isLibrarian, controller.addBook);
router.post('/items', auth, isLibrarian, controller.addBookItem);

module.exports = router;
