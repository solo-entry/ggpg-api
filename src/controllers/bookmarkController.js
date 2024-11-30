const Bookmark = require('../models/Bookmark');
const Project = require('../models/Project');

// @desc    Bookmark a project
// @route   POST /api/bookmarks/:projectId
// @access  Private
const bookmarkProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const alreadyBookmarked = project.bookmarks.includes(req.user._id);

    if (alreadyBookmarked) {
      return res.status(400).json({ message: 'Project already bookmarked' });
    }

    project.bookmarks.push(req.user._id);
    await project.save();

    await Bookmark.create({
      user: req.user._id,
      project: project._id,
    });

    res.status(201).json({ message: 'Project bookmarked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove bookmark from a project
// @route   DELETE /api/bookmarks/:projectId
// @access  Private
const removeBookmark = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const bookmarkIndex = project.bookmarks.indexOf(req.user._id);

    if (bookmarkIndex === -1) {
      return res.status(400).json({ message: 'Project not bookmarked yet' });
    }

    project.bookmarks.splice(bookmarkIndex, 1);
    await project.save();

    await Bookmark.findOneAndDelete({
      user: req.user._id,
      project: project._id,
    });

    res.json({ message: 'Project unbookmarked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookmarks of a user
// @route   GET /api/bookmarks
// @access  Private
const getUserBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('project')
      .exec();
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  bookmarkProject,
  removeBookmark,
  getUserBookmarks,
};
