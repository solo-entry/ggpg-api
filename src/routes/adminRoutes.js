// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  deleteComment,
  featureProject,
  unfeatureProject,
  addCategory,
  editCategory,
  deleteCategory,
  getAllUsers,
  deleteUser,
  getAllReports, getAllCategories, getCategoryById, getAllComments, getDashboard,
} = require('../controllers/adminController');
const {protect} = require('../middleware/authMiddleware');
const {admin} = require('../middleware/adminMiddleware');

// Admin Routes
router.delete('/comments/:id', protect, admin, deleteComment);
router.get('/comments', protect, admin, getAllComments);
router.get('/dashboard', protect, admin, getDashboard);
router.put('/projects/feature/:id', protect, admin, featureProject);
router.put('/projects/unfeature/:id', protect, admin, unfeatureProject);

// Category Management
router.get('/categories', protect, admin, getAllCategories);
router.post('/categories', protect, admin, addCategory);
router.get('/categories/:id', protect, admin, getCategoryById);
router.put('/categories/:id', protect, admin, editCategory);
router.delete('/categories/:id', protect, admin, deleteCategory);

// User Management
router.get('/users', protect, admin, getAllUsers);
router.delete('/users/:id', protect, admin, deleteUser);

// Reports (Not implemented)
router.get('/reports', protect, admin, getAllReports);

// Generate Tags using AI

module.exports = router;
