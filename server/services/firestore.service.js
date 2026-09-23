const { db, isConfigured, Timestamp, FieldValue } = require('../config/firebaseAdmin');
const logger = require('../utils/logger');

/**
 * Recursively converts Firestore Timestamps into JavaScript Date objects.
 */
function convertTimestamps(data) {
  if (!data || typeof data !== 'object') return data;
  if (data instanceof Timestamp || (data._seconds !== undefined && data._nanoseconds !== undefined)) {
    return data.toDate ? data.toDate() : new Date(data._seconds * 1000);
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = convertTimestamps(value);
  }
  return result;
}

/**
 * Normalizes a document snapshot so it has both `id` and `_id` for backward compatibility.
 */
function formatSnapshot(doc) {
  if (!doc.exists) return null;
  const data = convertTimestamps(doc.data());
  return {
    _id: doc.id,
    id: doc.id,
    ...data,
  };
}

/**
 * Fetches a single document by ID from a collection.
 */
async function getById(collection, id) {
  if (!isConfigured || !db || !id) return null;
  const docRef = db.collection(collection).doc(id.toString());
  const snapshot = await docRef.get();
  return formatSnapshot(snapshot);
}

/**
 * Creates a new document in a collection.
 */
async function create(collection, data, customId = null) {
  if (!isConfigured || !db) throw new Error('Firestore is not initialized');
  const cleanData = { ...data };
  delete cleanData._id;
  delete cleanData.id;

  const now = Timestamp.now();
  cleanData.createdAt = cleanData.createdAt ? Timestamp.fromDate(new Date(cleanData.createdAt)) : now;
  cleanData.updatedAt = now;

  let docRef;
  if (customId) {
    docRef = db.collection(collection).doc(customId.toString());
    await docRef.set(cleanData);
  } else {
    docRef = await db.collection(collection).add(cleanData);
  }

  const snapshot = await docRef.get();
  return formatSnapshot(snapshot);
}

/**
 * Updates an existing document in a collection.
 */
async function update(collection, id, data) {
  if (!db || !id) throw new Error('Firestore or document ID missing');
  const cleanData = { ...data };
  delete cleanData._id;
  delete cleanData.id;

  cleanData.updatedAt = Timestamp.now();

  const docRef = db.collection(collection).doc(id.toString());
  await docRef.update(cleanData);
  const snapshot = await docRef.get();
  return formatSnapshot(snapshot);
}

/**
 * Sets (creates or replaces) a document.
 */
async function set(collection, id, data, merge = true) {
  if (!db || !id) throw new Error('Firestore or document ID missing');
  const cleanData = { ...data };
  delete cleanData._id;
  delete cleanData.id;

  cleanData.updatedAt = Timestamp.now();

  const docRef = db.collection(collection).doc(id.toString());
  await docRef.set(cleanData, { merge });
  const snapshot = await docRef.get();
  return formatSnapshot(snapshot);
}

/**
 * Deletes a document by ID.
 */
async function remove(collection, id) {
  if (!db || !id) return false;
  await db.collection(collection).doc(id.toString()).delete();
  return true;
}

/**
 * Queries documents with an optional query builder function.
 * @param {string} collection
 * @param {Function} [buildQuery] - (ref) => ref.where(...).orderBy(...)
 * @param {Object} [options] - { page, limit, skip }
 */
async function find(collection, buildQuery = null, options = {}) {
  if (!isConfigured || !db) return [];
  let query = db.collection(collection);

  if (typeof buildQuery === 'function') {
    query = buildQuery(query);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset || options.skip) {
    query = query.offset(options.offset || options.skip);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(formatSnapshot);
}

/**
 * Finds a single document matching a query.
 */
async function findOne(collection, buildQuery) {
  if (!isConfigured || !db) return null;
  let query = db.collection(collection);
  if (typeof buildQuery === 'function') {
    query = buildQuery(query);
  }
  const snapshot = await query.limit(1).get();
  if (snapshot.empty) return null;
  return formatSnapshot(snapshot.docs[0]);
}

/**
 * Counts documents in a collection or query.
 */
async function count(collection, buildQuery = null) {
  if (!isConfigured || !db) return 0;
  let query = db.collection(collection);
  if (typeof buildQuery === 'function') {
    query = buildQuery(query);
  }
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

module.exports = {
  db,
  Timestamp,
  FieldValue,
  convertTimestamps,
  formatSnapshot,
  getById,
  create,
  update,
  set,
  remove,
  find,
  findOne,
  count,
};
