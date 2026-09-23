const firestoreService = require('./firestore.service');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
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
  if (firestoreService.db) {
    const items = await firestoreService.find('reviews', (ref) =>
      ref.where('status', '==', 'approved')
    , { limit: Math.min(Number(filters.limit) || 12, 48) });

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return Promise.all(items.map(populateReview));
  }

  return Review.find({ status: 'approved' })
    .populate('client', 'name company avatar')
    .populate('project', 'name category')
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(filters.limit) || 12, 48))
    .lean();
}

async function listAdmin(user, filters) {
  const { page, limit, skip } = getPagination(filters);

  if (firestoreService.db) {
    const items = await firestoreService.find('reviews', (ref) => {
      let q = ref;
      if (filters.status) q = q.where('status', '==', filters.status);
      return q;
    });

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const total = items.length;
    const paginated = items.slice(skip, skip + limit);
    const populated = await Promise.all(paginated.map(populateReview));

    return { items: populated, meta: buildMeta({ page, limit, total }) };
  }

  const query = {};
  if (filters.status) query.status = filters.status;

  const [items, total] = await Promise.all([
    Review.find(query).populate('client project moderatedBy').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(query),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

async function create(user, payload) {
  const userId = user._id || user.uid;

  if (firestoreService.db) {
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

  const doc = await Review.create({ ...payload, client: user._id, status: 'approved' });
  await notifyStaff({
    type: 'review_submitted',
    title: `New review submitted by ${user.name || 'Client'}`,
    body: doc.title || doc.body?.slice(0, 100),
    link: `/admin/reviews/${doc._id}`,
  }).catch(() => {});

  return doc.populate('client project');
}


async function moderate(user, id, { status, moderationNote }) {
  const userId = user._id || user.uid;
  const updateData = {
    status,
    moderationNote: moderationNote || '',
    moderatedBy: userId,
    moderatedAt: new Date(),
  };

  let review;
  if (firestoreService.db) {
    review = await firestoreService.update('reviews', id, updateData);
    review = await populateReview(review);
  } else {
    const doc = await Review.findById(id);
    if (!doc) throw ApiError.notFound('Review not found');
    Object.assign(doc, updateData);
    await doc.save();
    review = doc.toJSON();
  }

  if (!review) throw ApiError.notFound('Review not found');

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
  if (firestoreService.db) {
    await firestoreService.remove('reviews', id);
  } else {
    await Review.findByIdAndDelete(id);
  }
  return { id };
}

module.exports = { listPublic, list: listAdmin, listAdmin, create, moderate, remove };
