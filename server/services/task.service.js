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
  const userId = user._id || user.uid;
  const project = await firestoreService.getById('projects', projectId);

  if (!project) throw ApiError.notFound('Project not found');

  const clientId = typeof project.client === 'object' ? project.client?._id : project.client;
  if (!isStaff(user) && clientId !== userId) {
    throw ApiError.notFound('Project not found');
  }
  return project;
}

async function list(user, filters) {
  const { page, limit, skip } = getPagination(filters);
  const userId = user._id || user.uid;

  let targetProjectIds = [];
  if (filters.project) {
    await assertProjectAccess(user, filters.project);
    targetProjectIds = [filters.project];
  } else if (!isStaff(user)) {
    const userProjects = await firestoreService.find('projects', (ref) => ref.where('client', '==', userId));
    targetProjectIds = userProjects.map((p) => p._id);
  }

  const rawTasks = await firestoreService.find('tasks', (ref) => {
    let q = ref;
    if (targetProjectIds.length === 1) {
      q = q.where('project', '==', targetProjectIds[0]);
    }
    if (!isStaff(user)) {
      q = q.where('visibleToClient', '==', true);
    }
    if (filters.status) {
      q = q.where('status', '==', filters.status);
    }
    if (filters.priority) {
      q = q.where('priority', '==', filters.priority);
    }
    return q;
  });

  let filtered = rawTasks;
  if (targetProjectIds.length > 1) {
    filtered = filtered.filter((t) => targetProjectIds.includes(t.project));
  }
  if (filters.assignee && isStaff(user)) {
    filtered = filtered.filter((t) => t.assignee === filters.assignee);
  }

  filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);
  const populated = await Promise.all(paginated.map(populateTask));

  return { items: populated, meta: buildMeta({ page, limit, total }) };
}

async function create(payload, actor) {
  const project = await assertProjectAccess(actor, payload.project);
  const actorId = actor._id || actor.uid;

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

  const projectId = typeof task.project === 'object' ? task.project._id : task.project;
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
