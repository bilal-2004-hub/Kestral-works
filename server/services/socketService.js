const { Server } = require('socket.io');
const { clientUrl } = require('../config/env');
const { auth: firebaseAuth, isConfigured } = require('../config/firebaseAdmin');
const { verifyAccessToken } = require('../utils/token');
const firestoreService = require('./firestore.service');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO on the HTTP server.
 * Sets up authentication middleware and connection handling.
 *
 * Auth strategy mirrors the REST API middleware (server/middleware/auth.js):
 *   1. Try Firebase ID Token (primary — used by the React frontend via getIdToken())
 *   2. Fall back to custom JWT (legacy / non-Firebase sessions)
 * This ensures the same token the AuthContext sends as Bearer also works for
 * Socket.IO, so clients do not need separate token management.
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

      let userId = null;
      let userDoc = null;

      // 1. Try Firebase ID Token (matches REST API primary path)
      if (isConfigured && firebaseAuth) {
        try {
          const decoded = await firebaseAuth.verifyIdToken(token);
          userId = decoded.uid;
          userDoc = await firestoreService.getById('users', userId);

          // Auto-provision if first socket connection before REST API call
          if (!userDoc) {
            userDoc = {
              uid: decoded.uid,
              email: decoded.email || '',
              name: decoded.name || (decoded.email || '').split('@')[0] || 'User',
              role: 'client',
              isActive: true,
            };
          }
        } catch (firebaseErr) {
          if (firebaseErr.code === 'auth/id-token-expired') {
            return next(new Error('Session expired'));
          }
          // Not a Firebase token — fall through to JWT
        }
      }

      // 2. Fallback to custom JWT
      if (!userId) {
        const payload = verifyAccessToken(token);
        userId = payload.sub;
        userDoc = await firestoreService.getById('users', userId);
      }

      if (!userDoc || userDoc.isActive === false) {
        return next(new Error('Account inactive'));
      }

      socket.user = {
        _id: userId,
        id: userId,
        uid: userId,
        ...userDoc,
      };
      next();
    } catch (err) {
      logger.warn('Socket auth failed:', err.message);
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
        const isStaff = user.role === 'admin' || user.role === 'manager';
        const project = await firestoreService.getById('projects', projectId);

        if (!project || project.isArchived) {
          socket.emit('error:room', { message: 'Project not found' });
          return;
        }

        const clientMatch =
          project.client === user._id ||
          project.client === user.uid ||
          project.client === user.id;

        if (!isStaff && !clientMatch) {
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
