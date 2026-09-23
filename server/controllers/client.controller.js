const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { auth, isConfigured } = require('../config/firebaseAdmin');
const User = require('../models/User');
const Project = require('../models/Project');
const { getPagination, buildMeta } = require('../utils/pagination');

/* Admin-only client directory. */
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  if (firestoreService.db) {
    const allUsers = await firestoreService.find('users', (ref) => ref.where('role', '==', 'client'));
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
  }

  const query = { role: 'client' };
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { email: rx }, { company: rx }];
  }
  if (req.query.status) query.isActive = req.query.status === 'active';

  const [items, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);
  success(res, { data: items, meta: buildMeta({ page, limit, total }) });
});

exports.getOne = asyncHandler(async (req, res) => {
  let client = null;
  let projects = [];

  if (firestoreService.db) {
    client = await firestoreService.getById('users', req.params.id);
    if (client && client.role === 'client') {
      projects = await firestoreService.find('projects', (ref) =>
        ref.where('client', '==', req.params.id)
      );
    } else {
      client = null;
    }
  } else {
    client = await User.findOne({ _id: req.params.id, role: 'client' });
    if (client) {
      projects = await Project.find({ client: client._id })
        .select('name status progress dueDate updatedAt').sort({ updatedAt: -1 }).lean();
    }
  }

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: { client, projects } });
});

exports.create = asyncHandler(async (req, res) => {
  const normalizedEmail = req.body.email.toLowerCase().trim();

  let exists = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));
  if (!exists) {
    exists = await User.findOne({ email: normalizedEmail }).catch(() => null);
  }
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

  let client;
  if (firestoreService.db) {
    if (!uid) uid = 'cli_' + Date.now();
    clientData.uid = uid;
    client = await firestoreService.set('users', uid, clientData);
  } else {
    client = await User.create({ ...req.body, role: 'client' });
  }

  created(res, { data: client, message: 'Client created' });
});

exports.update = asyncHandler(async (req, res) => {
  const { role, password, ...safe } = req.body;
  let client = await firestoreService.update('users', req.params.id, safe);

  if (!client) {
    client = await User.findOneAndUpdate({ _id: req.params.id, role: 'client' }, safe, {
      new: true, runValidators: true,
    });
  }

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: client, message: 'Client updated' });
});

exports.setActive = asyncHandler(async (req, res) => {
  const isActive = Boolean(req.body.isActive);
  let client = await firestoreService.update('users', req.params.id, { isActive });

  if (!client) {
    client = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'client' },
      { isActive },
      { new: true }
    );
  }

  if (!client) throw ApiError.notFound('Client not found');
  success(res, { data: client, message: client.isActive ? 'Client reactivated' : 'Client deactivated' });
});

exports.remove = asyncHandler(async (req, res) => {
  let openProjects = 0;
  if (firestoreService.db) {
    const projects = await firestoreService.find('projects', (ref) =>
      ref.where('client', '==', req.params.id).where('isArchived', '==', false)
    );
    openProjects = projects.length;
  } else {
    openProjects = await Project.countDocuments({ client: req.params.id, isArchived: false });
  }

  if (openProjects) throw ApiError.badRequest('Archive this client\u2019s projects before deleting the account');

  if (firestoreService.db) {
    await firestoreService.remove('users', req.params.id);
  } else {
    await User.findOneAndDelete({ _id: req.params.id, role: 'client' });
  }

  success(res, { message: 'Client deleted' });
});

/* Self-service profile update, for any signed-in user. */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, company, phone, position, avatar } = req.body;
  const userId = req.user._id || req.user.uid;

  let user = await firestoreService.update('users', userId, { name, company, phone, position, avatar });

  if (!user) {
    user = await User.findByIdAndUpdate(
      req.user._id, { name, company, phone, position, avatar }, { new: true, runValidators: true }
    );
  }

  success(res, { data: user, message: 'Profile updated' });
});
