const firestoreService = require('./firestore.service');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Feedback = require('../models/Feedback');
const Review = require('../models/Review');
const User = require('../models/User');
const ContactMessage = require('../models/ContactMessage');
const Notification = require('../models/Notification');

async function clientStats(userId) {
  const uid = userId._id || userId.uid || userId.toString();

  if (firestoreService.db) {
    const userProjects = await firestoreService.find('projects', (ref) =>
      ref.where('client', '==', uid).where('isArchived', '==', false)
    );
    const projectIds = userProjects.map((p) => p._id);

    const statusMap = {};
    for (const p of userProjects) {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    }

    let pendingTasks = 0;
    let reviewTasks = 0;
    if (projectIds.length > 0) {
      const allTasks = await firestoreService.find('tasks', (ref) =>
        ref.where('visibleToClient', '==', true)
      );
      const clientTasks = allTasks.filter((t) => projectIds.includes(t.project));
      pendingTasks = clientTasks.filter((t) => ['pending', 'in_progress'].includes(t.status)).length;
      reviewTasks = clientTasks.filter((t) => t.status === 'review').length;
    }

    const allFeedback = await firestoreService.find('feedback', (ref) =>
      ref.where('client', '==', uid)
    );
    const openFeedback = allFeedback.filter((f) => f.status !== 'resolved').length;

    userProjects.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    const recentProjects = userProjects.slice(0, 5);

    const userNotifs = await firestoreService.find('notifications', (ref) =>
      ref.where('user', '==', uid)
    , { limit: 6 });
    userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return {
      totals: {
        projects: userProjects.length,
        active: (statusMap.in_progress || 0) + (statusMap.planning || 0) + (statusMap.revision || 0),
        completed: statusMap.completed || 0,
        pendingTasks,
        tasksAwaitingReview: reviewTasks,
        openFeedback,
      },
      projectsByStatus: statusMap,
      recentProjects,
      notifications: userNotifs,
    };
  }

  // Mongoose fallback
  const projectIds = await Project.find({ client: userId, isArchived: false }).distinct('_id');

  const [byStatus, pendingTasks, reviewTasks, openFeedback, recentProjects, notifications] = await Promise.all([
    Project.aggregate([
      { $match: { client: userId, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ project: { $in: projectIds }, visibleToClient: true, status: { $in: ['pending', 'in_progress'] } }),
    Task.countDocuments({ project: { $in: projectIds }, visibleToClient: true, status: 'review' }),
    Feedback.countDocuments({ client: userId, status: { $ne: 'resolved' } }),
    Project.find({ client: userId, isArchived: false }).select('name status progress dueDate updatedAt').sort({ updatedAt: -1 }).limit(5).lean(),
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const total = byStatus.reduce((sum, s) => sum + s.count, 0);

  return {
    totals: {
      projects: total,
      active: (statusMap.in_progress || 0) + (statusMap.planning || 0) + (statusMap.revision || 0),
      completed: statusMap.completed || 0,
      pendingTasks,
      tasksAwaitingReview: reviewTasks,
      openFeedback,
    },
    projectsByStatus: statusMap,
    recentProjects,
    notifications,
  };
}

async function adminStats() {
  if (firestoreService.db) {
    const [allUsers, allProjects, allTasks, allFeedback, allReviews, allContact] = await Promise.all([
      firestoreService.find('users'),
      firestoreService.find('projects'),
      firestoreService.find('tasks'),
      firestoreService.find('feedback'),
      firestoreService.find('reviews'),
      firestoreService.find('contactMessages'),
    ]);

    const clients = allUsers.filter((u) => u.role === 'client');
    const activeClients = clients.filter((u) => u.isActive !== false);

    const activeProjectsList = allProjects.filter((p) => p.isArchived !== true);
    const projectStatus = {};
    for (const p of activeProjectsList) {
      projectStatus[p.status] = (projectStatus[p.status] || 0) + 1;
    }

    const tasksByStatus = {};
    for (const t of allTasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
    }

    const openFeedback = allFeedback.filter((f) => f.status !== 'resolved').length;
    const pendingReviews = allReviews.filter((r) => r.status === 'pending').length;
    const newMessages = allContact.filter((c) => c.status === 'new').length;

    activeProjectsList.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    const recentProjects = activeProjectsList.slice(0, 6);

    return {
      totals: {
        clients: clients.length,
        activeClients: activeClients.length,
        projects: activeProjectsList.length,
        activeProjects: (projectStatus.in_progress || 0) + (projectStatus.planning || 0),
        completedProjects: projectStatus.completed || 0,
        openFeedback,
        pendingReviews,
        newMessages,
      },
      projectsByStatus: projectStatus,
      tasksByStatus,
      projectsPerMonth: [],
      recentProjects,
    };
  }

  // Mongoose fallback
  const [
    clients, activeClients, projectsByStatus, tasksByStatus,
    openFeedback, pendingReviews, newMessages, recentProjects, monthly,
  ] = await Promise.all([
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'client', isActive: true }),
    Project.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Feedback.countDocuments({ status: { $ne: 'resolved' } }),
    Review.countDocuments({ status: 'pending' }),
    ContactMessage.countDocuments({ status: 'new' }),
    Project.find({ isArchived: false }).populate('client', 'name company')
      .select('name status progress client dueDate updatedAt').sort({ updatedAt: -1 }).limit(6).lean(),
    Project.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const projectStatus = Object.fromEntries(projectsByStatus.map((s) => [s._id, s.count]));
  return {
    totals: {
      clients,
      activeClients,
      projects: projectsByStatus.reduce((sum, s) => sum + s.count, 0),
      activeProjects: (projectStatus.in_progress || 0) + (projectStatus.planning || 0),
      completedProjects: projectStatus.completed || 0,
      openFeedback,
      pendingReviews,
      newMessages,
    },
    projectsByStatus: projectStatus,
    tasksByStatus: Object.fromEntries(tasksByStatus.map((s) => [s._id, s.count])),
    projectsPerMonth: monthly.map((m) => ({ month: m._id, count: m.count })),
    recentProjects,
  };
}

module.exports = { clientStats, adminStats };
