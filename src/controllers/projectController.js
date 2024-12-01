const Project = require('../models/Project');
const {generateTagsWithAI} = require('../utils/openai');
const OpenAI = require("openai");

const generateTags = async (req, res) => {
  const {title, description} = req.body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const newThread = await openai.beta.threads.create({});
  const threadId = newThread.id;
  await openai.beta.threads.messages.create(threadId, {
    content: `Title: ${title}\n\nDescription: ${description}`,
    role: 'user',
  });
  await openai.beta.threads.runs.createAndPoll(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID,
  });
  const response = await openai.beta.threads.messages.list(threadId, {
    limit: 1,
  });
  if (!response?.data?.[0]?.content) throw new Error('INVALID_DATA');
  const messages = response?.data?.[0]?.content || [];
  if (messages?.[0]?.type !== 'text') throw new Error('BAD_RESPONSE');
  const json = JSON.parse(messages[0].text.value);
  res.json({
    data: json?.items ?? [],
  })

}

const createProject = async (req, res) => {
  const {title, description, media, category, tags} = req.body;

  if (!title || !description || !tags) return res.status(400).json({message: 'Title and description are required'});

  const project = new Project({
    title,
    description,
    media: media || [],
    tags: tags.split(',').map(x => x.trim()),
    author: req.user._id,
    category: category || null,
  });

  const createdProject = await project.save();
  res.status(201).json(createdProject);
}

const getProjects = async (req, res) => {
  try {
    const {search, category, tags, sortBy} = req.query;
    let query = {visibility: 'public'};

    if (category) {
      query.category = category;
    }

    if (tags) {
      query.tags = {$in: tags.split(',')};
    }

    if (search) {
      query.$or = [
        {title: {$regex: search, $options: 'i'}},
        {description: {$regex: search, $options: 'i'}},
        {tags: {$regex: search, $options: 'i'}},
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
    console.log(projects);

    res.json(projects);
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('author', 'fullName email')
      .populate('category', 'name')
      .populate({
        path: 'comments',
        populate: {path: 'author', select: 'fullName'},
      })
      .exec();

    if (project) {
      // Increment view count
      project.viewCount += 1;
      await project.save();

      res.json(project);
    } else {
      res.status(404).json({message: 'Project not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

const updateProject = async (req, res) => {
  const {title, description, media, category, visibility} = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      if (project.author.toString() !== req.user._id.toString()) {
        return res.status(401).json({message: 'Not authorized to update this project'});
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
      res.status(404).json({message: 'Project not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
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
        return res.status(401).json({message: 'Not authorized to delete this project'});
      }

      await project.deleteOne();
      res.json({message: 'Project removed'});
    } else {
      res.status(404).json({message: 'Project not found'});
    }
  } catch (error) {
    res.status(500).json({message: 'Server error'});
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  generateTags,
};
