const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject, generateTags, getFeaturedProjects, getAuthors,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// Public Routes
router.get('/featured', getFeaturedProjects);
router.get('/authors', getAuthors);
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected Routes
router.post('/', protect, createProject);
router.post('/tags', protect, generateTags);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
