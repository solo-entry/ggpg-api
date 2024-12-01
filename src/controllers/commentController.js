// controllers/commentController.js
const Comment = require('../models/Comment');
const Project = require('../models/Project');

// @desc    Add a comment to a project
// @route   POST /api/comments/:projectId
// @access  Private
const addComment = async (req, res) => {
  const {content} = req.body;

  if (!content) {
    return res.status(400).json({message: 'Comment content is required'});
  }

  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({message: 'Project not found'});
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      project: project._id,
    });

    const savedComment = await comment.save();

    project.comments.push(savedComment._id);
    await project.save();

    res.status(201).json(savedComment);

    const io = req.app.locals.io;
    const preparedComment = await comment.populate('author', 'fullName email');
    io.to(`comment_${project._id}`).emit('newComment', preparedComment.toJSON());
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Get comments for a project
// @route   GET /api/comments/:projectId
// @access  Public
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({project: req.params.projectId})
      .populate('author', 'fullName email')
      .sort({createdAt: -1})
      .exec();
    res.json(comments);
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Edit a comment
// @route   PUT /api/comments/:id
// @access  Private
const editComment = async (req, res) => {
  const {content} = req.body;

  try {
    const comment = await Comment.findById(req.params.id);

    if (comment) {
      if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({message: 'Not authorized to edit this comment'});
      }

      comment.content = content || comment.content;
      const updatedComment = await comment.save();
      res.json(updatedComment);
    } else {
      res.status(404).json({message: 'Comment not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (comment) {
      if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(401).json({message: 'Not authorized to delete this comment'});
      }

      await comment.deleteOne();

      // Remove comment from project
      const project = await Project.findById(comment.project);
      if (project) {
        project.comments.pull(comment._id);
        await project.save();
      }

      res.json({message: 'Comment removed'});
    } else {
      res.status(404).json({message: 'Comment not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = {
  addComment,
  getComments,
  editComment,
  deleteComment,
};
