const firestoreService = require('./firestore.service');
const { auth, isConfigured } = require('../config/firebaseAdmin');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { clientUrl } = require('../config/env');
const { signAccessToken, signRefreshToken, verifyRefreshToken, createResetToken, hashResetToken } = require('../utils/token');
const { sendMail, passwordResetEmail } = require('./mail.service');
const logger = require('../utils/logger');

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

async function register({ name, email, password, company, phone }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check Firestore first
  let existing = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));
  if (!existing && !isConfigured) {
    existing = await User.findOne({ email: normalizedEmail }).catch(() => null);
  }
  if (existing) throw ApiError.conflict('An account with that email already exists');

  let uid = null;

  // 1. Create in Firebase Auth if available
  if (isConfigured && auth) {
    try {
      const fbUser = await auth.createUser({
        email: normalizedEmail,
        password,
        displayName: name,
      });
      uid = fbUser.uid;
      await auth.setCustomUserClaims(uid, { role: 'client' }).catch(() => {});
    } catch (fbErr) {
      if (fbErr.code === 'auth/email-already-exists') {
        throw ApiError.conflict('An account with that email already exists in Firebase');
      }
      logger.warn(`Firebase Auth create user failed, proceeding with Firestore/fallback: ${fbErr.message}`);
    }
  }

  // 2. Save user profile in Firestore
  const userData = {
    name,
    email: normalizedEmail,
    role: 'client',
    company: company || '',
    phone: phone || '',
    isActive: true,
  };

  let user;
  if (isConfigured && firestoreService.db) {
    if (!uid) uid = 'usr_' + Date.now();
    userData.uid = uid;
    user = await firestoreService.set('users', uid, userData);
  } else {
    // Legacy Mongoose fallback
    const mongoUser = await User.create({ name, email: normalizedEmail, password, company, phone, role: 'client' });
    user = mongoUser.toJSON();
  }

  return { user, ...issueTokens(user) };
}

async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Try Firestore user lookup
  let user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));

  // 2. Fallback to MongoDB if not in Firestore
  if (!user) {
    try {
      const mongoUser = await User.findOne({ email: normalizedEmail }).select('+password');
      if (mongoUser && (await mongoUser.comparePassword(password))) {
        user = mongoUser.toJSON();
      }
    } catch {}
  }

  if (!user) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  if (user.isActive === false) throw ApiError.forbidden('This account has been deactivated');

  // Update last login
  if (firestoreService.db && user._id) {
    await firestoreService.update('users', user._id, { lastLoginAt: new Date() }).catch(() => {});
  }

  return { user, ...issueTokens(user) };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('No refresh token supplied');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Your session expired. Sign in again.');
  }

  let user = await firestoreService.getById('users', payload.sub);
  if (!user) {
    try {
      user = await User.findById(payload.sub).lean();
    } catch {}
  }

  if (!user || user.isActive === false) throw ApiError.unauthorized('This account is no longer active');
  return { user, ...issueTokens(user) };
}

async function forgotPassword(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));
  
  if (isConfigured && auth) {
    try {
      // Firebase Auth sendPasswordResetEmail handled on client side
    } catch {}
  }

  if (!user || user.isActive === false) return { sent: true };

  const { raw, hash } = createResetToken();
  await firestoreService.update('users', user._id, {
    resetTokenHash: hash,
    resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
  }).catch(() => {});

  const url = `${clientUrl}/reset-password?token=${raw}&email=${encodeURIComponent(user.email)}`;
  await sendMail({ to: user.email, ...passwordResetEmail(user.name, url) }).catch(() => {});
  return { sent: true };
}

async function resetPassword({ token, email, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired');

  if (isConfigured && auth && user.uid) {
    try {
      await auth.updateUser(user.uid, { password });
    } catch (err) {
      logger.warn(`Firebase Auth password update warning: ${err.message}`);
    }
  }

  await firestoreService.update('users', user._id, {
    updatedAt: new Date(),
  });

  return { user, ...issueTokens(user) };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  let user = await firestoreService.getById('users', userId);
  if (!user) {
    const mongoUser = await User.findById(userId).select('+password');
    if (!mongoUser || !(await mongoUser.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Your current password is not correct');
    }
    mongoUser.password = newPassword;
    await mongoUser.save();
    return { user: mongoUser.toJSON(), ...issueTokens(mongoUser) };
  }

  if (isConfigured && auth && user.uid) {
    try {
      await auth.updateUser(user.uid, { password: newPassword });
    } catch (err) {
      logger.warn(`Firebase Auth password update warning: ${err.message}`);
    }
  }

  return { user, ...issueTokens(user) };
}

async function recordClientLogin(user, { ipAddress = '', userAgent = '', portal = 'client_portal', loginMethod = 'email_password' } = {}) {
  if (!user) return null;
  const userId = user._id || user.uid || user.id;
  const loginEntry = {
    userId: userId ? userId.toString() : '',
    email: user.email?.toLowerCase().trim() || '',
    name: user.name || user.displayName || '',
    company: user.company || '',
    role: user.role || 'client',
    ipAddress: ipAddress || '',
    userAgent: userAgent || '',
    portal: portal || 'client_portal',
    loginMethod: loginMethod || 'email_password',
    status: 'success',
    loginAt: new Date(),
  };

  try {
    if (firestoreService.db) {
      const created = await firestoreService.create('clientLogins', loginEntry);
      logger.info(`Logged client login in Firestore (clientLogins) for: ${user.email}`);
      return created;
    } else {
      const ClientLogin = require('../models/ClientLogin');
      const doc = await ClientLogin.create(loginEntry);
      return doc.toJSON();
    }
  } catch (err) {
    logger.warn(`Failed to record client login in Firestore: ${err.message}`);
    return loginEntry;
  }
}

async function listClientLogins(filters = {}) {
  const { getPagination, buildMeta } = require('../utils/pagination');
  const { page, limit, skip } = getPagination(filters);

  if (firestoreService.db) {
    const rawItems = await firestoreService.find('clientLogins', (ref) => {
      let q = ref;
      if (filters.email) q = q.where('email', '==', filters.email.toLowerCase().trim());
      if (filters.userId) q = q.where('userId', '==', filters.userId);
      return q;
    });

    rawItems.sort((a, b) => new Date(b.loginAt || b.createdAt || 0) - new Date(a.loginAt || a.createdAt || 0));
    const total = rawItems.length;
    const paginated = rawItems.slice(skip, skip + limit);
    return { items: paginated, meta: buildMeta({ page, limit, total }) };
  } else {
    const ClientLogin = require('../models/ClientLogin');
    const query = {};
    if (filters.email) query.email = filters.email.toLowerCase().trim();
    if (filters.userId) query.userId = filters.userId;
    const [items, total] = await Promise.all([
      ClientLogin.find(query).sort({ loginAt: -1 }).skip(skip).limit(limit).lean(),
      ClientLogin.countDocuments(query),
    ]);
    return { items, meta: buildMeta({ page, limit, total }) };
  }
}

module.exports = {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  recordClientLogin,
  listClientLogins,
  issueTokens,
};
