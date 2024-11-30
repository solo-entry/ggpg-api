const Project = require('../models/Project');
const { generateTagsWithAI } = require('../utils/openai');

const createProject = async (req, res) => {
  const { title, description, media, category } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  // Generate tags using AI
  const tags = await generateTagsWithAI(description);

  const project = new Project({
    title,
    description,
    media: media || [],
    tags,
    author: req.user._id,
    category: category || null,
  });

  const createdProject = await project.save();
  res.status(201).json(createdProject);
};

const getProjects = async (req, res) => {
  try {
    const { search, category, tags, sortBy } = req.query;
    let query = { visibility: 'public' };

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    let sort = {};
    if (sortBy === 'date') {
      sort.createdAt = -1;
    } else if (sortBy === 'likes') {
      sort.likes = -1;
    } else if (sortBy === 'popularity') {
      sort.viewCount = -1;
    }

    const projects = await Project.find(query)
      .populate('author', 'fullName email')
      .populate('category', 'name')
      .sort(sort)
      .exec();

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'fullName email')
      .populate('category', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'fullName' },
      })
      .exec();

    if (project) {
      // Increment view count
      project.viewCount += 1;
      await project.save();

      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const { title, description, media, category, visibility } = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      if (project.author.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this project' });
      }

      project.title = title || project.title;
      project.description = description || project.description;
      project.media = media || project.media;
      project.category = category || project.category;
      project.visibility = visibility || project.visibility;

      // Optionally regenerate tags if description changes
      if (description) {
        project.tags = await generateTagsWithAI(description);
      }

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      if (
        project.author.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(401).json({ message: 'Not authorized to delete this project' });
      }

      await project.remove();
      res.json({ message: 'Project removed' });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
