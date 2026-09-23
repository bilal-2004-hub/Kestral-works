const rateLimit = require('express-rate-limit');

const message = { success: false, message: 'Too many requests. Try again in a few minutes.' };

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message,
});

// Credential endpoints get a much tighter budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  skipSuccessfulRequests: true, message,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message,
});

module.exports = { apiLimiter, authLimiter, contactLimiter };
