require('./env');
const { initializeApp, getApps, getApp, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

let isInitialized = false;
let appInstance = null;
let authInstance = null;
let firestoreInstance = null;
let storageInstance = null;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    appInstance = getApp();
    isInitialized = true;
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    return appInstance;
  }

  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_STORAGE_BUCKET,
    GOOGLE_APPLICATION_CREDENTIALS,
  } = process.env;

  let credential = null;

  // 1. Check Service Account Path from env
  const serviceAccountFile = FIREBASE_SERVICE_ACCOUNT_PATH || GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountFile) {
    const resolvedPath = path.isAbsolute(serviceAccountFile)
      ? serviceAccountFile
      : path.join(__dirname, '..', serviceAccountFile);

    if (fs.existsSync(resolvedPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        credential = cert(serviceAccount);
        logger.info(`Firebase Admin initialized using service account file: ${resolvedPath}`);
      } catch (err) {
        logger.error(`Error reading Firebase service account file: ${err.message}`);
      }
    } else {
      logger.warn(`Firebase service account file not found at: ${resolvedPath}`);
    }
  }

  // 2. Check Direct Environment Variables (Client Email + Private Key)
  if (!credential && FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    try {
      const formattedPrivateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      credential = cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      });
      logger.info(`Firebase Admin initialized using environment variables for project: ${FIREBASE_PROJECT_ID}`);
    } catch (err) {
      logger.error(`Error initializing Firebase credentials from env vars: ${err.message}`);
    }
  }

  // 3. Application Default Credentials fallback
  if (!credential) {
    try {
      credential = applicationDefault();
      logger.info('Firebase Admin attempting Application Default Credentials');
    } catch (err) {
      logger.warn('No valid Firebase credentials provided. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH in server/.env');
    }
  }

  const options = {};
  if (credential) {
    options.credential = credential;
  }
  if (FIREBASE_PROJECT_ID) {
    options.projectId = FIREBASE_PROJECT_ID;
  }
  if (FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = FIREBASE_STORAGE_BUCKET;
  }

  try {
    appInstance = initializeApp(options);
    isInitialized = true;
    authInstance = getAuth(appInstance);
    firestoreInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);

    // Configure Firestore settings
    firestoreInstance.settings({ ignoreUndefinedProperties: true });

    logger.info('Firebase Admin SDK successfully initialized');
    return appInstance;
  } catch (err) {
    logger.error(`Failed to initialize Firebase Admin SDK: ${err.message}`);
    return null;
  }
}

// Initial attempt on module load
initializeFirebaseAdmin();

module.exports = {
  get app() {
    return appInstance;
  },
  get auth() {
    if (!authInstance && getApps().length > 0) authInstance = getAuth(getApp());
    return authInstance;
  },
  get db() {
    if (!firestoreInstance && getApps().length > 0) firestoreInstance = getFirestore(getApp());
    return firestoreInstance;
  },
  get storage() {
    if (!storageInstance && getApps().length > 0) storageInstance = getStorage(getApp());
    return storageInstance;
  },
  get isConfigured() {
    const {
      FIREBASE_PROJECT_ID,
      FIREBASE_SERVICE_ACCOUNT_PATH,
      GOOGLE_APPLICATION_CREDENTIALS,
      FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY,
    } = process.env;
    const hasCreds = Boolean(
      FIREBASE_PROJECT_ID ||
      FIREBASE_SERVICE_ACCOUNT_PATH ||
      GOOGLE_APPLICATION_CREDENTIALS ||
      (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY)
    );
    return isInitialized && getApps().length > 0 && hasCreds;
  },
  FieldValue,
  Timestamp,
  initializeFirebaseAdmin,
};
