const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');
const { auth, isLibrarian } = require('../../middleware/auth');

router.use(auth, isLibrarian);
router.get('/members', asyncHandler(controller.listMembers));
router.get('/members/:id', asyncHandler(controller.getMemberDetails));

module.exports = router;
