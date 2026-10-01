const path = require('path');
const fs = require('fs/promises');
const asyncHandler = require('../utils/asyncHandler');
const { created, success } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const firestoreService = require('../services/firestore.service');
const { storage, isConfigured } = require('../config/firebaseAdmin');
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

    const doc = await firestoreService.create('files', fileMeta);
    docs.push(doc);
  }

  // ── Milestone & Task advancement & progress recalculation ───────────────────
  if (req.body.project) {
    try {
      const progressService = require('../services/progressService');
      const projectId = req.body.project;
      const project = await firestoreService.getById('projects', projectId);

      if (project && Array.isArray(project.milestones) && project.milestones.length > 0) {
        const sorted = [...project.milestones].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Find current active milestone: prefer in_progress, fall back to first pending
        const currentIdx = sorted.findIndex((m) => m.status === 'in_progress');
        const fallbackIdx = sorted.findIndex((m) => m.status === 'pending');
        const activeIdx = currentIdx !== -1 ? currentIdx : fallbackIdx;

        if (activeIdx !== -1) {
          const now = new Date();

          // Mark the active milestone as completed
          sorted[activeIdx] = {
            ...sorted[activeIdx],
            status: 'completed',
            progress: 100,
            completedAt: now,
          };

          // Advance the next pending milestone to in_progress
          let nextAdvanced = false;
          for (let i = activeIdx + 1; i < sorted.length; i++) {
            if (sorted[i].status === 'pending') {
              sorted[i] = { ...sorted[i], status: 'in_progress', progress: 0 };
              nextAdvanced = true;
              break;
            }
          }

          // Persist updated milestones
          await firestoreService.update('projects', projectId, { milestones: sorted });

          // Emit milestone socket event so client re-fetches timeline
          progressService.emitMilestoneEvent(projectId, {
            action: 'file_upload_advance',
            milestones: sorted,
            completedMilestone: sorted[activeIdx],
            nextMilestone: nextAdvanced ? sorted.find((m) => m.status === 'in_progress') : null,
          });
        }
      }

      // Also advance corresponding deliverable tasks for the project
      const rawTasks = await firestoreService.find('tasks', (ref) =>
        ref.where('project', '==', projectId)
      );
      if (rawTasks && rawTasks.length > 0) {
        const sortedTasks = [...rawTasks].sort((a, b) => (a.order || 0) - (b.order || 0));
        const activeTask = sortedTasks.find((t) => t.status === 'in_progress') || sortedTasks.find((t) => t.status === 'pending');
        if (activeTask) {
          const now = new Date();
          await firestoreService.update('tasks', activeTask._id, {
            status: 'completed',
            completedAt: now,
          });
          progressService.emitTaskEvent(projectId, 'task:updated', {
            ...activeTask,
            status: 'completed',
            completedAt: now,
          });

          // Advance next pending task
          const nextPendingTask = sortedTasks.find(
            (t) => t._id !== activeTask._id && t.status === 'pending'
          );
          if (nextPendingTask) {
            await firestoreService.update('tasks', nextPendingTask._id, {
              status: 'in_progress',
            });
            progressService.emitTaskEvent(projectId, 'task:updated', {
              ...nextPendingTask,
              status: 'in_progress',
            });
          }
        }
      }

      // Check if uploaded files contain PDF or DOC requirements document
      const isDocOrPdf = docs.some((d) => {
        const name = (d.originalName || d.name || '').toLowerCase();
        const mime = (d.mimeType || '').toLowerCase();
        return (
          name.endsWith('.pdf') ||
          name.endsWith('.doc') ||
          name.endsWith('.docx') ||
          mime.includes('pdf') ||
          mime.includes('msword') ||
          mime.includes('wordprocessingml')
        );
      });

      // Recalculate progress and broadcast the updated % via socket
      // When requirements document (PDF/DOC) is uploaded, complete progress to 30%
      const targetProgress = isDocOrPdf ? 30 : null;
      await progressService.recalculateAndSave(
        projectId,
        userId,
        isDocOrPdf
          ? `Requirements document submitted: ${docs.map((d) => d.originalName).join(', ')} (Phase 1 completed → 30%)`
          : `Phase deliverable uploaded: ${docs.map((d) => d.originalName).join(', ')}`,
        targetProgress
      );
    } catch (advanceErr) {
      // Non-fatal — the upload succeeded; just log the issue
      logger.warn(`Milestone/task advance after file upload failed: ${advanceErr.message}`);
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  created(res, { data: docs, message: 'Files uploaded' });
});

exports.remove = asyncHandler(async (req, res) => {
  const file = await firestoreService.getById('files', req.params.id);
  if (!file) throw ApiError.notFound('File not found');

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

  await firestoreService.remove('files', req.params.id);

  success(res, { message: 'File deleted' });
});
