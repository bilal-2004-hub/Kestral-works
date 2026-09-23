const firestoreService = require('./firestore.service');
const logger = require('../utils/logger');
const { emitToUser } = require('./socketService');

/* Notifications are a side effect: never let a failure here break the action
   that triggered it. */
async function notify({ user, type, title, body, link }) {
  if (!user) return null;
  const userId = typeof user === 'object' ? (user._id || user.uid || user.id) : user.toString();
  try {
    const data = {
      user: userId,
      userId,
      type,
      title,
      body: body || '',
      link: link || '',
      isRead: false,
    };

    const notification = await firestoreService.create('notifications', data);

    // Push real-time event via WebSocket
    emitToUser(userId, 'notification:new', {
      _id: notification._id,
      title,
      body,
      type,
      link,
    });

    return notification;
  } catch (err) {
    logger.error('Notification failed:', err.message);
    return null;
  }
}

async function notifyMany(userIds = [], payload) {
  const unique = [...new Set(userIds.filter(Boolean).map(String))];
  return Promise.all(unique.map((user) => notify({ ...payload, user })));
}

async function notifyStaff(payload) {
  let staffIds = [];
  const staffDocs = await firestoreService.find('users', (ref) =>
    ref.where('role', 'in', ['admin', 'manager'])
  );
  staffIds = staffDocs.filter((s) => s.isActive !== false).map((s) => s._id);

  return notifyMany(staffIds, payload);
}

module.exports = { notify, notifyMany, notifyStaff };
