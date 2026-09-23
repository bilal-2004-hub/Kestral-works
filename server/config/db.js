/**
 * Database module — Firebase/Firestore is the sole database for this project.
 * MongoDB has been removed. This file is kept as a no-op stub so that any
 * lingering imports do not crash the server.
 *
 * Firebase Admin (and Firestore) is initialized automatically on module load
 * in config/firebaseAdmin.js.
 */
const logger = require('../utils/logger');

async function connectDatabase() {
  logger.info('Database: Firebase/Firestore (no MongoDB connection required)');
}

module.exports = { connectDatabase };
