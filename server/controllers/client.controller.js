const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { auth, isConfigured } = require('../config/firebaseAdmin');
const { getPagination, buildMeta } = require('../utils/pagination');

/* Admin-only client directory. */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const allUsers = await firestoreService.find('users', (ref) =>
    ref.where('role', '==', 'client')
  );
  let filtered = allUsers;

  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.company?.toLowerCase().includes(term)
    );
  }
  if (req.query.status) {
    const activeState = req.query.status === 'active';
    filtered = filtered.filter((u) => u.isActive === activeState);
  }

  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = filtered.length;
  const items = filtered.slice(skip, skip + limit);

  return success(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

exports.getOne = asyncHandler(async (req, res) => {
  let client = await firestoreService.getById('users', req.params.id);
  let projects = [];

  if (client && client.role === 'client') {
    projects = await firestoreService.find('projects', (ref) =>
      ref.where('client', '==', req.params.id)
    );
  } else {
    client = null;
  }

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: { client, projects } });
});

exports.create = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase().trim();

  const exists = await firestoreService.findOne('users', (ref) =>
    ref.where('email', '==', normalizedEmail)
  );
  if (exists) throw ApiError.conflict('An account with that email already exists');

  let uid = null;
  if (isConfigured && auth) {
    try {
      const fbUser = await auth.createUser({
        email: normalizedEmail,
        password: req.body.password || 'ClientPass123!',
        displayName: req.body.name,
      });
      uid = fbUser.uid;
      await auth.setCustomUserClaims(uid, { role: 'client' }).catch(() => {});
    } catch (fbErr) {
      if (fbErr.code === 'auth/email-already-exists') {
        throw ApiError.conflict('An account with that email already exists in Firebase');
      }
    }
  }

  const clientData = {
    ...req.body,
    email: normalizedEmail,
    role: 'client',
    isActive: true,
  };
  delete clientData.password;

  if (!uid) uid = 'cli_' + Date.now();
  clientData.uid = uid;
  const client = await firestoreService.set('users', uid, clientData);

  created(res, { data: client, message: 'Client created' });
});

exports.update = asyncHandler(async (req, res) => {
  const { role, password, ...safe } = req.body;
  const client = await firestoreService.update('users', req.params.id, safe);

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: client, message: 'Client updated' });
});

exports.setActive = asyncHandler(async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  const client = await firestoreService.update('users', req.params.id, { isActive });

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: client, message: client.isActive ? 'Client reactivated' : 'Client deactivated' });
});

exports.remove = asyncHandler(async (req, res) => {
  const projects = await firestoreService.find('projects', (ref) =>
    ref.where('client', '==', req.params.id).where('isArchived', '==', false)
  );

  if (projects.length > 0) {
    throw ApiError.badRequest('Archive this client\u2019s projects before deleting the account');
  }

  await firestoreService.remove('users', req.params.id);
  success(res, { message: 'Client deleted' });
});

/* Self-service profile update, for any signed-in user. */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, company, phone, position, avatar } = req.body;
  const userId = req.user._id || req.user.uid;

  const user = await firestoreService.update('users', userId, { name, company, phone, position, avatar });
  if (!user) throw ApiError.notFound('User not found');

  success(res, { data: user, message: 'Profile updated' });
});
