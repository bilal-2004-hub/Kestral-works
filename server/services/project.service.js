const firestoreService = require('./firestore.service');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { isStaff } = require('../middleware/auth');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notify } = require('./notification.service');
const progressService = require('./progressService');

/** Helper to populate client, manager, team, and files references in Firestore documents */
async function populateProject(project) {
  if (!project) return null;
  const p = { ...project };

  // Populate client
  if (p.client) {
    if (typeof p.client === 'string') {
      const clientDoc = await firestoreService.getById('users', p.client);
      p.client = clientDoc
        ? { _id: clientDoc._id, id: clientDoc._id, name: clientDoc.name, email: clientDoc.email, company: clientDoc.company, avatar: clientDoc.avatar }
        : { _id: p.client, id: p.client, name: 'Client' };
    }
  }

  // Populate manager
  if (p.manager) {
    if (typeof p.manager === 'string') {
      const mgrDoc = await firestoreService.getById('users', p.manager);
      p.manager = mgrDoc
        ? { _id: mgrDoc._id, id: mgrDoc._id, name: mgrDoc.name, email: mgrDoc.email, avatar: mgrDoc.avatar, position: mgrDoc.position }
        : { _id: p.manager, id: p.manager, name: 'Manager' };
    }
  }

  // Populate team
  if (Array.isArray(p.team)) {
    p.team = await Promise.all(
      p.team.map(async (member) => {
        if (typeof member === 'string') {
          const u = await firestoreService.getById('users', member);
          return u ? { _id: u._id, id: u._id, name: u.name, email: u.email, avatar: u.avatar, position: u.position } : null;
        }
        return member;
      })
    ).then((list) => list.filter(Boolean));
  } else {
    p.team = [];
  }

  // Populate files
  if (Array.isArray(p.files)) {
    p.files = await Promise.all(
      p.files.map(async (fileRef) => {
        if (typeof fileRef === 'string') {
          return firestoreService.getById('files', fileRef);
        }
        return fileRef;
      })
    ).then((list) => list.filter(Boolean));
  } else {
    p.files = [];
  }

  p.milestones = p.milestones || [];
  return p;
}

function scopeAccess(user, id) {
  return isStaff(user) ? { _id: id } : { _id: id, client: user._id };
}

async function list(user, filters) {
  const { page, limit, skip } = getPagination(filters);

  // Firestore primary read
  if (firestoreService.db) {
    const rawItems = await firestoreService.find('projects', (ref) => {
      let q = ref;
      const isArchivedFilter = filters.includeArchived === 'true';
      if (!isArchivedFilter) {
        q = q.where('isArchived', '==', false);
      }
      if (!isStaff(user)) {
        const userId = user._id || user.uid;
        q = q.where('client', '==', userId);
      }
      if (filters.status) {
        q = q.where('status', '==', filters.status);
      }
      return q;
    });

    // Client-side search or sorting for memory safety
    let filtered = rawItems;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);
    const populated = await Promise.all(paginated.map(populateProject));

    return { items: populated, meta: buildMeta({ page, limit, total }) };
  }

  // Mongoose fallback
  const query = { isArchived: filters.includeArchived === 'true' ? { $in: [true, false] } : false };
  if (!isStaff(user)) query.client = user._id;
  if (filters.status) query.status = filters.status;
  if (filters.client && isStaff(user)) query.client = filters.client;
  if (filters.search) query.$text = { $search: filters.search };

  const [items, total] = await Promise.all([
    Project.find(query).populate('client manager team files').sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(query),
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(user, id) {
  let project = null;

  if (firestoreService.db) {
    const raw = await firestoreService.getById('projects', id);
    if (raw) {
      const userId = user._id || user.uid;
      const clientId = typeof raw.client === 'object' ? raw.client?._id : raw.client;
      if (isStaff(user) || clientId === userId) {
        project = await populateProject(raw);
      }
    }
  }

  if (!project) {
    const mongoProj = await Project.findOne(scopeAccess(user, id)).populate('client manager team files');
    if (mongoProj) project = mongoProj.toJSON();
  }

  if (!project) throw ApiError.notFound('Project not found');

  // Fetch tasks for project
  let tasks = [];
  if (firestoreService.db) {
    const rawTasks = await firestoreService.find('tasks', (ref) =>
      ref.where('project', '==', id)
    );
    tasks = isStaff(user) ? rawTasks : rawTasks.filter((t) => t.visibleToClient !== false);
    tasks.sort((a, b) => (a.order || 0) - (b.order || 0));
  } else {
    tasks = await Task.find({
      project: project._id,
      ...(isStaff(user) ? {} : { visibleToClient: true }),
    }).populate('assignee', 'name avatar').sort({ order: 1, createdAt: 1 }).lean();
  }

  return { project, tasks };
}

async function create(payload, actor) {
  const actorId = actor._id || actor.uid;
  const projectData = {
    ...payload,
    manager: payload.manager || actorId,
    slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    status: payload.status || 'planning',
    progress: payload.progress || 0,
    progressMode: payload.progressMode || 'task_based',
    autoComplete: payload.autoComplete !== undefined ? payload.autoComplete : true,
    milestones: payload.milestones || [],
    isPublic: payload.isPublic || false,
    isArchived: false,
    startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
  };

  let project;
  if (firestoreService.db) {
    project = await firestoreService.create('projects', projectData);
    project = await populateProject(project);
  } else {
    const doc = await Project.create({ ...payload, manager: payload.manager || actor._id });
    project = doc.toJSON();
  }

  const clientId = typeof project.client === 'object' ? project.client._id : project.client;
  await notify({
    user: clientId,
    type: 'project_assigned',
    title: `New project: ${project.name}`,
    body: 'A project has been added to your account.',
    link: `/portal/projects/${project._id}`,
  }).catch(() => {});

  return project;
}

async function update(id, payload, actor) {
  let project = await firestoreService.getById('projects', id);
  if (!project) {
    const doc = await Project.findById(id);
    if (!doc) throw ApiError.notFound('Project not found');
    project = doc.toJSON();
  }

  const previousStatus = project.status;
  const previousProgress = project.progress;

  const updatePayload = { ...payload };
  if (payload.name) {
    updatePayload.slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  let updatedProject;
  if (firestoreService.db) {
    updatedProject = await firestoreService.update('projects', id, updatePayload);
    updatedProject = await populateProject(updatedProject);
  } else {
    const doc = await Project.findById(id);
    Object.assign(doc, payload);
    await doc.save();
    updatedProject = doc.toJSON();
  }

  const clientId = typeof updatedProject.client === 'object' ? updatedProject.client._id : updatedProject.client;

  if (payload.status && payload.status !== previousStatus) {
    await notify({
      user: clientId,
      type: updatedProject.status === 'completed' ? 'project_completed' : 'project_status',
      title: `${updatedProject.name} is now ${updatedProject.status.replace('_', ' ')}`,
      body: `Updated by ${actor.name}.`,
      link: `/portal/projects/${updatedProject._id}`,
    }).catch(() => {});
    progressService.emitStatusChange(updatedProject._id, updatedProject.status, previousStatus);
  }

  if (payload.progress !== undefined && payload.progress !== previousProgress) {
    await firestoreService.create('progressHistory', {
      project: updatedProject._id,
      previousProgress,
      newProgress: payload.progress,
      changedBy: actor._id || actor.uid,
      reason: 'Manual progress update',
    }).catch(() => {});

    progressService.emitProjectUpdate(updatedProject._id, {
      progress: updatedProject.progress,
      previousProgress,
      status: updatedProject.status,
      lastProgressAt: new Date(),
    });
  }

  progressService.emitProjectUpdate(updatedProject._id, { project: updatedProject });

  return updatedProject;
}

async function addMilestone(id, milestoneData, actor) {
  let project = await firestoreService.getById('projects', id);
  if (!project) throw ApiError.notFound('Project not found');

  const milestones = project.milestones || [];
  const milestoneId = 'ms_' + Date.now();
  const newMilestone = {
    _id: milestoneId,
    id: milestoneId,
    name: milestoneData.name,
    description: milestoneData.description || '',
    status: milestoneData.status || 'pending',
    order: milestoneData.order || milestones.length + 1,
    weight: milestoneData.weight || 1,
    progress: milestoneData.status === 'completed' ? 100 : 0,
    dueDate: milestoneData.dueDate ? new Date(milestoneData.dueDate) : null,
  };

  milestones.push(newMilestone);
  const updated = await firestoreService.update('projects', id, { milestones });
  progressService.emitMilestoneEvent(id, { action: 'added', milestone: newMilestone });
  return populateProject(updated);
}

async function updateMilestone(id, milestoneId, milestoneData, actor) {
  let project = await firestoreService.getById('projects', id);
  if (!project) throw ApiError.notFound('Project not found');

  const milestones = (project.milestones || []).map((m) => {
    if (m._id === milestoneId || m.id === milestoneId) {
      const isComplete = milestoneData.status === 'completed';
      return {
        ...m,
        ...milestoneData,
        completedAt: isComplete ? new Date() : m.completedAt,
        progress: isComplete ? 100 : milestoneData.progress || m.progress,
      };
    }
    return m;
  });

  const updated = await firestoreService.update('projects', id, { milestones });
  const milestone = milestones.find((m) => m._id === milestoneId || m.id === milestoneId);
  progressService.emitMilestoneEvent(id, { action: 'updated', milestone });
  return populateProject(updated);
}

async function removeMilestone(id, milestoneId, actor) {
  let project = await firestoreService.getById('projects', id);
  if (!project) throw ApiError.notFound('Project not found');

  const milestones = (project.milestones || []).filter((m) => m._id !== milestoneId && m.id !== milestoneId);
  const updated = await firestoreService.update('projects', id, { milestones });
  progressService.emitMilestoneEvent(id, { action: 'deleted', milestoneId });
  return populateProject(updated);
}

async function archive(id) {
  const updated = await firestoreService.update('projects', id, { isArchived: true });
  if (!updated) throw ApiError.notFound('Project not found');
  return updated;
}

async function remove(id) {
  // Delete associated tasks first
  const tasks = await firestoreService.find('tasks', (ref) => ref.where('project', '==', id));
  for (const t of tasks) {
    await firestoreService.remove('tasks', t._id);
  }
  await firestoreService.remove('projects', id);
  return { id };
}

async function listPublicPortfolio({ category, limit = 12 }) {
  if (firestoreService.db) {
    const items = await firestoreService.find('projects', (ref) => {
      let q = ref.where('isPublic', '==', true).where('isArchived', '==', false);
      if (category && category !== 'all') {
        q = q.where('category', '==', category);
      }
      return q;
    }, { limit: Number(limit) || 12 });
    return items;
  }
  const query = { isPublic: true, isArchived: false };
  if (category && category !== 'all') query.category = category;
  return Project.find(query)
    .select('name slug description category technologies coverImage demoUrl status completedAt')
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(Math.min(Number(limit) || 12, 48))
    .lean();
}

module.exports = {
  list,
  getById,
  create,
  update,
  addMilestone,
  updateMilestone,
  removeMilestone,
  archive,
  remove,
  listPublicPortfolio,
  scopeAccess,
};
