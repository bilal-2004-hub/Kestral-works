/**
 * Seed script for Kestral-Works.
 *
 * Database: Firebase/Firestore (sole database).
 * MongoDB has been removed.
 *
 * Runs the Firestore seeder.
 */
require('dotenv').config();
const { seedFirestore } = require('./seedFirestore');
const logger = require('../utils/logger');

async function seedDatabase() {
  return seedFirestore();
}

if (require.main === module) {
  seedFirestore()
    .then(() => {
      logger.info('Database seeded successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Failed to seed database:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
