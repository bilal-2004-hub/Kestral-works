const firestore = require('../services/firestore.service');

async function sync() {
  try {
    const requests = await firestore.find('projectRequests', (ref) => ref.where('status', '==', 'claimed'));
    console.log('Found claimed requests:', requests.length);

    for (const req of requests) {
      let project = null;
      if (req.projectId) {
        project = await firestore.getById('projects', req.projectId);
      }
      if (!project) {
        const match = await firestore.findOne('projects', (ref) => ref.where('projectRequestId', '==', req._id));
        if (match) project = match;
      }

      if (!project && req.claimedBy) {
        console.log(`Creating missing project for request ${req._id} (${req.projectTitle}) claimedBy ${req.claimedBy}`);
        const now = new Date();
        const targetDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const projectData = {
          name: req.projectTitle,
          slug: (req.projectTitle || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          description: req.projectDescription || '',
          client: req.claimedBy,
          category: req.serviceField,
          serviceField: req.serviceField,
          status: 'planning',
          progress: 0,
          progressMode: 'task_based',
          autoComplete: true,
          isPublic: false,
          isArchived: false,
          startDate: now,
          dueDate: targetDueDate,
          projectRequestId: req._id,
          customerName: req.customerName || '',
          customerEmail: req.customerEmail || '',
          goals: req.goals || '',
          budget: req.budget || '',
          additionalRequirements: req.additionalRequirements || '',
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

        project = await firestore.create('projects', projectData);
        console.log('Created project:', project._id);

        await firestore.create('tasks', {
          title: 'Review Project Brief & Requirements',
          description: `Review the submitted brief for ${req.serviceField} project "${req.projectTitle}" and align on scope and deliverables.`,
          project: project._id,
          client: req.claimedBy,
          status: 'in_progress',
          priority: 'high',
          weight: 1,
          order: 1,
          visibleToClient: true,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });

        await firestore.update('projectRequests', req._id, {
          projectId: project._id,
        });
      } else {
        console.log(`Project already exists for request ${req._id}: ${project?._id}`);
      }
    }
    console.log('Sync finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error in sync:', err);
    process.exit(1);
  }
}

sync();
