/* Seeds an admin, two demo clients, projects, tasks and an approved review.
   Run with: npm run seed   (safe to re-run: it clears the demo data first) */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Review = require('../models/Review');
const logger = require('../utils/logger');

async function seedDatabase(shouldClose = false) {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@kestrel.dev';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  await Promise.all([
    User.deleteMany({ email: { $in: [adminEmail, 'ayesha@northwind.co', 'daniel@lumen.io'] } }),
  ]);

  const admin = await User.create({
    name: 'Studio Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    position: 'Operations',
  });

  const [ayesha, daniel] = await User.create([
    {
      name: 'Ayesha Malik',
      email: 'ayesha@northwind.co',
      password: 'ClientPass123!',
      role: 'client',
      company: 'Northwind Foods',
      phone: '+92 300 1234567',
    },
    {
      name: 'Daniel Ortiz',
      email: 'daniel@lumen.io',
      password: 'ClientPass123!',
      role: 'client',
      company: 'Lumen Analytics',
    },
  ]);

  await Project.deleteMany({ client: { $in: [ayesha._id, daniel._id] } });

  const projects = await Project.create([
    {
      name: 'Northwind storefront rebuild',
      client: ayesha._id,
      manager: admin._id,
      description: 'Replatforming the Northwind Foods store onto a headless stack with same-day delivery slots.',
      category: 'E-commerce Development',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      status: 'in_progress',
      progress: 62,
      isPublic: true,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40),
      milestones: [
        { name: 'Phase 1: Architecture & UX Wireframes', status: 'completed', order: 1, dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), completedAt: new Date() },
        { name: 'Phase 2: Payment & Cart Engine', status: 'in_progress', order: 2, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10) },
        { name: 'Phase 3: Real-Time Order Tracking & Launch', status: 'pending', order: 3, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35) },
      ],
    },
    {
      name: 'Lumen reporting dashboard',
      client: daniel._id,
      manager: admin._id,
      description: 'A reporting workspace that turns warehouse queries into shareable dashboards.',
      category: 'Software Development',
      technologies: ['React', 'Express', 'MongoDB', 'D3'],
      status: 'completed',
      progress: 100,
      isPublic: true,
      completedAt: new Date(),
      milestones: [
        { name: 'Database Schemas & API Layer', status: 'completed', order: 1, completedAt: new Date() },
        { name: 'Interactive Charts & Analytics Grid', status: 'completed', order: 2, completedAt: new Date() },
        { name: 'Client Handover & Production Deploy', status: 'completed', order: 3, completedAt: new Date() },
      ],
    },
    {
      name: 'Northwind mobile companion',
      client: ayesha._id,
      manager: admin._id,
      description: 'A companion app for order tracking and repeat purchases.',
      category: 'Mobile App Development',
      technologies: ['React Native', 'Node.js'],
      status: 'planning',
      progress: 8,
      milestones: [
        { name: 'Discovery & Product Scope', status: 'in_progress', order: 1, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
        { name: 'Mobile Prototypes & API Integration', status: 'pending', order: 2, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
      ],
    },
  ]);

  await Task.deleteMany({ project: { $in: projects.map((p) => p._id) } });
  await Task.create([
    { title: 'Checkout flow wireframes', project: projects[0]._id, createdBy: admin._id, status: 'completed', priority: 'high' },
    { title: 'Payment gateway integration', project: projects[0]._id, createdBy: admin._id, status: 'in_progress', priority: 'urgent', dueDate: new Date(Date.now() + 6e8) },
    { title: 'Delivery slot picker review', project: projects[0]._id, createdBy: admin._id, status: 'review', priority: 'medium' },
    { title: 'Warehouse query builder', project: projects[1]._id, createdBy: admin._id, status: 'completed', priority: 'high' },
    { title: 'Discovery workshop', project: projects[2]._id, createdBy: admin._id, status: 'pending', priority: 'medium' },
  ]);

  await Review.deleteMany({ client: daniel._id });
  await Review.create({
    client: daniel._id,
    project: projects[1]._id,
    rating: 5,
    title: 'Shipped ahead of schedule',
    body: 'The team scoped the work honestly, flagged risks early and handed over a codebase our engineers could read on day one.',
    status: 'approved',
    moderatedBy: admin._id,
    moderatedAt: new Date(),
  });

  logger.info(`Seeded successfully! Admin: ${adminEmail} / ${adminPassword}`);
  logger.info('Client logins: ayesha@northwind.co and daniel@lumen.io / ClientPass123!');

  if (shouldClose) {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  const { connectDatabase } = require('../config/db');
  connectDatabase()
    .then(() => seedDatabase(true))
    .catch((err) => {
      logger.error(err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
