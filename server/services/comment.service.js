const firestoreService = require('./firestore.service');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { assertProjectAccess } = require('./task.service');
const { notify, notifyMany } = require('./notification.service');

async function populateComment(c) {
  if (!c) return null;
  const item = { ...c };
  if (item.author && typeof item.author === 'string') {
    const u = await firestoreService.getById('users', item.author);
    item.author = u
      ? { _id: u._id, id: u._id, name: u.name, role: u.role, avatar: u.avatar, company: u.company }
      : { _id: item.author, id: item.author, name: 'Author' };
  }
  if (Array.isArray(item.attachments)) {
    item.attachments = await Promise.all(
      item.attachments.map(async (f) => (typeof f === 'string' ? firestoreService.getById('files', f) : f))
    ).then((l) => l.filter(Boolean));
  } else {
    item.attachments = [];
  }
  return item;
}

async function list(user, projectId) {
  await assertProjectAccess(user, projectId);

  const rawComments = await firestoreService.find('comments', (ref) =>
    ref.where('project', '==', projectId)
  );
  rawComments.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  return Promise.all(rawComments.map(populateComment));
}

async function create(user, payload) {
  const project = await assertProjectAccess(user, payload.project);
  const userId = user._id || user.uid;

  const commentData = {
    ...payload,
    author: userId,
    isResolved: false,
  };

  let comment = await firestoreService.create('comments', commentData);
  comment = await populateComment(comment);

  const clientId = typeof project.client === 'object' ? project.client._id : project.client;

  // Notify the recipient
  if (isStaff(user)) {
    if (clientId) {
      await notify({
        user: clientId,
        type: 'comment_new',
        title: `New message on ${project.name}`,
        body: comment.message.slice(0, 140),
        link: `/portal/projects/${project._id}`,
      }).catch(() => {});
    }
  } else {
    const staffDocs = await firestoreService.find('users', (ref) => ref.where('role', 'in', ['admin', 'manager']));
    const staffIds = staffDocs.map((s) => s._id);

    await notifyMany(staffIds, {
      type: 'comment_new',
      title: `${user.name} commented on ${project.name}`,
      body: comment.message.slice(0, 140),
      link: `/admin/projects/${project._id}`,
    }).catch(() => {});
  }

  return comment;
}

async function resolve(user, id, isResolved) {
  const comment = await firestoreService.update('comments', id, { isResolved });
  if (!comment) throw ApiError.notFound('Comment not found');
  return comment;
}

async function remove(user, id) {
  const comment = await firestoreService.getById('comments', id);
  if (!comment) throw ApiError.notFound('Comment not found');

  const authorId = typeof comment.author === 'object' ? comment.author._id : comment.author;
  const userId = user._id || user.uid;

  if (!isStaff(user) && authorId !== userId) {
    throw ApiError.forbidden();
  }

  await firestoreService.remove('comments', id);
  return { id };
}

module.exports = { list, create, resolve, remove };
