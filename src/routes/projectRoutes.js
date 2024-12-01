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
const {admin} = require("../middleware/adminMiddleware");

// Public Routes
router.get('/featured', getFeaturedProjects);
router.get('/authors', getAuthors);
router.get('/', getProjects);
router.get('/:id', getProjectById);

// Protected Routes
router.post('/', protect, admin, createProject);
router.post('/tags', protect, admin, generateTags);
router.put('/:id', protect, admin, updateProject);
router.delete('/:id', protect, admin, deleteProject);

module.exports = router;
