const firestoreService = require('./firestore.service');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notify } = require('./notification.service');
const progressService = require('./progressService');

async function populateTask(task) {
  if (!task) return null;
  const t = { ...task };
  if (t.assignee && typeof t.assignee === 'string') {
    const u = await firestoreService.getById('users', t.assignee);
    t.assignee = u ? { _id: u._id, id: u._id, name: u.name, avatar: u.avatar } : { _id: t.assignee, id: t.assignee, name: 'Assignee' };
  }
  if (t.project && typeof t.project === 'string') {
    const p = await firestoreService.getById('projects', t.project);
    t.project = p ? { _id: p._id, id: p._id, name: p.name, status: p.status, client: p.client } : { _id: t.project, id: t.project, name: 'Project' };
  }
  return t;
}

async function assertProjectAccess(user, projectId) {
  const userIds = [user._id, user.uid, user.id].filter(Boolean);
  const project = await firestoreService.getById('projects', projectId);

  if (!project) throw ApiError.notFound('Project not found');

  const clientId = typeof project.client === 'object' ? (project.client?._id || project.client?.id) : project.client;
  const isOwner = userIds.some((id) => id === clientId || id === project.clientId || id === project.claimedBy);
  if (!isStaff(user) && !isOwner) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

async function list(user, filters) {
  const { page, limit, skip } = getPagination(filters);
  const userIds = [user._id, user.uid, user.id].filter(Boolean);

  let targetProjectIds = [];
  if (filters.project) {
    await assertProjectAccess(user, filters.project);
    targetProjectIds = [filters.project];
  } else if (!isStaff(user)) {
    const allProjects = await firestoreService.find('projects');
    const userProjects = allProjects.filter((p) => {
      if (p.isArchived === true) return false;
      const pClient = typeof p.client === 'object' ? (p.client?._id || p.client?.id) : p.client;
      return userIds.some((id) => id === pClient || id === p.clientId || id === p.claimedBy);
    });
    targetProjectIds = userProjects.map((p) => p._id || p.id);

    if (targetProjectIds.length === 0) {
      return { items: [], meta: buildMeta({ page, limit, total: 0 }) };
    }
  }

  const allTasks = await firestoreService.find('tasks');
  let filtered = allTasks.filter((t) => {
    const pId = typeof t.project === 'object' ? (t.project._id || t.project.id) : t.project;
    if (targetProjectIds.length > 0 && !targetProjectIds.includes(pId)) return false;
    if (!isStaff(user) && t.visibleToClient === false) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.assignee && isStaff(user)) {
      const aId = typeof t.assignee === 'object' ? (t.assignee._id || t.assignee.id) : t.assignee;
      if (aId !== filters.assignee) return false;
    }
    return true;
  });

  filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  const populated = await Promise.all(paginated.map(populateTask));

  return { items: populated, meta: buildMeta({ page, limit, total }) };
}

async function create(payload, actor) {
  const project = await assertProjectAccess(actor, payload.project);
  const actorId = actor._id || actor.uid || actor.id;

  const taskData = {
    ...payload,
    createdBy: actorId,
    status: payload.status || 'pending',
    priority: payload.priority || 'medium',
    weight: payload.weight || 1,
    visibleToClient: payload.visibleToClient !== undefined ? payload.visibleToClient : true,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
  };

  let task = await firestoreService.create('tasks', taskData);
  task = await populateTask(task);

  const clientId = typeof project.client === 'object' ? project.client._id : project.client;

  if (task.visibleToClient && clientId) {
    await notify({
      user: clientId,
      type: 'task_assigned',
      title: `New task on ${project.name}`,
      body: task.title,
      link: `/portal/projects/${project._id}`,
    }).catch(() => {});
  }

  await progressService.recalculateAndSave(task.project, actorId, `New task: ${task.title}`);
  progressService.emitTaskEvent(task.project, 'task:created', task);

  return task;
}

async function update(id, payload, actor) {
  const task = await firestoreService.getById('tasks', id);
  if (!task) throw ApiError.notFound('Task not found');

  const projectId = typeof task.project === 'object' ? (task.project._id || task.project.id) : task.project;
  const project = await assertProjectAccess(actor, projectId);

  const previousStatus = task.status;
  const actorId = actor._id || actor.uid;

  const updateData = { ...payload };
  if (payload.status === 'completed' && previousStatus !== 'completed') {
    updateData.completedAt = new Date();
  }

  let updatedTask = await firestoreService.update('tasks', id, updateData);
  updatedTask = await populateTask(updatedTask);

  const clientId = typeof project.client === 'object' ? project.client._id : project.client;

  if (payload.status && payload.status !== previousStatus && clientId) {
    await notify({
      user: clientId,
      type: 'task_status',
      title: `${updatedTask.title} → ${updatedTask.status.replace('_', ' ')}`,
      body: `On ${project.name}.`,
      link: `/portal/projects/${project._id}`,
    }).catch(() => {});
  }

  await progressService.recalculateAndSave(
    projectId,
    actorId,
    `Task updated: ${updatedTask.title} (${updatedTask.status})`
  );
  progressService.emitTaskEvent(projectId, 'task:updated', updatedTask);

  return updatedTask;
}

async function remove(id, actor) {
  const task = await firestoreService.getById('tasks', id);
  if (!task) throw ApiError.notFound('Task not found');

  const projectId = typeof task.project === 'object' ? task.project._id : task.project;
  const actorId = actor ? (actor._id || actor.uid) : null;

  await firestoreService.remove('tasks', id);

  await progressService.recalculateAndSave(projectId, actorId, `Task deleted: ${task.title}`);
  progressService.emitTaskEvent(projectId, 'task:deleted', { _id: id });

  return { id };
}

module.exports = { list, create, update, remove, assertProjectAccess };
