const bcrypt = require('bcryptjs');
const firestoreService = require('./firestore.service');
const { auth, isConfigured } = require('../config/firebaseAdmin');
const ApiError = require('../utils/ApiError');
const { clientUrl, bcryptRounds } = require('../config/env');
const { signAccessToken, signRefreshToken, verifyRefreshToken, createResetToken, hashResetToken } = require('../utils/token');
const { sendMail, passwordResetEmail } = require('./mail.service');
const logger = require('../utils/logger');

const issueTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

async function register({ name, email, password, company, phone }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check Firestore for existing user
  const existing = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));
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
      logger.warn(`Firebase Auth create user failed, proceeding with Firestore: ${fbErr.message}`);
    }
  }

  // Generate UID if Firebase Auth was not available
  if (!uid) uid = 'usr_' + Date.now();

  // Hash password for bcrypt-based JWT login fallback
  const passwordHash = await bcrypt.hash(password, bcryptRounds);

  // 2. Save user profile in Firestore (including passwordHash for JWT login)
  const userData = {
    uid,
    name,
    email: normalizedEmail,
    role: 'client',
    company: company || '',
    phone: phone || '',
    isActive: true,
    passwordHash,
  };

  const user = await firestoreService.set('users', uid, userData);

  // Return user without exposing passwordHash
  const { passwordHash: _ph, ...safeUser } = user;
  return { user: safeUser, ...issueTokens(safeUser) };
}

async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Fetch user from Firestore
  const user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));

  if (!user) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  if (user.isActive === false) throw ApiError.forbidden('This account has been deactivated');

  // Verify password against stored hash
  if (!user.passwordHash) {
    // User was created via Firebase Auth token flow — password not stored in Firestore.
    // Direct email/password login requires a passwordHash to be set.
    throw ApiError.unauthorized('Please sign in with Firebase Authentication');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }

  // Update last login timestamp
  await firestoreService.update('users', user._id, { lastLoginAt: new Date() }).catch(() => {});

  // Return user without exposing passwordHash
  const { passwordHash: _ph, ...safeUser } = user;
  return { user: safeUser, ...issueTokens(safeUser) };
}

async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('No refresh token supplied');
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Your session expired. Sign in again.');
  }

  const user = await firestoreService.getById('users', payload.sub);

  if (!user || user.isActive === false) throw ApiError.unauthorized('This account is no longer active');

  const { passwordHash: _ph, ...safeUser } = user;
  return { user: safeUser, ...issueTokens(safeUser) };
}

async function forgotPassword(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));

  if (!user || user.isActive === false) return { sent: true };

  if (isConfigured && auth && user.uid) {
    try {
      // Firebase Auth password reset link — handled client-side if using Firebase Auth
    } catch {}
  }

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
  const user = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired');

  // Update password in Firebase Auth if available
  if (isConfigured && auth && user.uid) {
    try {
      await auth.updateUser(user.uid, { password });
    } catch (err) {
      logger.warn(`Firebase Auth password update warning: ${err.message}`);
    }
  }

  // Update passwordHash in Firestore for JWT login
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  await firestoreService.update('users', user._id, {
    passwordHash,
    resetTokenHash: null,
    resetTokenExpires: null,
    updatedAt: new Date(),
  });

  const { passwordHash: _ph, ...safeUser } = user;
  return { user: safeUser, ...issueTokens(safeUser) };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await firestoreService.getById('users', userId);
  if (!user) throw ApiError.notFound('User not found');

  // Verify current password if hash exists (JWT login path)
  if (user.passwordHash) {
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw ApiError.badRequest('Your current password is not correct');
  }

  // Update in Firebase Auth if available
  if (isConfigured && auth && user.uid) {
    try {
      await auth.updateUser(user.uid, { password: newPassword });
    } catch (err) {
      logger.warn(`Firebase Auth password update warning: ${err.message}`);
    }
  }

  // Update passwordHash in Firestore
  const passwordHash = await bcrypt.hash(newPassword, bcryptRounds);
  const updatedUser = await firestoreService.update('users', userId, { passwordHash });

  const { passwordHash: _ph, ...safeUser } = updatedUser;
  return { user: safeUser, ...issueTokens(safeUser) };
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
    const created = await firestoreService.create('clientLogins', loginEntry);
    logger.info(`Logged client login in Firestore (clientLogins) for: ${user.email}`);
    return created;
  } catch (err) {
    logger.warn(`Failed to record client login in Firestore: ${err.message}`);
    return loginEntry;
  }
}

async function listClientLogins(filters = {}) {
  const { getPagination, buildMeta } = require('../utils/pagination');
  const { page, limit, skip } = getPagination(filters);

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
