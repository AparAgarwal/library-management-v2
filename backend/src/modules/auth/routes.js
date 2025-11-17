const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');
const { auth } = require('../../middleware/auth');

router.post('/register', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));
router.get('/profile', auth, asyncHandler(controller.getProfile));

module.exports = router;
