require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const connectDB = require('./config/db');
const cors = require('cors');
const { setupSocket } = require('./socket');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');


const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const commentRoutes = require('./routes/commentRoutes');
const likeRoutes = require('./routes/likeRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const adminRoutes = require('./routes/adminRoutes');
const {errorHandler} = require("./middleware/errorMiddleware");
const path = require("node:path");
const swaggerDocument = YAML.load(path.join(__dirname, "swagger.yaml"));

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

app.locals.io = io;

// Middleware
app.use(cors());
app.use(express.json());
// Routes Middleware
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/comments', commentRoutes);
app.use('/likes', likeRoutes);
app.use('/bookmarks', bookmarkRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);

// Setup Socket.io
setupSocket(io);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
