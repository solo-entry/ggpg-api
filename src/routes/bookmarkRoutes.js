const express = require('express');
const router = express.Router();
const {
  bookmarkProject,
  removeBookmark,
  getUserBookmarks,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

// Protected Routes
router.post('/:projectId', protect, bookmarkProject);
router.delete('/:projectId', protect, removeBookmark);
router.get('/', protect, getUserBookmarks);

module.exports = router;
