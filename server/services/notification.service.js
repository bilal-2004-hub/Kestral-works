const firestoreService = require('./firestore.service');
const Notification = require('../models/Notification');
const User = require('../models/User');
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

    let notification;
    if (firestoreService.db) {
      notification = await firestoreService.create('notifications', data);
    } else {
      const doc = await Notification.create(data);
      notification = doc.toJSON();
    }

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
  if (firestoreService.db) {
    const staffDocs = await firestoreService.find('users', (ref) => ref.where('role', 'in', ['admin', 'manager']));
    staffIds = staffDocs.map((s) => s._id);
  } else {
    const staff = await User.find({ role: { $in: ['admin', 'manager'] }, isActive: true }).select('_id').lean();
    staffIds = staff.map((s) => s._id);
  }

  return notifyMany(staffIds, payload);
}

module.exports = { notify, notifyMany, notifyStaff };
