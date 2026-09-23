/* Errors thrown with this class are safe to show to users.
   Anything else is masked by the global error handler. */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Invalid request', details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Sign in to continue') { return new ApiError(401, msg); }
  static forbidden(msg = 'You do not have access to this resource') { return new ApiError(403, msg); }
  static notFound(msg = 'Resource not found') { return new ApiError(404, msg); }
  static conflict(msg = 'That resource already exists') { return new ApiError(409, msg); }
}

module.exports = ApiError;
