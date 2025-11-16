const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { auth } = require('../../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/profile', auth, controller.getProfile);

module.exports = router;
