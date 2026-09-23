const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const firestoreService = require('../services/firestore.service');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const userId = req.user._id || req.user.uid;

  const allItems = await firestoreService.find('notifications', (ref) => {
    let q = ref.where('user', '==', userId);
    if (req.query.unread === 'true') q = q.where('isRead', '==', false);
    return q;
  });

  // Sort newest first
  allItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const total = allItems.length;
  const unread = allItems.filter((n) => !n.isRead).length;
  const items = allItems.slice(skip, skip + limit);

  success(res, { data: items, meta: { ...buildMeta({ page, limit, total }), unread } });
});

exports.markRead = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.uid;
  const notification = await firestoreService.getById('notifications', req.params.id);

  if (!notification || notification.user !== userId) {
    throw ApiError.notFound('Notification not found');
  }

  const updated = await firestoreService.update('notifications', req.params.id, {
    isRead: true,
    readAt: new Date(),
  });

  success(res, { data: updated });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.uid;

  const unreadItems = await firestoreService.find('notifications', (ref) =>
    ref.where('user', '==', userId).where('isRead', '==', false)
  );

  // Firestore does not support batch updates via a single query; update each doc.
  const now = new Date();
  await Promise.all(
    unreadItems.map((n) =>
      firestoreService.update('notifications', n._id, { isRead: true, readAt: now })
    )
  );

  success(res, { message: 'All notifications marked as read' });
});
