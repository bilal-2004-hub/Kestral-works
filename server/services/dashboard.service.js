const firestoreService = require('./firestore.service');

async function clientStats(user) {
  const userIds = [
    typeof user === 'string' ? user : null,
    user?._id,
    user?.uid,
    user?.id,
  ].filter(Boolean);

  const allProjects = await firestoreService.find('projects');
  const userProjects = allProjects.filter((p) => {
    if (p.isArchived === true) return false;
    const pClient = typeof p.client === 'object' ? (p.client?._id || p.client?.id) : p.client;
    return userIds.some((id) => id === pClient || id === p.clientId || id === p.claimedBy);
  });
  const projectIds = userProjects.map((p) => p._id || p.id);

  const statusMap = {};
  let totalProgressSum = 0;
  for (const p of userProjects) {
    statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    totalProgressSum += (Number(p.progress) || 0);
  }
  const overallProgress = userProjects.length > 0 ? Math.round(totalProgressSum / userProjects.length) : 0;

  let pendingTasks = 0;
  let reviewTasks = 0;
  let completedTasks = 0;
  let upcomingTasks = [];

  if (projectIds.length > 0) {
    const allTasks = await firestoreService.find('tasks', (ref) =>
      ref.where('visibleToClient', '==', true)
    );
    const clientTasks = allTasks.filter((t) => {
      const pId = typeof t.project === 'object' ? (t.project._id || t.project.id) : t.project;
      return projectIds.includes(pId);
    });

    pendingTasks = clientTasks.filter((t) => ['pending', 'in_progress'].includes(t.status)).length;
    reviewTasks = clientTasks.filter((t) => t.status === 'review').length;
    completedTasks = clientTasks.filter((t) => t.status === 'completed').length;

    // Attach project name to upcoming tasks
    const projectMap = new Map(userProjects.map((p) => [p._id || p.id, p]));
    upcomingTasks = clientTasks
      .filter((t) => t.status !== 'completed')
      .map((t) => {
        const pId = typeof t.project === 'object' ? (t.project._id || t.project.id) : t.project;
        const proj = projectMap.get(pId);
        return {
          ...t,
          project: proj ? { _id: proj._id || proj.id, id: proj._id || proj.id, name: proj.name } : t.project,
        };
      })
      .sort((a, b) => new Date(a.dueDate || 9999999999999) - new Date(b.dueDate || 9999999999999))
      .slice(0, 5);
  }

  const allFeedback = await firestoreService.find('feedback');
  const userFeedback = allFeedback.filter((f) => {
    const fClient = typeof f.client === 'object' ? (f.client?._id || f.client?.id) : f.client;
    const fUser = f.userId;
    const fProj = typeof f.project === 'object' ? (f.project?._id || f.project?.id) : f.project;
    return userIds.includes(fClient) || userIds.includes(fUser) || (fProj && projectIds.includes(fProj));
  });
  userFeedback.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const openFeedback = userFeedback.filter((f) => f.status !== 'resolved').length;
  const recentFeedback = userFeedback.slice(0, 4);

  userProjects.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const recentProjects = userProjects.slice(0, 5);

  const allNotifs = await firestoreService.find('notifications');
  const userNotifs = allNotifs.filter((n) => {
    const nUser = n.user || n.userId;
    return userIds.includes(nUser);
  });
  userNotifs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Fetch recent progress history activities for client's projects
  let recentActivities = [];
  if (projectIds.length > 0) {
    const allHistory = await firestoreService.find('progressHistory', null, { limit: 20 });
    recentActivities = allHistory
      .filter((h) => {
        const pId = typeof h.project === 'object' ? (h.project._id || h.project.id) : h.project;
        return projectIds.includes(pId);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
  }

  return {
    totals: {
      projects: userProjects.length,
      active: (statusMap.in_progress || 0) + (statusMap.planning || 0) + (statusMap.revision || 0),
      completed: statusMap.completed || 0,
      pendingTasks,
      completedTasks,
      tasksAwaitingReview: reviewTasks,
      openFeedback,
      overallProgress,
    },
    projectsByStatus: statusMap,
    recentProjects,
    upcomingTasks,
    recentFeedback,
    recentActivities,
    notifications: userNotifs,
  };
}

async function adminStats() {
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

  // Group projects by month (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthCounts = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]}`;
    monthCounts[key] = 0;
  }

  for (const p of allProjects) {
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      const key = `${monthNames[d.getMonth()]}`;
      if (monthCounts[key] !== undefined) {
        monthCounts[key]++;
      }
    }
  }

  const projectsPerMonth = Object.entries(monthCounts).map(([month, count]) => ({
    month,
    count,
  }));

  const recentProjects = [...activeProjectsList]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

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
    projectsPerMonth,
    recentProjects,
  };
}

module.exports = { clientStats, adminStats };
