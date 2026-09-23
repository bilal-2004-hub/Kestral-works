const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notifyStaff } = require('../services/notification.service');

exports.create = asyncHandler(async (req, res) => {
  // Honeypot: real visitors never fill a hidden field.
  if (req.body.website) return created(res, { message: 'Thanks — we will be in touch shortly' });

  const messageData = { ...req.body, ip: req.ip, status: 'new' };
  const message = await firestoreService.create('contactMessages', messageData);

  await notifyStaff({
    type: 'contact_new',
    title: `New enquiry from ${message.name}`,
    body: message.service ? `${message.service} — ${message.company || message.email}` : message.email,
    link: '/admin/messages',
  }).catch(() => {});

  created(res, { message: 'Thanks — we will be in touch shortly' });
});

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const items = await firestoreService.find('contactMessages', (ref) => {
    let q = ref;
    if (req.query.status) q = q.where('status', '==', req.query.status);
    return q;
  });
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = items.length;
  const paginated = items.slice(skip, skip + limit);

  return success(res, { data: paginated, meta: buildMeta({ page, limit, total }) });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const message = await firestoreService.update('contactMessages', req.params.id, { status: req.body.status });
  if (!message) throw ApiError.notFound('Message not found');
  success(res, { data: message, message: 'Message updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  const message = await firestoreService.remove('contactMessages', req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  success(res, { message: 'Message deleted' });
});
