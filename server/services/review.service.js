const firestoreService = require('./firestore.service');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notifyStaff, notify } = require('./notification.service');

async function populateReview(r) {
  if (!r) return null;
  const item = { ...r };
  if (item.client && typeof item.client === 'string') {
    const u = await firestoreService.getById('users', item.client);
    item.client = u
      ? { _id: u._id, id: u._id, name: u.name, company: u.company, avatar: u.avatar }
      : { _id: item.client, id: item.client, name: 'Client' };
  }
  if (item.project && typeof item.project === 'string') {
    const p = await firestoreService.getById('projects', item.project);
    item.project = p ? { _id: p._id, id: p._id, name: p.name, category: p.category } : { _id: item.project, id: item.project, name: 'Project' };
  }
  return item;
}

async function listPublic(filters = {}) {
  const items = await firestoreService.find('reviews', (ref) =>
    ref.where('status', '==', 'approved')
  , { limit: Math.min(Number(filters.limit) || 12, 48) });

  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return Promise.all(items.map(populateReview));
}

async function listAdmin(user, filters) {
  const { page, limit, skip } = getPagination(filters);
  const isStaffUser = isStaff(user);
  const userIds = [user?._id, user?.uid, user?.id].filter(Boolean);

  const items = await firestoreService.find('reviews');
  let filtered = items;
  if (!isStaffUser && userIds.length > 0) {
    filtered = filtered.filter((r) => {
      const rClient = typeof r.client === 'object' ? (r.client?._id || r.client?.id) : r.client;
      return userIds.includes(rClient) || userIds.includes(r.clientId);
    });
  }
  if (filters.status) {
    filtered = filtered.filter((r) => r.status === filters.status);
  }

  filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  const populated = await Promise.all(paginated.map(populateReview));

  return { items: populated, meta: buildMeta({ page, limit, total }) };
}

async function create(user, payload) {
  const userId = user._id || user.uid || user.id;

  if (payload.project) {
    // Check if review already exists for this project
    const existing = await firestoreService.findOne('reviews', (ref) =>
      ref.where('client', '==', userId).where('project', '==', payload.project)
    );
    if (existing) {
      throw ApiError.conflict('You have already submitted a review for this project');
    }
  }

  const reviewData = {
    ...payload,
    client: userId,
    rating: Number(payload.rating) || 5,
    status: 'approved', // Auto-approved so it immediately appears on the website
    createdAt: new Date(),
  };

  let review = await firestoreService.create('reviews', reviewData);
  review = await populateReview(review);

  await notifyStaff({
    type: 'review_submitted',
    title: `New review submitted by ${user.name || 'Client'}`,
    body: review.title || review.body?.slice(0, 100),
    link: `/admin/reviews/${review._id}`,
  }).catch(() => {});

  return review;
}

async function moderate(user, id, { status, moderationNote }) {
  const userId = user._id || user.uid;
  const updateData = {
    status,
    moderationNote: moderationNote || '',
    moderatedBy: userId,
    moderatedAt: new Date(),
  };

  let review = await firestoreService.update('reviews', id, updateData);
  if (!review) throw ApiError.notFound('Review not found');
  review = await populateReview(review);

  const clientId = typeof review.client === 'object' ? review.client._id : review.client;
  if (clientId) {
    await notify({
      user: clientId,
      type: 'review_moderated',
      title: `Your review was ${status}`,
      body: status === 'approved' ? 'It is now visible on our public portfolio.' : moderationNote,
    }).catch(() => {});
  }

  return review;
}

async function remove(id) {
  await firestoreService.remove('reviews', id);
  return { id };
}

module.exports = { listPublic, list: listAdmin, listAdmin, create, moderate, remove };
