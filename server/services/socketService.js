const { Server } = require('socket.io');
const { clientUrl } = require('../config/env');
const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO on the HTTP server.
 * Sets up authentication middleware and connection handling.
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl.split(','),
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware — runs once per connection.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('_id name role isActive').lean();
      if (!user || !user.isActive) return next(new Error('Account inactive'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid session'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    logger.info(`Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    // Join a user-specific room for private notifications.
    socket.join(`user:${user._id}`);

    // Client requests to join a project room.
    socket.on('join:project', async (projectId) => {
      try {
        const Project = require('../models/Project');
        const isStaff = user.role === 'admin' || user.role === 'manager';
        const query = isStaff ? { _id: projectId } : { _id: projectId, client: user._id };
        const project = await Project.findOne(query).select('_id').lean();

        if (!project) {
          socket.emit('error:room', { message: 'Not authorised for this project' });
          return;
        }
        socket.join(`project:${projectId}`);
        socket.emit('joined:project', { projectId });
        logger.info(`${user.name} joined room project:${projectId}`);
      } catch (err) {
        logger.error('join:project error', err.message);
        socket.emit('error:room', { message: 'Could not join project room' });
      }
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.info(`${user.name} left room project:${projectId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${user.name} (${reason})`);
    });
  });

  logger.info('Socket.IO initialised');
  return io;
}

/** Emit an event to everyone in a project room. */
function emitToProject(projectId, event, data) {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
}

/** Emit an event to a specific user. */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/** Return the raw io instance (for advanced use). */
function getIO() {
  return io;
}

module.exports = { init, emitToProject, emitToUser, getIO };
