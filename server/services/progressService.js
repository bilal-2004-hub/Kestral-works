const firestoreService = require('./firestore.service');
const { emitToProject, emitToUser } = require('./socketService');
const { notify } = require('./notification.service');
const logger = require('../utils/logger');

/**
 * Calculate progress from tasks using weighted or equal-weight logic.
 * @param {Array} tasks - array of task documents (need status and weight)
 * @returns {number} progress 0–100
 */
function calculateFromTasks(tasks) {
  if (!tasks || tasks.length === 0) return 0;

  const totalWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
  if (totalWeight === 0) return 0;

  const completedWeight = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.weight || 1), 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Recalculate project progress from its tasks, save to Firestore,
 * log the change, and emit real-time events.
 *
 * @param {string} projectId
 * @param {string|null} changedBy - user ID who triggered the change
 * @param {string} reason - human-readable reason (e.g. "Task completed: Payment integration")
 */
async function recalculateAndSave(projectId, changedBy, reason = 'Task update') {
  try {
    const project = await firestoreService.getById('projects', projectId);
    if (!project) return null;

    // If manual mode, don't recalculate from tasks.
    if (project.progressMode === 'manual') return project;

    const tasks = await firestoreService.find('tasks', (ref) =>
      ref.where('project', '==', projectId)
    );

    const newProgress = calculateFromTasks(tasks);
    const previousProgress = project.progress || 0;

    // No change — skip the write and emit.
    if (newProgress === previousProgress) return project;

    const updateData = {
      progress: newProgress,
      lastProgressAt: new Date(),
    };

    // Auto-complete logic.
    if (newProgress === 100 && project.autoComplete && project.status !== 'completed') {
      updateData.status = 'completed';
      updateData.completedAt = new Date();
    }

    const updatedProject = await firestoreService.update('projects', projectId, updateData);

    // Record history.
    await firestoreService.create('progressHistory', {
      project: projectId,
      previousProgress,
      newProgress,
      changedBy: changedBy || null,
      reason,
    }).catch((err) => logger.warn('progressHistory write failed:', err.message));

    // Build task summary for the event payload.
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    const eventPayload = {
      projectId: projectId.toString(),
      progress: newProgress,
      previousProgress,
      status: updatedProject.status || project.status,
      totalTasks,
      completedTasks,
      lastProgressAt: updateData.lastProgressAt,
      reason,
    };

    // Emit to the project room.
    emitToProject(projectId, 'project:progressUpdated', eventPayload);

    // If status auto-changed, emit that too.
    if (newProgress === 100 && project.autoComplete && previousProgress < 100) {
      emitToProject(projectId, 'project:statusChanged', {
        projectId: projectId.toString(),
        status: 'completed',
        previousStatus: project.status,
      });
    }

    // Create a notification only for meaningful jumps (>= 5%).
    if (Math.abs(newProgress - previousProgress) >= 5 && project.client) {
      const clientId = typeof project.client === 'object' ? project.client._id : project.client;
      await notify({
        user: clientId,
        type: 'progress_updated',
        title: `${project.name} progress: ${previousProgress}% → ${newProgress}%`,
        body: reason,
        link: `/portal/projects/${projectId}`,
      });

      // Also push the notification via socket.
      emitToUser(clientId.toString(), 'notification:new', {
        title: `${project.name} progress: ${previousProgress}% → ${newProgress}%`,
        body: reason,
      });
    }

    return updatedProject;
  } catch (err) {
    logger.error('progressService.recalculateAndSave failed:', err.message);
    return null;
  }
}

/**
 * Emit a generic project update event (for non-progress changes like description edits).
 */
function emitProjectUpdate(projectId, data) {
  emitToProject(projectId, 'project:updated', {
    projectId: projectId.toString(),
    ...data,
  });
}

/**
 * Emit a project status change event.
 */
function emitStatusChange(projectId, status, previousStatus) {
  emitToProject(projectId, 'project:statusChanged', {
    projectId: projectId.toString(),
    status,
    previousStatus,
  });
}

/**
 * Emit a task event.
 */
function emitTaskEvent(projectId, event, taskData) {
  emitToProject(projectId, event, {
    projectId: projectId.toString(),
    task: taskData,
  });
}

/**
 * Emit a milestone event.
 */
function emitMilestoneEvent(projectId, milestoneData) {
  emitToProject(projectId, 'project:milestoneUpdated', {
    projectId: projectId.toString(),
    milestone: milestoneData,
  });
}

module.exports = {
  calculateFromTasks,
  recalculateAndSave,
  emitProjectUpdate,
  emitStatusChange,
  emitTaskEvent,
  emitMilestoneEvent,
};
