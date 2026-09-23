/* One response shape for the whole API so the frontend never has to guess. */
const success = (res, { data = null, message = 'OK', status = 200, meta } = {}) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

const created = (res, payload) => success(res, { ...payload, status: 201 });

module.exports = { success, created };
