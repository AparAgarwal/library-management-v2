const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, isLibrarian } = require('../middleware/auth');

router.use(auth, isLibrarian);

router.get('/members', adminController.listMembers);
router.get('/members/:id', adminController.getMemberDetails);

module.exports = router;
