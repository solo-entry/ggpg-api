const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.post('/register', registerUser);
router.post('/login', authUser);

// Protected Routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
