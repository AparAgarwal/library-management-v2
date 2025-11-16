const express = require('express');
const router = express.Router();
const { auth, isLibrarian } = require('../../middleware/auth');
const controller = require('./controller');

router.post('/', auth, controller.createRequest);
router.get('/', auth, isLibrarian, controller.listRequests);
router.put('/:id', auth, isLibrarian, controller.updateRequest);

module.exports = router;
