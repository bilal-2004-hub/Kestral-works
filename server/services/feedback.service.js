const firestoreService = require('./firestore.service');
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
  const userIds = [user._id, user.uid, user.id].filter(Boolean);

  const rawItems = await firestoreService.find('feedback');
  let filtered = rawItems;
  if (!isStaff(user)) {
    filtered = filtered.filter((f) => {
      const fClient = typeof f.client === 'object' ? (f.client?._id || f.client?.id) : f.client;
      return userIds.includes(fClient) || userIds.includes(f.userId);
    });
  }
  if (filters.status) {
    filtered = filtered.filter((f) => f.status === filters.status);
  }
  if (filters.project) {
    filtered = filtered.filter((f) => {
      const pId = typeof f.project === 'object' ? (f.project?._id || f.project?.id) : f.project;
      return pId === filters.project;
    });
  }

  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  const populated = await Promise.all(paginated.map(populateFeedback));

  return { items: populated, meta: buildMeta({ page, limit, total }) };
}

async function getById(user, id) {
  const userIds = [user._id, user.uid, user.id].filter(Boolean);
  const raw = await firestoreService.getById('feedback', id);

  if (raw) {
    const clientId = typeof raw.client === 'object' ? (raw.client?._id || raw.client?.id) : raw.client;
    if (isStaff(user) || userIds.includes(clientId) || userIds.includes(raw.userId)) {
      return populateFeedback(raw);
    }
  }
  throw ApiError.notFound('Feedback not found');
}

async function create(user, payload) {
  const project = await assertProjectAccess(user, payload.project);
  const userId = user._id || user.uid || user.id;

  const data = {
    ...payload,
    client: userId,
    status: 'open',
    type: payload.type || 'change_request',
    replies: [],
  };

  let feedback = await firestoreService.create('feedback', data);
  feedback = await populateFeedback(feedback);

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
  const userId = user._id || user.uid || user.id;

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

  // Map replies to plain Object for Firestore
  const plainReplies = replies.map((r) => ({
    _id: r._id || 'rep_' + Date.now(),
    author: typeof r.author === 'object' ? r.author._id : r.author,
    message: r.message,
    createdAt: r.createdAt || new Date(),
  }));

  let updated = await firestoreService.update('feedback', id, { replies: plainReplies, status });
  updated = await populateFeedback(updated);

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
  const feedback = await firestoreService.getById('feedback', id);
  if (!feedback) throw ApiError.notFound('Feedback not found');

  const updateData = {
    status,
    resolvedAt: status === 'resolved' ? new Date() : null,
  };

  let updated = await firestoreService.update('feedback', id, updateData);
  updated = await populateFeedback(updated);

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
