const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth, isLibrarian } = require('../../middleware/auth');

router.use(auth, isLibrarian);
router.get('/members', controller.listMembers);
router.get('/members/:id', controller.getMemberDetails);

module.exports = router;
