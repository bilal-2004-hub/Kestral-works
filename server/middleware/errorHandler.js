const multer = require('multer');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { env } = require('../config/env');

/* Single exit point for every failure. Internal details are logged, never sent. */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, _next) => {
  let error = err;

  if (err.name === 'CastError') {
    error = ApiError.badRequest('That identifier is not valid');
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || { value: 'value' })[0];
    error = ApiError.conflict(`That ${field} is already in use`);
  } else if (err.name === 'ValidationError') {
    const details = {};
    Object.values(err.errors).forEach((e) => { details[e.path] = e.message; });
    error = ApiError.badRequest('Some fields need attention', details);
  } else if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(
      err.code === 'LIMIT_FILE_SIZE' ? 'That file is larger than the upload limit' : 'That upload was rejected'
    );
  }

  if (!(error instanceof ApiError)) {
    logger.error(err.stack || err);
    error = new ApiError(500, 'Something went wrong on our side. Please try again.');
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details ? { errors: error.details } : {}),
    ...(env === 'development' && error.statusCode === 500 ? { stack: err.stack } : {}),
  });
};
