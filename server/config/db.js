const mongoose = require('mongoose');
const { mongoUri, env } = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

let mongodInstance = null;

async function connectDatabase() {
  let connected = false;
  let targetUri = mongoUri;

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000,
      maxPoolSize: 20,
    });
    if (env !== 'test') logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    connected = true;
    return conn;
  } catch (err) {
    logger.warn(`Could not connect to MongoDB at ${targetUri} (${err.message}). Attempting in-memory fallback...`);
  }

  // If initial connection failed in non-production, launch MongoMemoryServer
  if (!connected) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      targetUri = mongodInstance.getUri();
      
      const conn = await mongoose.connect(targetUri, {
        maxPoolSize: 20,
      });
      logger.info(`In-memory MongoDB started and connected: ${targetUri}`);
      
      // Auto seed if users collection is empty
      const User = require('../models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        logger.info('Database is empty. Automatically applying initial seed data...');
        const { seedDatabase } = require('../scripts/seed');
        await seedDatabase(false);
      }
      return conn;
    } catch (fallbackErr) {
      logger.error('Failed to initialize in-memory MongoDB fallback:', fallbackErr);
      throw fallbackErr;
    }
  }
}

module.exports = { connectDatabase };
