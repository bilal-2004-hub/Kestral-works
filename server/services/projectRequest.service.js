const firestoreService = require('./firestore.service');
const { db, Timestamp } = require('../config/firebaseAdmin');
const ApiError = require('../utils/ApiError');
const { notify, notifyStaff, notifyMany } = require('./notification.service');
const { getPagination, buildMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * Submit a public project request (no auth required).
 * Creates a projectRequests document and auto-sets status to 'available'.
 */
async function submitRequest(payload) {
  const {
    customerName, customerEmail, customerPhone, companyName,
    projectTitle, projectDescription, serviceField, goals,
    budget, deadline, additionalRequirements,
  } = payload;

  if (!customerName || !customerEmail || !projectTitle || !serviceField) {
    throw ApiError.badRequest('Name, email, project title and service field are required');
  }

  const requestData = {
    customerName: customerName.trim(),
    customerEmail: customerEmail.toLowerCase().trim(),
    customerPhone: (customerPhone || '').trim(),
    companyName: (companyName || '').trim(),
    projectTitle: projectTitle.trim(),
    projectDescription: (projectDescription || '').trim(),
    serviceField: serviceField.trim(),
    goals: (goals || '').trim(),
    budget: (budget || '').trim(),
    deadline: deadline ? new Date(deadline) : null,
    additionalRequirements: (additionalRequirements || '').trim(),
    status: 'available',
    claimedBy: null,
    claimedAt: null,
  };

  const record = await firestoreService.create('projectRequests', requestData);

  // Notify all staff about the new project request
  await notifyStaff({
    type: 'project_request_new',
    title: `New Project Request: ${record.projectTitle}`,
    body: `Service: ${record.serviceField} · From: ${record.customerName}`,
    link: `/admin/project-requests/${record._id}`,
  }).catch(() => {});

  // Find matching clients and notify them
  const matchingClients = await firestoreService.find('users', (ref) =>
    ref.where('role', '==', 'client')
       .where('professionalField', '==', record.serviceField)
       .where('isActive', '==', true)
  );

  if (matchingClients.length > 0) {
    const clientIds = matchingClients.map((c) => c._id || c.uid);
    await notifyMany(clientIds, {
      type: 'project_available',
      title: `New Project Available: ${record.projectTitle}`,
      body: `A new ${record.serviceField} project is available. Be the first to claim it!`,
      link: `/portal/projects`,
    }).catch(() => {});
  }

  return record;
}

/**
 * Get all available project requests matching a client's professional field.
 * Only returns projects with status === 'available'.
 */
async function getAvailableForClient(user) {
  const userId = user._id || user.uid || user.id;
  let professionalField = user.professionalField || '';

  // 1. If not on user object, fetch fresh from DB by ID and by email
  if (!professionalField && userId) {
    const clientDoc = await firestoreService.getById('users', userId).catch(() => null);
    if (clientDoc?.professionalField) {
      professionalField = clientDoc.professionalField;
    }
  }

  if (!professionalField && user.email) {
    const byEmail = await firestoreService.findOne('users', (ref) =>
      ref.where('email', '==', user.email.toLowerCase().trim())
    ).catch(() => null);
    if (byEmail?.professionalField) {
      professionalField = byEmail.professionalField;
    }
  }

  if (!professionalField) {
    return {
      items: [],
      field: null,
      message: 'Set your professional field in your profile to see matching projects.',
    };
  }

  // 2. Fetch all available project requests (avoids composite index requirements)
  const requests = await firestoreService.find('projectRequests', (ref) =>
    ref.where('status', '==', 'available')
  );

  // 3. Robust case-insensitive and trimmed matching
  const clientFieldNorm = professionalField.trim().toLowerCase();

  const matching = requests.filter((r) => {
    const reqFieldNorm = (r.serviceField || r.category || '').trim().toLowerCase();
    if (!reqFieldNorm) return false;
    return (
      reqFieldNorm === clientFieldNorm ||
      reqFieldNorm.includes(clientFieldNorm) ||
      clientFieldNorm.includes(reqFieldNorm)
    );
  });

  // Sort newest first
  matching.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Strip sensitive customer data from available (unclaimed) projects
  const safe = matching.map((r) => ({
    _id: r._id,
    id: r._id,
    projectTitle: r.projectTitle || r.name,
    projectDescription: r.projectDescription || r.description,
    serviceField: r.serviceField || r.category || professionalField,
    goals: r.goals || '',
    budget: r.budget || '',
    deadline: r.deadline || r.dueDate || null,
    additionalRequirements: r.additionalRequirements || '',
    status: r.status,
    createdAt: r.createdAt,
  }));

  return { items: safe, field: professionalField, total: safe.length };
}

function toSafeDate(d, defaultOffsetDays = 30) {
  if (!d) return new Date(Date.now() + defaultOffsetDays * 24 * 60 * 60 * 1000);
  if (d instanceof Date && !isNaN(d.getTime())) return d;
  if (d && typeof d.toDate === 'function') return d.toDate();
  if (d && typeof d._seconds === 'number') return new Date(d._seconds * 1000);
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date(Date.now() + defaultOffsetDays * 24 * 60 * 60 * 1000);
}

/**
 * Atomically claim a project request.
 * Uses a Firestore transaction to ensure only one client can claim.
 */
async function claimProject(requestId, user) {
  if (!db) throw ApiError.internal('Database not available');

  const userId = user._id || user.uid || user.id;
  const docRef = db.collection('projectRequests').doc(requestId);

  let claimed = null;

  try {
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (!snap.exists) {
        throw new Error('NOT_FOUND');
      }

      const data = snap.data();

      if (data.status !== 'available') {
        throw new Error('ALREADY_CLAIMED');
      }

      // Atomically claim
      transaction.update(docRef, {
        status: 'claimed',
        claimedBy: userId,
        claimedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      claimed = { ...data, _id: snap.id, id: snap.id };
    });
  } catch (err) {
    if (err.message === 'NOT_FOUND') {
      throw ApiError.notFound('Project request not found');
    }
    if (err.message === 'ALREADY_CLAIMED') {
      throw ApiError.conflict('This project has already been claimed by another client.');
    }
    throw err;
  }

  const targetDueDate = toSafeDate(claimed.deadline, 30);
  const now = new Date();

  // After successful claim: create the actual project in the projects collection
  const projectData = {
    name: claimed.projectTitle,
    slug: (claimed.projectTitle || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    description: claimed.projectDescription || '',
    client: userId,
    clientId: userId,
    claimedBy: userId,
    claimedAt: now,
    category: claimed.serviceField,
    serviceField: claimed.serviceField,
    status: 'in_progress',
    progress: 0,
    progressMode: 'task_based',
    autoComplete: true,
    isPublic: false,
    isArchived: false,
    startDate: now,
    dueDate: targetDueDate,
    projectRequestId: requestId,
    customerName: claimed.customerName || '',
    customerEmail: claimed.customerEmail || '',
    goals: claimed.goals || '',
    budget: claimed.budget || '',
    additionalRequirements: claimed.additionalRequirements || '',
    milestones: [
      {
        _id: 'ms_' + Date.now() + '_1',
        id: 'ms_' + Date.now() + '_1',
        name: 'Phase 1: Project Kickoff & Discovery',
        description: 'Review project brief, align on requirements, and prepare initial plan.',
        status: 'in_progress',
        order: 1,
        weight: 1,
        progress: 0,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'ms_' + Date.now() + '_2',
        id: 'ms_' + Date.now() + '_2',
        name: 'Phase 2: Development & Implementation',
        description: 'Core development and feature implementation.',
        status: 'pending',
        order: 2,
        weight: 2,
        progress: 0,
        dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        _id: 'ms_' + Date.now() + '_3',
        id: 'ms_' + Date.now() + '_3',
        name: 'Phase 3: Review & Delivery',
        description: 'Final review, testing, and project delivery.',
        status: 'pending',
        order: 3,
        weight: 1,
        progress: 0,
        dueDate: targetDueDate,
      },
    ],
  };

  const socketService = require('./socketService');

  let project;
  try {
    project = await firestoreService.create('projects', projectData);
  } catch (createErr) {
    // Rollback: reset projectRequest to 'available' so it can be claimed again
    await firestoreService.update('projectRequests', requestId, {
      status: 'available',
      claimedBy: null,
      claimedAt: null,
    }).catch(() => {});
    logger.error(`Project creation failed for request ${requestId}, rolled back claim:`, createErr.message);
    throw ApiError.internal('Failed to create project workspace. Please try again.');
  }

  // Create initial tasks
  await firestoreService.create('tasks', {
    title: 'Review Project Brief & Requirements',
    description: `Review the submitted brief for ${claimed.serviceField} project "${claimed.projectTitle}" and align on scope and deliverables.`,
    project: project._id,
    client: userId,
    clientId: userId,
    status: 'in_progress',
    priority: 'high',
    weight: 1,
    order: 1,
    visibleToClient: true,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  }).catch(() => {});

  await firestoreService.create('tasks', {
    title: 'Prepare Kickoff Deliverables',
    description: `Prepare initial architecture, design tokens, and project milestones for "${claimed.projectTitle}".`,
    project: project._id,
    client: userId,
    clientId: userId,
    status: 'pending',
    priority: 'medium',
    weight: 1,
    order: 2,
    visibleToClient: true,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }).catch(() => {});

  // Log activity
  await firestoreService.create('progressHistory', {
    project: project._id,
    previousProgress: 0,
    newProgress: 0,
    changedBy: userId,
    reason: `Project claimed: You successfully claimed the ${claimed.projectTitle} project.`,
  }).catch(() => {});

  // Update the project request with the project ID
  await firestoreService.update('projectRequests', requestId, {
    projectId: project._id,
    status: 'claimed',
  }).catch(() => {});

  // Notify the claiming client
  await notify({
    user: userId,
    type: 'project_claimed',
    title: 'Project Claimed',
    body: `You successfully claimed the ${claimed.projectTitle} project.`,
    link: `/portal/projects/${project._id}`,
  }).catch(() => {});

  // Notify staff
  await notifyStaff({
    type: 'project_claimed_staff',
    title: `Project Claimed: ${claimed.projectTitle}`,
    body: `${user.name} claimed the ${claimed.serviceField} project.`,
    link: `/admin/projects/${project._id}`,
  }).catch(() => {});

  // Emit real-time socket event to the claiming client AFTER confirmed DB creation
  try {
    socketService.emitToUser(userId, 'project:claimed', {
      projectId: project._id,
      clientId: userId,
      project,
    });
  } catch (socketErr) {
    // Socket emit failure must never block the HTTP response
    logger.warn('project:claimed socket emit failed:', socketErr.message);
  }

  logger.info(`Project request ${requestId} claimed by ${userId}, project created: ${project._id}`);

  return { projectRequest: { ...claimed, status: 'claimed', claimedBy: userId }, project };
}

/**
 * Admin: list all project requests with optional filters.
 */
async function adminList(filters = {}) {
  const { page, limit, skip } = getPagination(filters);

  const items = await firestoreService.find('projectRequests', (ref) => {
    let q = ref;
    if (filters.status) q = q.where('status', '==', filters.status);
    if (filters.serviceField) q = q.where('serviceField', '==', filters.serviceField);
    return q;
  });

  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Populate claimedBy user info
  const populated = await Promise.all(items.map(async (req) => {
    if (req.claimedBy) {
      const clientDoc = await firestoreService.getById('users', req.claimedBy).catch(() => null);
      return {
        ...req,
        claimedByUser: clientDoc ? { _id: clientDoc._id, name: clientDoc.name, email: clientDoc.email } : null,
      };
    }
    return req;
  }));

  const total = populated.length;
  const paginated = populated.slice(skip, skip + limit);
  return { items: paginated, meta: buildMeta({ page, limit, total }) };
}

/**
 * Admin: get single project request by ID.
 */
async function adminGetById(id) {
  const req = await firestoreService.getById('projectRequests', id);
  if (!req) throw ApiError.notFound('Project request not found');

  if (req.claimedBy) {
    const clientDoc = await firestoreService.getById('users', req.claimedBy).catch(() => null);
    req.claimedByUser = clientDoc ? { _id: clientDoc._id, name: clientDoc.name, email: clientDoc.email, professionalField: clientDoc.professionalField } : null;
  }

  return req;
}

/**
 * Admin: update project request status.
 */
async function adminUpdate(id, payload) {
  const record = await firestoreService.getById('projectRequests', id);
  if (!record) throw ApiError.notFound('Project request not found');
  const updated = await firestoreService.update('projectRequests', id, payload);
  return updated;
}

module.exports = {
  submitRequest,
  getAvailableForClient,
  claimProject,
  adminList,
  adminGetById,
  adminUpdate,
};
