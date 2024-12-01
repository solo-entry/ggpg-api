// socket.js
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.headers.authorization;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error'));
      }
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  }).on('connection', (socket) => {
    // console.log(`User connected: ${socket.user.fullName}`);

    // Join room based on user ID for personalized notifications
    socket.join(socket.user._id.toString());

    socket.on('disconnect', () => {
      // console.log(`User disconnected: ${socket.user.fullName}`);
    });
    socket.on('comment', (projectId) => {
      socket.join(`comment_${projectId}`);
    });
  });
};

module.exports = {setupSocket};
