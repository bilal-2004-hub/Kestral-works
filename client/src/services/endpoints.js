import api from './api.js';

const unwrap = (res) => res.data;

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  recordLogin: (payload) => api.post('/auth/record-login', payload).then(unwrap),
  clientLogins: (params) => api.get('/auth/client-logins', { params }).then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  refresh: () => api.post('/auth/refresh').then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(unwrap),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(unwrap),
  changePassword: (payload) => api.patch('/auth/password', payload).then(unwrap),
};

export const projectApi = {
  list: (params) => api.get('/projects', { params }).then(unwrap),
  get: (id) => api.get(`/projects/${id}`).then(unwrap),
  create: (payload) => api.post('/projects', payload).then(unwrap),
  update: (id, payload) => api.put(`/projects/${id}`, payload).then(unwrap),
  addMilestone: (id, payload) => api.post(`/projects/${id}/milestones`, payload).then(unwrap),
  updateMilestone: (id, milestoneId, payload) => api.put(`/projects/${id}/milestones/${milestoneId}`, payload).then(unwrap),
  removeMilestone: (id, milestoneId) => api.delete(`/projects/${id}/milestones/${milestoneId}`).then(unwrap),
  archive: (id) => api.patch(`/projects/${id}/archive`).then(unwrap),
  remove: (id) => api.delete(`/projects/${id}`).then(unwrap),
  publicPortfolio: (params) => api.get('/projects/public', { params }).then(unwrap),
};

export const progressApi = {
  getHistory: (projectId) => api.get(`/progress/${projectId}/history`).then(unwrap),
  recalculate: (projectId) => api.post(`/progress/${projectId}/recalculate`).then(unwrap),
};

export const taskApi = {
  list: (params) => api.get('/tasks', { params }).then(unwrap),
  create: (payload) => api.post('/tasks', payload).then(unwrap),
  update: (id, payload) => api.put(`/tasks/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/tasks/${id}`).then(unwrap),
};

export const commentApi = {
  listByProject: (projectId) => api.get(`/comments/project/${projectId}`).then(unwrap),
  create: (payload) => api.post('/comments', payload).then(unwrap),
  resolve: (id, isResolved) => api.patch(`/comments/${id}/resolve`, { isResolved }).then(unwrap),
  remove: (id) => api.delete(`/comments/${id}`).then(unwrap),
};

export const feedbackApi = {
  list: (params) => api.get('/feedback', { params }).then(unwrap),
  get: (id) => api.get(`/feedback/${id}`).then(unwrap),
  create: (payload) => api.post('/feedback', payload).then(unwrap),
  reply: (id, message) => api.post(`/feedback/${id}/replies`, { message }).then(unwrap),
  setStatus: (id, status) => api.patch(`/feedback/${id}/status`, { status }).then(unwrap),
};

export const reviewApi = {
  listPublic: (params) => api.get('/reviews/public', { params }).then(unwrap),
  list: (params) => api.get('/reviews', { params }).then(unwrap),
  create: (payload) => api.post('/reviews', payload).then(unwrap),
  moderate: (id, payload) => api.patch(`/reviews/${id}/moderate`, payload).then(unwrap),
  remove: (id) => api.delete(`/reviews/${id}`).then(unwrap),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }).then(unwrap),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.put('/notifications/read-all').then(unwrap),
};

export const clientApi = {
  list: (params) => api.get('/clients', { params }).then(unwrap),
  get: (id) => api.get(`/clients/${id}`).then(unwrap),
  create: (payload) => api.post('/clients', payload).then(unwrap),
  update: (id, payload) => api.put(`/clients/${id}`, payload).then(unwrap),
  setActive: (id, isActive) => api.patch(`/clients/${id}/status`, { isActive }).then(unwrap),
  remove: (id) => api.delete(`/clients/${id}`).then(unwrap),
  updateProfile: (payload) => api.patch('/clients/me', payload).then(unwrap),
};

export const contactApi = {
  send: (payload) => api.post('/contact', payload).then(unwrap),
  list: (params) => api.get('/contact', { params }).then(unwrap),
  setStatus: (id, status) => api.patch(`/contact/${id}/status`, { status }).then(unwrap),
  remove: (id) => api.delete(`/contact/${id}`).then(unwrap),
};

export const dashboardApi = {
  client: () => api.get('/dashboard/client').then(unwrap),
  admin: () => api.get('/dashboard/admin').then(unwrap),
};

export const fileApi = {
  upload: (files, projectId) => {
    const form = new FormData();
    [...files].forEach((file) => form.append('files', file));
    if (projectId) form.append('project', projectId);
    return api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
  remove: (id) => api.delete(`/files/${id}`).then(unwrap),
};
