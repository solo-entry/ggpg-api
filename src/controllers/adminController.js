// controllers/adminController.js
const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Category = require('../models/Category');

const getDashboard = async (req, res) => {
  const totalUsers = await User.countDocuments({}).exec();
  const totalProjects = await Project.countDocuments({}).exec();
  const totalComments = await Comment.countDocuments({}).exec();
  const latestProjects = await Project.find({}).populate('author', 'fullName email').sort('-createdAt').limit(10).exec();
  const latestComments = await Comment.find({}).populate('author', 'fullName email').sort('-createdAt').limit(5).exec();
  const mostVotedProjects = await Project.find({}).populate('author', 'fullName email').sort({likes: -1}).limit(10).exec();

  res.json({
    totalUsers,
    totalProjects,
    totalComments,

    latestProjects,
    latestComments,
    mostVotedProjects,
  })
}

// @desc    Moderate content (delete inappropriate comments)
// @route   DELETE /api/admin/comments/:id
// @access  Private/Admin
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const project = await Project.findById(comment.project);

    if (comment) {
      await comment.deleteOne();
      project.comments = project.comments.filter(x => x.toString() !== req.params.id);
      await project.save();

      res.json({message: 'Comment removed by admin'});
    } else {
      res.status(404).json({message: 'Comment not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};
const getAllComments = async (req, res) => {
  try {
    const {search} = req.query;

    const filter = {};
    if (search) {
      const projects = await Project.find({title: new RegExp(search, 'i')}, '_id');
      const projectIds = (projects || []).map((project) => project._id);
      filter.project = {$in: projectIds};
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name email')
      .populate('project', 'title description')
      .sort({createdAt: -1}); // Sort by latest comments

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = {getAllComments};


// @desc    Feature a project
// @route   PUT /api/admin/projects/feature/:id
// @access  Private/Admin
const featureProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      project.isFeatured = true;
      await project.save();
      res.json({message: 'Project featured'});
    } else {
      res.status(404).json({message: 'Project not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Unfeature a project
// @route   PUT /api/admin/projects/unfeature/:id
// @access  Private/Admin
const unfeatureProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      project.isFeatured = false;
      await project.save();
      res.json({message: 'Project unfeatured'});
    } else {
      res.status(404).json({message: 'Project not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Manage categories (Add, Edit, Delete)
// @route   POST /api/admin/categories
// @access  Private/Admin
const addCategory = async (req, res) => {
  const {name, description} = req.body;

  if (!name) {
    return res.status(400).json({message: 'Category name is required'});
  }

  try {
    const categoryExists = await Category.findOne({name});

    if (categoryExists) {
      return res.status(400).json({message: 'Category already exists'});
    }

    const category = await Category.create({name, description});
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};


const editCategory = async (req, res) => {
  const {name, description} = req.body;

  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.description = description || category.description;
      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({message: 'Category not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    console.log(category)
    if (category) {
      await category.deleteOne();
      res.json({message: 'Category removed'});
    } else {
      res.status(404).json({message: 'Category not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find(); // Fetches all categories from the database
    res.status(200).json(categories); // Returns the categories in the response
  } catch (error) {
    res.status(500).json({message: 'Server error'}); // Sends a 500 error if something goes wrong
  }
};
const getCategoryById = async (req, res) => {
  try {
    const {id} = req.params; // Lấy id từ params
    const category = await Category.findById(id); // Tìm danh mục theo id

    if (!category) {
      return res.status(404).json({message: 'Category not found'}); // Nếu không tìm thấy, trả về lỗi 404
    }

    res.status(200).json(category); // Trả về danh mục nếu tìm thấy
  } catch (error) {
    res.status(500).json({message: 'Server error'}); // Xử lý lỗi server
  }
};


// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await user.deleteOne();
      res.json({message: 'User removed by admin'});
    } else {
      res.status(404).json({message: 'User not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Get all reports (if implemented)
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
  // Implementation depends on how reports are handled
  res.status(501).json({message: 'Not implemented'});
};

module.exports = {
  deleteComment,
  featureProject,
  unfeatureProject,
  getAllComments,
  getAllCategories,
  addCategory,
  getCategoryById,
  editCategory,
  deleteCategory,
  getAllUsers,
  deleteUser,
  getAllReports,
  getDashboard,
};
