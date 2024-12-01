const Project = require('../models/Project');
const Like = require('../models/Like');
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
  const {title, description, media, category, tags, author, driveFileId} = req.body;

  if (!title || !description || !tags) return res.status(400).json({message: 'Title and description are required'});

  const project = new Project({
    title,
    description,
    media: media || [],
    tags: tags.split(',').map(x => x.trim()),
    author: author,
    category: category || null,
    driveFileId,
  });

  const createdProject = await project.save();
  res.status(201).json(createdProject);
}

const getAuthors = async (req, res) => {

  try {
    const topAuthors = await Project.aggregate([
      // Group projects by author and count the number of projects per author
      {
        $group: {
          _id: '$author',
          projectCount: {$sum: 1},
        }
      },
      // Sort authors by project count in descending order
      {
        $sort: {projectCount: -1}
      },
      // Lookup author details from the users collection
      {
        $lookup: {
          from: 'users', // MongoDB collection name for User model
          localField: '_id',
          foreignField: '_id',
          as: 'authorDetails'
        }
      },
      // Unwind the authorDetails array to object
      {
        $unwind: '$authorDetails'
      },
      // Project the desired fields in the response
      {
        $project: {
          _id: 0,
          authorId: '$_id',
          fullName: '$authorDetails.fullName',
          email: '$authorDetails.email',
          role: '$authorDetails.role',
          bio: '$authorDetails.profile.bio',
          skills: '$authorDetails.profile.skills',
          socialLinks: '$authorDetails.profile.socialLinks',
          projectCount: 1
        }
      }
    ]);

    res.json(topAuthors);
  } catch (error) {
    console.error('Error fetching top authors:', error.message);
    res.status(500).json({message: 'Server error'});
  }
}

const getFeaturedProjects = async (req, res) => {
  const projects = await Project.find({
    isFeatured: true,
  }).limit(5).exec();
  res.json(projects);
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

    if (req?.user?._id) {
      const mappedProjects = [];
      for (let project of projects) {
        const liked = Like.exists({
          project: project._id,
          user: req.user._id,
        });
        mappedProjects.push({
          ...project.toJSON(),
          liked,
        })
      }

      res.json(mappedProjects);
    }
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
  const {title, description, media, category, visibility, tags, author, driveFileId} = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      project.title = title || project.title;
      project.description = description || project.description;
      project.media = media || project.media;
      project.category = category || project.category;
      project.visibility = visibility || project.visibility;
      project.tags = tags?.split(',').map(x => x.trim()) || project.tags;
      project.author = author || project.author;
      project.driveFileId = driveFileId || project.driveFileId;

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
  getFeaturedProjects,
  getAuthors
};
