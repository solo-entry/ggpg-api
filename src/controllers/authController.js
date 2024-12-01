const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'});
};

const registerUser = async (req, res) => {
  const {fullName, email, password} = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({message: 'Please enter all fields'});
  }

  const userExists = await User.findOne({email});

  if (userExists) {
    return res.status(400).json({message: 'Email already in use'});
  }

  const totalUsers = await User.countDocuments({});

  const user = await User.create({
    fullName,
    email,
    passwordHash: password,
    role: totalUsers === 0 ? 'admin' : 'user',
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({message: 'Invalid user data'});
  }
};

// @desc    Authenticate user & get token
// @route   POST /auth/login
// @access  Public
const authUser = async (req, res) => {
  const {email, password} = req.body;

  const user = await User.findOne({email});

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({message: 'Invalid credentials'});
  }
};

// @desc    Get user profile
// @route   GET /auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');

  if (user) {
    res.json(user);
  } else {
    res.status(404).json({message: 'User not found'});
  }
};

// @desc    Change password
// @route   GET /auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  const {currentPassword, newPassword} = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({message: 'Please provide both current and new passwords'});
  }

  // Optional: Add password strength validation
  if (newPassword.length > 6) {
    return res.status(400).json({message: 'New password must be at least 6 characters long'});
  }

  try {
    // Find the user by ID (set by protect middleware)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    // Check if currentPassword matches the stored password
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({message: 'Current password is incorrect'});
    }

    // Update the passwordHash with the new password
    user.passwordHash = newPassword;

    // Save the updated user (pre-save middleware will hash the password)
    await user.save();

    // Optionally, generate a new token
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '30d'});

    res.json({
      message: 'Password updated successfully',
      token, // Optionally send a new token
    });
  } catch (error) {
    console.error('Error changing password:', error.message);
    res.status(500).json({message: 'Server error'});
  }
};

// @desc    Update user profile
// @route   PUT /auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.passwordHash = req.body.password;
    }
    user.profile.bio = req.body.bio || user.profile.bio;
    user.profile.skills = req.body.skills || user.profile.skills;
    user.profile.socialLinks = req.body.socialLinks || user.profile.socialLinks;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({message: 'User not found'});
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
};
