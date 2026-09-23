const firestoreService = require('./firestore.service');
const Feedback = require('../models/Feedback');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { getPagination, buildMeta } = require('../utils/pagination');
const { assertProjectAccess } = require('./task.service');
const { notify, notifyStaff } = require('./notification.service');

async function populateFeedback(item) {
  if (!item) return null;
  const f = { ...item };
  if (f.client && typeof f.client === 'string') {
    const u = await firestoreService.getById('users', f.client);
    f.client = u ? { _id: u._id, id: u._id, name: u.name, email: u.email, company: u.company, avatar: u.avatar } : { _id: f.client, id: f.client, name: 'Client' };
  }
  if (f.project && typeof f.project === 'string') {
    const p = await firestoreService.getById('projects', f.project);
    f.project = p ? { _id: p._id, id: p._id, name: p.name, status: p.status } : { _id: f.project, id: f.project, name: 'Project' };
  }
  if (f.task && typeof f.task === 'string') {
    const t = await firestoreService.getById('tasks', f.task);
    f.task = t ? { _id: t._id, id: t._id, title: t.title } : { _id: f.task, id: f.task, title: 'Task' };
  }
  if (Array.isArray(f.replies)) {
    f.replies = await Promise.all(
      f.replies.map(async (rep) => {
        if (rep.author && typeof rep.author === 'string') {
          const authorDoc = await firestoreService.getById('users', rep.author);
          return {
            ...rep,
            author: authorDoc
              ? { _id: authorDoc._id, id: authorDoc._id, name: authorDoc.name, role: authorDoc.role, avatar: authorDoc.avatar }
              : { _id: rep.author, id: rep.author, name: 'Author' },
          };
        }
        return rep;
      })
    );
  } else {
    f.replies = [];
  }
  return f;
}

async function list(user, filters) {
  const { page, limit, skip } = getPagination(filters);
  const userId = user._id || user.uid;

  if (firestoreService.db) {
    const rawItems = await firestoreService.find('feedback', (ref) => {
      let q = ref;
      if (!isStaff(user)) {
        q = q.where('client', '==', userId);
      }
      if (filters.status) {
        q = q.where('status', '==', filters.status);
      }
      if (filters.project) {
        q = q.where('project', '==', filters.project);
      }
      return q;
    });

    rawItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = rawItems.length;
    const paginated = rawItems.slice(skip, skip + limit);
    const populated = await Promise.all(paginated.map(populateFeedback));

    return { items: populated, meta: buildMeta({ page, limit, total }) };
  }

  // Mongoose fallback
  const query = isStaff(user) ? {} : { client: user._id };
  if (filters.status) query.status = filters.status;
  if (filters.project) query.project = filters.project;

  const [items, total] = await Promise.all([
    Feedback.find(query).populate('client project task replies.author attachments').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Feedback.countDocuments(query),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(user, id) {
  let feedback = null;
  const userId = user._id || user.uid;

  if (firestoreService.db) {
    const raw = await firestoreService.getById('feedback', id);
    if (raw) {
      const clientId = typeof raw.client === 'object' ? raw.client._id : raw.client;
      if (isStaff(user) || clientId === userId) {
        feedback = await populateFeedback(raw);
      }
    }
  }

  if (!feedback) {
    const query = isStaff(user) ? { _id: id } : { _id: id, client: user._id };
    const doc = await Feedback.findOne(query).populate('client project task replies.author attachments');
    if (doc) feedback = doc.toJSON();
  }

  if (!feedback) throw ApiError.notFound('Feedback not found');
  return feedback;
}

async function create(user, payload) {
  const project = await assertProjectAccess(user, payload.project);
  const userId = user._id || user.uid;

  const data = {
    ...payload,
    client: userId,
    status: 'open',
    type: payload.type || 'change_request',
    replies: [],
  };

  let feedback;
  if (firestoreService.db) {
    feedback = await firestoreService.create('feedback', data);
    feedback = await populateFeedback(feedback);
  } else {
    const doc = await Feedback.create({ ...payload, client: user._id });
    feedback = doc.toJSON();
  }

  await notifyStaff({
    type: 'feedback_new',
    title: `New feedback on ${project.name}`,
    body: feedback.subject,
    link: `/admin/feedback/${feedback._id}`,
  }).catch(() => {});

  return feedback;
}

async function reply(user, id, message) {
  const feedback = await getById(user, id);
  const userId = user._id || user.uid;

  const newReply = {
    _id: 'rep_' + Date.now(),
    author: userId,
    message,
    createdAt: new Date(),
  };

  const replies = [...(feedback.replies || []), newReply];
  let status = feedback.status;
  if (isStaff(user) && feedback.status === 'open') {
    status = 'in_review';
  }

  let updated;
  if (firestoreService.db) {
    // Map replies to plain Object for Firestore
    const plainReplies = replies.map((r) => ({
      _id: r._id || 'rep_' + Date.now(),
      author: typeof r.author === 'object' ? r.author._id : r.author,
      message: r.message,
      createdAt: r.createdAt || new Date(),
    }));
    updated = await firestoreService.update('feedback', id, { replies: plainReplies, status });
    updated = await populateFeedback(updated);
  } else {
    const doc = await Feedback.findById(id);
    doc.replies.push({ author: user._id, message });
    if (isStaff(user) && doc.status === 'open') doc.status = 'in_review';
    await doc.save();
    updated = doc.toJSON();
  }

  const clientId = typeof feedback.client === 'object' ? feedback.client._id : feedback.client;
  const recipient = isStaff(user) ? clientId : null;

  if (recipient) {
    await notify({
      user: recipient,
      type: 'feedback_reply',
      title: `Reply to "${feedback.subject}"`,
      body: message.slice(0, 140),
      link: `/portal/feedback/${feedback._id}`,
    }).catch(() => {});
  } else {
    await notifyStaff({
      type: 'feedback_reply',
      title: `${user.name} replied to "${feedback.subject}"`,
      body: message.slice(0, 140),
      link: `/admin/feedback/${feedback._id}`,
    }).catch(() => {});
  }

  return updated;
}

async function updateStatus(id, status) {
  let feedback = await firestoreService.getById('feedback', id);
  if (!feedback) {
    const doc = await Feedback.findById(id);
    if (!doc) throw ApiError.notFound('Feedback not found');
    feedback = doc.toJSON();
  }

  const updateData = {
    status,
    resolvedAt: status === 'resolved' ? new Date() : null,
  };

  let updated;
  if (firestoreService.db) {
    updated = await firestoreService.update('feedback', id, updateData);
    updated = await populateFeedback(updated);
  } else {
    const doc = await Feedback.findById(id);
    doc.status = status;
    doc.resolvedAt = status === 'resolved' ? new Date() : undefined;
    await doc.save();
    updated = doc.toJSON();
  }

  const clientId = typeof updated.client === 'object' ? updated.client._id : updated.client;
  if (clientId) {
    await notify({
      user: clientId,
      type: 'feedback_reply',
      title: `"${updated.subject}" marked ${status.replace('_', ' ')}`,
      link: `/portal/feedback/${updated._id}`,
    }).catch(() => {});
  }

  return updated;
}

module.exports = { list, getById, create, reply, updateStatus };
