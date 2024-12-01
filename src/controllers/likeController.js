// controllers/likeController.js
const Like = require('../models/Like');
const Project = require('../models/Project');

// @desc    Like a project
// @route   POST /api/likes/:projectId
// @access  Private
const likeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }

    const alreadyLiked = project.likes.includes(req.user._id);

    if (alreadyLiked) {
      return res.status(400).json({message: 'Project already liked'});
    }

    project.likes.push(req.user._id);
    await project.save();

    const like = await Like.create({
      user: req.user._id,
      project: project._id,
    });

    res.status(201).json({message: 'Project liked'});
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Unlike a project
// @route   DELETE /api/likes/:projectId
// @access  Private
const unlikeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }

    const likeIndex = project.likes.indexOf(req.user._id);

    if (likeIndex === -1) {
      return res.status(400).json({message: 'Project not liked yet'});
    }

    project.likes.splice(likeIndex, 1);
    await project.save();

    await Like.findOneAndDelete({
      user: req.user._id,
      project: project._id,
    });

    res.json({message: 'Project unliked'});
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Get like count for a project
// @route   GET /api/likes/:projectId
// @access  Public
const getLikeCount = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }
    const userHasLiked = project.likes.includes(req.user._id);

    res.json({
      likeCount: project.likes.length,
      liked: userHasLiked
    });
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = {
  likeProject,
  unlikeProject,
  getLikeCount,
};
