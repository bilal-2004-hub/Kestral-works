const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notify, notifyStaff } = require('../services/notification.service');
const progressService = require('../services/progressService');
const { auth, isConfigured } = require('../config/firebaseAdmin');
const { bcryptRounds } = require('../config/env');

exports.create = asyncHandler(async (req, res) => {
  // Honeypot: real visitors never fill a hidden field.
  if (req.body.website) return created(res, { message: 'Thanks — we will be in touch shortly' });

  const { name, email, company, phone, service, budget, timeline, message } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  // 1. Identify or auto-provision client user record
  let clientUser = null;
  if (req.user) {
    clientUser = req.user;
  } else if (normalizedEmail) {
    clientUser = await firestoreService.findOne('users', (ref) => ref.where('email', '==', normalizedEmail));
    if (!clientUser) {
      let uid = null;
      if (isConfigured && auth) {
        try {
          const fbUser = await auth.getUserByEmail(normalizedEmail);
          if (fbUser) uid = fbUser.uid;
        } catch {}
      }
      if (!uid) {
        uid = 'client_' + Date.now();
      }
      const defaultHash = await bcrypt.hash('ClientPass123!', bcryptRounds || 10);
      clientUser = await firestoreService.set('users', uid, {
        _id: uid,
        id: uid,
        uid,
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        role: 'client',
        company: company || '',
        phone: phone || '',
        isActive: true,
        isLead: true,
        passwordHash: defaultHash,
      });
    }
  }

  const clientId = clientUser ? (clientUser._id || clientUser.uid || clientUser.id) : null;

  // 2. Store contact / brief record
  const messageData = {
    ...req.body,
    client: clientId,
    ip: req.ip,
    createdAt: new Date(),
  };
  const contactRecord = await firestoreService.create('contactMessages', messageData);

  // Also create a projectRequests record so registered clients in this field can see & claim it
  if (service && name && email) {
    await firestoreService.create('projectRequests', {
      customerName: name.trim(),
      customerEmail: normalizedEmail,
      customerPhone: phone || '',
      companyName: company || '',
      projectTitle: `${service} for ${name || company || 'Client'}`,
      projectDescription: message || `Contact enquiry for ${service}`,
      serviceField: service,
      budget: budget || '',
      deadline: timeline || null,
      status: 'available',
      claimedBy: null,
      claimedAt: null,
      contactMessageId: contactRecord?._id || null,
    }).catch(() => {});
  }

  let project = null;
  let task1 = null;
  let task2 = null;

  // 3. Automatically generate Project, Milestones, and Initial Deliverable Tasks for the client
  if (clientId) {
    const projectName = service
      ? `${service} — ${name || company || 'Client'}`
      : `Project Briefing — ${name || company || 'Client'}`;
    const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const projectData = {
      name: projectName,
      slug,
      description: message
        ? `${message}\n\n[Budget: ${budget || 'Flexible'}] [Timeline: ${timeline || 'Flexible'}]`
        : `Initial project brief submitted via website.`,
      client: clientId,
      category: service || 'Web Application',
      status: 'planning',
      progress: 0,
      progressMode: 'task_based',
      autoComplete: true,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      technologies: ['Discovery', 'Architecture Scoping'],
      milestones: [
        {
          _id: 'ms_' + Date.now() + '_1',
          id: 'ms_' + Date.now() + '_1',
          name: 'Phase 1: Technical Discovery & Architecture Blueprint',
          description: 'Review project brief, technical specifications, and prepare initial architecture blueprint.',
          status: 'in_progress',
          order: 1,
          weight: 1,
          progress: 0,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          _id: 'ms_' + Date.now() + '_2',
          id: 'ms_' + Date.now() + '_2',
          name: 'Phase 2: Sprint Scoping & Milestones',
          description: 'Finalize technical scope, deliverable breakdown, and sprint timeline.',
          status: 'pending',
          order: 2,
          weight: 1,
          progress: 0,
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        },
        {
          _id: 'ms_' + Date.now() + '_3',
          id: 'ms_' + Date.now() + '_3',
          name: 'Phase 3: Production Implementation',
          description: 'Full-scale engineering development and milestone delivery.',
          status: 'pending',
          order: 3,
          weight: 2,
          progress: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
      isPublic: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    project = await firestoreService.create('projects', projectData);

    // 4. Generate Onboarding Tasks for the client
    task1 = await firestoreService.create('tasks', {
      title: 'Review Project Briefing & Technical Specifications',
      description: `Our systems leads are analyzing your submitted brief for ${service || 'custom development'} to prepare initial architectural insights and technical scope.`,
      project: project._id,
      client: clientId,
      status: 'in_progress',
      priority: 'high',
      weight: 1,
      order: 1,
      visibleToClient: true,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    task2 = await firestoreService.create('tasks', {
      title: 'Exploratory Consultation & Discovery Alignment',
      description: `Participate in initial technical consultation to review recommended architecture, deliverable milestones, and budget plan.`,
      project: project._id,
      client: clientId,
      status: 'pending',
      priority: 'medium',
      weight: 1,
      order: 2,
      visibleToClient: true,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Log initial progress activity
    await firestoreService.create('progressHistory', {
      project: project._id,
      previousProgress: 0,
      newProgress: 0,
      reason: 'Project initialized from submitted website brief',
      createdAt: new Date(),
    }).catch(() => {});

    // 6. Notify Client
    await notify({
      user: clientId,
      type: 'project_assigned',
      title: `Briefing Delivered: ${project.name}`,
      body: 'Your brief has been delivered. Discovery milestones and initial review tasks have been generated in your workspace.',
      link: `/portal/projects/${project._id}`,
    }).catch(() => {});

    // 7. Emit Realtime Events
    progressService.emitProjectUpdate(project._id, { project, task: task1 });
  }

  // 8. Notify Staff / Studio Admins
  await notifyStaff({
    type: 'contact_new',
    title: `New brief from ${name || normalizedEmail}`,
    body: service ? `${service} — ${company || normalizedEmail}` : normalizedEmail,
    link: project ? `/admin/projects/${project._id}` : '/admin/messages',
  }).catch(() => {});

  created(res, {
    message: 'Thanks — your brief has been delivered and your client workspace has been initialized.',
    data: {
      contactId: contactRecord._id,
      projectId: project?._id,
      clientId,
    },
  });
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
