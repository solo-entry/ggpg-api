const express = require('express');
const router = express.Router();
const {
  likeProject,
  unlikeProject,
  getLikeCount,
} = require('../controllers/likeController');
const { protect } = require('../middleware/authMiddleware');

// Public Route
router.get('/:projectId', getLikeCount);

// Protected Routes
router.post('/:projectId', protect, likeProject);
router.delete('/:projectId', protect, unlikeProject);

module.exports = router;
