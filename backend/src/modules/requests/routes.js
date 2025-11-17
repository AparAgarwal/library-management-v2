const express = require('express');
const router = express.Router();
const { auth, isLibrarian } = require('../../middleware/auth');
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');

router.post('/', auth, asyncHandler(controller.createRequest));
router.get('/', auth, isLibrarian, asyncHandler(controller.listRequests));
router.get('/my-requests', auth, asyncHandler(controller.getMyRequests));
router.put('/:id', auth, isLibrarian, asyncHandler(controller.updateRequest));

module.exports = router;
