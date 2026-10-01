const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const firestoreService = require('../services/firestore.service');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const userIds = [req.user._id, req.user.uid, req.user.id].filter(Boolean);

  const allItems = await firestoreService.find('notifications');
  const userNotifs = allItems.filter((n) => {
    const nUser = n.user || n.userId;
    if (!userIds.includes(nUser)) return false;
    if (req.query.unread === 'true' && n.isRead !== false) return false;
    return true;
  });

  // Sort newest first
  userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const total = userNotifs.length;
  const unread = userNotifs.filter((n) => !n.isRead).length;
  const items = userNotifs.slice(skip, skip + limit);

  success(res, { data: items, meta: { ...buildMeta({ page, limit, total }), unread } });
});

exports.markRead = asyncHandler(async (req, res) => {
  const userIds = [req.user._id, req.user.uid, req.user.id].filter(Boolean);
  const notification = await firestoreService.getById('notifications', req.params.id);

  const nUser = notification ? (notification.user || notification.userId) : null;
  if (!notification || !userIds.includes(nUser)) {
    throw ApiError.notFound('Notification not found');
  }

  const updated = await firestoreService.update('notifications', req.params.id, {
    isRead: true,
    readAt: new Date(),
  });

  success(res, { data: updated });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const userIds = [req.user._id, req.user.uid, req.user.id].filter(Boolean);

  const allItems = await firestoreService.find('notifications');
  const unreadItems = allItems.filter((n) => {
    const nUser = n.user || n.userId;
    return userIds.includes(nUser) && !n.isRead;
  });

  // Firestore does not support batch updates via a single query; update each doc.
  const now = new Date();
  await Promise.all(
    unreadItems.map((n) =>
      firestoreService.update('notifications', n._id, { isRead: true, readAt: now })
    )
  );

  success(res, { message: 'All notifications marked as read' });
});
