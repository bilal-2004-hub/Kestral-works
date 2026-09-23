const { auth, isConfigured } = require('../config/firebaseAdmin');
const firestoreService = require('../services/firestore.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/token');

/**
 * Express middleware that authenticates the user via Firebase ID Token
 * (with backward-compatible fallback to custom JWT).
 */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
  if (!token) throw ApiError.unauthorized('No authentication token provided');

  // 1. Try Firebase ID Token verification
  if (isConfigured && auth) {
    try {
      const decoded = await auth.verifyIdToken(token);
      let userData = await firestoreService.getById('users', decoded.uid);

      // Auto-provision user record in Firestore if not yet present
      if (!userData) {
        const email = decoded.email || '';
        const role = decoded.role || (email.includes('admin') ? 'admin' : 'client');
        userData = await firestoreService.set('users', decoded.uid, {
          uid: decoded.uid,
          email: email.toLowerCase(),
          name: decoded.name || email.split('@')[0] || 'User',
          role,
          avatar: decoded.picture || undefined,
          isActive: true,
          lastLoginAt: new Date(),
        });
      }

      if (userData && userData.isActive === false) {
        throw ApiError.unauthorized('This account is deactivated');
      }

      req.user = {
        _id: decoded.uid,
        id: decoded.uid,
        uid: decoded.uid,
        ...userData,
      };
      return next();
    } catch (firebaseErr) {
      // If it's a genuine Firebase token that expired, reject immediately
      if (firebaseErr.code === 'auth/id-token-expired') {
        throw ApiError.unauthorized('Session expired. Please sign in again.');
      }
      // If token wasn't a Firebase token, check if it's a legacy JWT token fallback
    }
  }

  // 2. Backward-compatible fallback for JWT token
  try {
    const payload = verifyAccessToken(token);
    const user = await firestoreService.getById('users', payload.sub);

    if (!user || user.isActive === false) {
      throw ApiError.unauthorized('Account is inactive or not found');
    }

    req.user = {
      _id: user._id || user.id || payload.sub,
      id: user._id || user.id || payload.sub,
      uid: user.uid || user._id || user.id || payload.sub,
      ...user,
    };
    return next();
  } catch (jwtErr) {
    throw ApiError.unauthorized('Invalid or expired authentication session');
  }
});

/**
 * Role-based authorization gate.
 * Usage: router.post('/', requireAuth, requireRole('admin', 'manager'), handler)
 */
const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient permissions'));
  next();
};

const isStaff = (user) => user && (user.role === 'admin' || user.role === 'manager');

module.exports = {
  requireAuth,
  requireRole,
  isStaff,
  authenticateUser: requireAuth,
};
