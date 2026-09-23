const path = require('path');
const fs = require('fs/promises');
const asyncHandler = require('../utils/asyncHandler');
const { created, success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { storage, isConfigured } = require('../config/firebaseAdmin');
const File = require('../models/File');
const { isStaff } = require('../middleware/auth');
const { assertProjectAccess } = require('../services/task.service');
const { UPLOAD_DIR } = require('../middleware/upload');
const logger = require('../utils/logger');

exports.upload = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('Choose at least one file to upload');
  if (req.body.project) await assertProjectAccess(req.user, req.body.project);

  const userId = req.user._id || req.user.uid;
  const docs = [];

  for (const file of req.files) {
    let downloadUrl = `/uploads/${file.filename}`;
    let storagePath = null;

    // Upload to Firebase Storage bucket if configured
    if (isConfigured && storage) {
      try {
        const bucket = storage.bucket();
        const destination = `projects/${req.body.project || 'general'}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        await bucket.upload(file.path, {
          destination,
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: userId,
            },
          },
        });

        // Make file public or generate signed URL
        const fileRef = bucket.file(destination);
        try {
          await fileRef.makePublic();
          downloadUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        } catch {
          const [url] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '03-09-2499',
          });
          downloadUrl = url;
        }
        storagePath = destination;
      } catch (fbStorageErr) {
        logger.warn(`Firebase Storage upload warning, falling back to local URL: ${fbStorageErr.message}`);
      }
    }

    const fileMeta = {
      originalName: file.originalname,
      storedName: file.filename,
      url: downloadUrl,
      storagePath,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      project: req.body.project || null,
    };

    if (firestoreService.db) {
      const doc = await firestoreService.create('files', fileMeta);
      docs.push(doc);
    } else {
      const doc = await File.create(fileMeta);
      docs.push(doc.toJSON());
    }
  }

  created(res, { data: docs, message: 'Files uploaded' });
});

exports.remove = asyncHandler(async (req, res) => {
  let file = await firestoreService.getById('files', req.params.id);
  if (!file) {
    const doc = await File.findById(req.params.id);
    if (!doc) throw ApiError.notFound('File not found');
    file = doc.toJSON();
  }

  const userId = req.user._id || req.user.uid;
  const uploadedBy = typeof file.uploadedBy === 'object' ? file.uploadedBy._id : file.uploadedBy;

  if (!isStaff(req.user) && uploadedBy !== userId) {
    throw ApiError.forbidden();
  }

  // Remove from Firebase Storage if storagePath exists
  if (isConfigured && storage && file.storagePath) {
    try {
      const bucket = storage.bucket();
      await bucket.file(file.storagePath).delete();
    } catch (err) {
      logger.warn(`Firebase Storage delete warning: ${err.message}`);
    }
  }

  // Remove local file fallback if present
  if (file.storedName) {
    await fs.unlink(path.join(UPLOAD_DIR, file.storedName)).catch(() => {});
  }

  if (firestoreService.db) {
    await firestoreService.remove('files', req.params.id);
  } else {
    await File.findByIdAndDelete(req.params.id);
  }

  success(res, { message: 'File deleted' });
});
