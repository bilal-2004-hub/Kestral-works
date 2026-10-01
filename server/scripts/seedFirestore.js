require('../config/env');
const bcrypt = require('bcryptjs');
const { auth, db, isConfigured, Timestamp } = require('../config/firebaseAdmin');
const logger = require('../utils/logger');

const bcryptRounds = 10;

async function seedFirestore() {
  if (!isConfigured || !db) {
    logger.error('Firebase Admin is not configured. Please set your Firebase credentials in server/.env first.');
    return;
  }

  logger.info('Starting Firestore database seeding...');

  // 1. Create or sync Users
  const usersToSeed = [
    {
      uid: 'admin_studio_kestrel',
      name: 'Studio Admin',
      email: 'admin@kestrel.dev',
      role: 'admin',
      position: 'Operations',
      company: 'Kestrel Studio',
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
      isActive: true,
    },
    {
      uid: 'client_ayesha_northwind',
      name: 'Ayesha Malik',
      email: 'ayesha@northwind.co',
      role: 'client',
      company: 'Northwind Foods',
      phone: '+92 300 1234567',
      password: 'ClientPass123!',
      isActive: true,
    },
    {
      uid: 'client_daniel_lumen',
      name: 'Daniel Ortiz',
      email: 'daniel@lumen.io',
      role: 'client',
      company: 'Lumen Analytics',
      password: 'ClientPass123!',
      isActive: true,
    },
  ];

  for (const u of usersToSeed) {
    const rawPassword = u.password || 'ClientPass123!';
    const passwordHash = await bcrypt.hash(rawPassword, bcryptRounds);

    // Optionally create in Firebase Auth if auth is available
    try {
      if (auth) {
        try {
          const existingUser = await auth.getUserByEmail(u.email);
          await auth.updateUser(existingUser.uid, { password: rawPassword, displayName: u.name });
        } catch (notFound) {
          await auth.createUser({
            uid: u.uid,
            email: u.email,
            password: rawPassword,
            displayName: u.name,
          });
          // Set custom claims for role
          await auth.setCustomUserClaims(u.uid, { role: u.role });
          logger.info(`Created Firebase Auth user: ${u.email}`);
        }
      }
    } catch (err) {
      logger.warn(`Could not sync Auth for ${u.email}: ${err.message}`);
    }

    const { password: _p, ...userData } = u;

    // Write user profile to Firestore (including passwordHash)
    await db.collection('users').doc(u.uid).set(
      {
        ...userData,
        passwordHash,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );
    logger.info(`Seeded Firestore user: ${u.email} (${u.uid})`);
  }

  // 2. Create demo Projects
  const now = Date.now();
  const project1Id = 'proj_northwind_storefront';
  const project2Id = 'proj_lumen_dashboard';
  const project3Id = 'proj_northwind_mobile';

  await db.collection('projects').doc(project1Id).set(
    {
      name: 'Northwind storefront rebuild',
      slug: 'northwind-storefront-rebuild',
      client: 'client_ayesha_northwind',
      manager: 'admin_studio_kestrel',
      description: 'Replatforming the Northwind Foods store onto a headless stack with same-day delivery slots.',
      category: 'E-commerce Development',
      technologies: ['React', 'Node.js', 'Firebase', 'Stripe'],
      status: 'in_progress',
      progress: 62,
      progressMode: 'task_based',
      autoComplete: true,
      isPublic: true,
      isArchived: false,
      startDate: Timestamp.fromDate(new Date(now - 864e5 * 20)),
      dueDate: Timestamp.fromDate(new Date(now + 864e5 * 40)),
      milestones: [
        {
          _id: 'm1',
          id: 'm1',
          name: 'Phase 1: Architecture & UX Wireframes',
          status: 'completed',
          order: 1,
          dueDate: Timestamp.fromDate(new Date(now - 864e5 * 15)),
          completedAt: Timestamp.fromDate(new Date(now - 864e5 * 15)),
        },
        {
          _id: 'm2',
          id: 'm2',
          name: 'Phase 2: Payment & Cart Engine',
          status: 'in_progress',
          order: 2,
          dueDate: Timestamp.fromDate(new Date(now + 864e5 * 10)),
        },
        {
          _id: 'm3',
          id: 'm3',
          name: 'Phase 3: Real-Time Order Tracking & Launch',
          status: 'pending',
          order: 3,
          dueDate: Timestamp.fromDate(new Date(now + 864e5 * 35)),
        },
      ],
      createdAt: Timestamp.fromDate(new Date(now - 864e5 * 20)),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  await db.collection('projects').doc(project2Id).set(
    {
      name: 'Lumen reporting dashboard',
      slug: 'lumen-reporting-dashboard',
      client: 'client_daniel_lumen',
      manager: 'admin_studio_kestrel',
      description: 'A reporting workspace that turns warehouse queries into shareable dashboards.',
      category: 'Software Development',
      technologies: ['React', 'Express', 'Firebase', 'D3'],
      status: 'completed',
      progress: 100,
      progressMode: 'task_based',
      autoComplete: true,
      isPublic: true,
      isArchived: false,
      completedAt: Timestamp.now(),
      createdAt: Timestamp.fromDate(new Date(now - 864e5 * 60)),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  await db.collection('projects').doc(project3Id).set(
    {
      name: 'Northwind mobile companion',
      slug: 'northwind-mobile-companion',
      client: 'client_ayesha_northwind',
      manager: 'admin_studio_kestrel',
      description: 'A companion app for order tracking and repeat purchases.',
      category: 'Mobile App Development',
      technologies: ['React Native', 'Node.js', 'Firebase'],
      status: 'planning',
      progress: 8,
      progressMode: 'task_based',
      autoComplete: true,
      isPublic: false,
      isArchived: false,
      createdAt: Timestamp.fromDate(new Date(now - 864e5 * 5)),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  // 3. Create demo Tasks
  const tasks = [
    {
      id: 'task_1',
      title: 'Checkout flow wireframes',
      description: 'Complete high-fidelity wireframes for checkout with card tokenization',
      project: project1Id,
      createdBy: 'admin_studio_kestrel',
      status: 'completed',
      priority: 'high',
      weight: 1,
      visibleToClient: true,
    },
    {
      id: 'task_2',
      title: 'Payment gateway integration',
      description: 'Integrate Stripe and webhook event listeners',
      project: project1Id,
      createdBy: 'admin_studio_kestrel',
      status: 'in_progress',
      priority: 'urgent',
      weight: 2,
      visibleToClient: true,
      dueDate: Timestamp.fromDate(new Date(now + 864e5 * 7)),
    },
    {
      id: 'task_3',
      title: 'Delivery slot picker review',
      description: 'Review same-day slots logic with Northwind dispatch team',
      project: project1Id,
      createdBy: 'admin_studio_kestrel',
      status: 'review',
      priority: 'medium',
      weight: 1,
      visibleToClient: true,
    },
    {
      id: 'task_4',
      title: 'Warehouse query builder',
      description: 'Design visual query generator for SQL data extracts',
      project: project2Id,
      createdBy: 'admin_studio_kestrel',
      status: 'completed',
      priority: 'high',
      weight: 1,
      visibleToClient: true,
    },
    {
      id: 'task_5',
      title: 'Discovery workshop',
      description: 'Gather stakeholder requirements for mobile app release',
      project: project3Id,
      createdBy: 'admin_studio_kestrel',
      status: 'pending',
      priority: 'medium',
      weight: 1,
      visibleToClient: true,
    },
  ];

  for (const t of tasks) {
    const { id, ...data } = t;
    await db.collection('tasks').doc(id).set(
      {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  // 4. Create demo Review
  await db.collection('reviews').doc('rev_daniel_1').set(
    {
      client: 'client_daniel_lumen',
      project: project2Id,
      rating: 5,
      title: 'Shipped ahead of schedule',
      body: 'The team scoped the work honestly, flagged risks early and handed over a codebase our engineers could read on day one.',
      status: 'approved',
      moderatedBy: 'admin_studio_kestrel',
      moderatedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  // 5. Progress History log
  await db.collection('progressHistory').doc('hist_1').set(
    {
      project: project1Id,
      previousProgress: 40,
      newProgress: 62,
      changedBy: 'admin_studio_kestrel',
      reason: 'Completed wireframes and advanced cart engine',
      createdAt: Timestamp.now(),
    },
    { merge: true }
  );

  // 6. Client Logins table (client portal login audit log)
  const clientLogins = [
    {
      id: 'login_ayesha_1',
      userId: 'client_ayesha_northwind',
      name: 'Ayesha Malik',
      email: 'ayesha@northwind.co',
      company: 'Northwind Foods',
      role: 'client',
      portal: 'client_portal',
      loginMethod: 'email_password',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'success',
      loginAt: Timestamp.fromDate(new Date(now - 864e5 * 2)),
      createdAt: Timestamp.fromDate(new Date(now - 864e5 * 2)),
      updatedAt: Timestamp.fromDate(new Date(now - 864e5 * 2)),
    },
    {
      id: 'login_daniel_1',
      userId: 'client_daniel_lumen',
      name: 'Daniel Ortiz',
      email: 'daniel@lumen.io',
      company: 'Lumen Analytics',
      role: 'client',
      portal: 'client_portal',
      loginMethod: 'firebase_auth',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      status: 'success',
      loginAt: Timestamp.fromDate(new Date(now - 864e5 * 1)),
      createdAt: Timestamp.fromDate(new Date(now - 864e5 * 1)),
      updatedAt: Timestamp.fromDate(new Date(now - 864e5 * 1)),
    },
  ];

  for (const log of clientLogins) {
    const { id, ...logData } = log;
    await db.collection('clientLogins').doc(id).set(logData, { merge: true });
    logger.info(`Seeded client login log in Firestore: ${log.email} (${id})`);
  }

  logger.info('Firestore seeding completed successfully! 🎉');
}

if (require.main === module) {
  seedFirestore()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Error seeding Firestore:', err);
      process.exit(1);
    });
}

module.exports = { seedFirestore };
