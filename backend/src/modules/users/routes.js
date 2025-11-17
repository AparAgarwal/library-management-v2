const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('./controller');
const { asyncHandler } = require('../../utils/helpers');
const { auth } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  },
});

router.use(auth);
router.get('/my-books', asyncHandler(controller.getMyBooks));
router.get('/history', asyncHandler(controller.getTransactionHistory));
router.get('/fines', asyncHandler(controller.getMyFines));
router.get('/dashboard-stats', asyncHandler(controller.getDashboardStats));
router.put('/profile', asyncHandler(controller.updateProfile));
router.post('/avatar', upload.single('avatar'), asyncHandler(controller.updateAvatar));

module.exports = router;
