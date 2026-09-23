const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const Notification = require('../models/Notification');
const { getPagination, buildMeta } = require('../utils/pagination');
const ApiError = require('../utils/ApiError');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const query = { user: req.user._id };
  if (req.query.unread === 'true') query.isRead = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  success(res, { data: items, meta: { ...buildMeta({ page, limit, total }), unread } });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  success(res, { data: notification });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  success(res, { message: 'All notifications marked as read' });
});
