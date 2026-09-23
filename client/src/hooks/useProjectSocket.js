import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

/**
 * Custom hook to join a project room and listen for real-time progress, status, milestone, and task updates.
 *
 * @param {string} projectId
 * @param {Object} handlers - { onProgressUpdated, onStatusChanged, onMilestoneUpdated, onTaskCreated, onTaskUpdated, onTaskDeleted, onProjectUpdated }
 */
export function useProjectSocket(projectId, handlers = {}) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !projectId) return;

    socket.emit('join:project', projectId);

    const onProgressUpdated = (data) => {
      if (data.projectId === projectId && handlers.onProgressUpdated) {
        handlers.onProgressUpdated(data);
      }
    };

    const onStatusChanged = (data) => {
      if (data.projectId === projectId && handlers.onStatusChanged) {
        handlers.onStatusChanged(data);
      }
    };

    const onMilestoneUpdated = (data) => {
      if (data.projectId === projectId && handlers.onMilestoneUpdated) {
        handlers.onMilestoneUpdated(data);
      }
    };

    const onTaskCreated = (data) => {
      if (data.projectId === projectId && handlers.onTaskCreated) {
        handlers.onTaskCreated(data);
      }
    };

    const onTaskUpdated = (data) => {
      if (data.projectId === projectId && handlers.onTaskUpdated) {
        handlers.onTaskUpdated(data);
      }
    };

    const onTaskDeleted = (data) => {
      if (data.projectId === projectId && handlers.onTaskDeleted) {
        handlers.onTaskDeleted(data);
      }
    };

    const onProjectUpdated = (data) => {
      if (data.projectId === projectId && handlers.onProjectUpdated) {
        handlers.onProjectUpdated(data);
      }
    };

    socket.on('project:progressUpdated', onProgressUpdated);
    socket.on('project:statusChanged', onStatusChanged);
    socket.on('project:milestoneUpdated', onMilestoneUpdated);
    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('project:updated', onProjectUpdated);

    return () => {
      socket.emit('leave:project', projectId);
      socket.off('project:progressUpdated', onProgressUpdated);
      socket.off('project:statusChanged', onStatusChanged);
      socket.off('project:milestoneUpdated', onMilestoneUpdated);
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('project:updated', onProjectUpdated);
    };
  }, [socket, isConnected, projectId, handlers]);

  return { socket, isConnected };
}
