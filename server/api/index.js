/**
 * Vercel Serverless Entry Point
 *
 * This file is the ONLY addition required for Vercel compatibility.
 * It simply re-exports the existing Express `app` from ../app.js.
 *
 * ⚠ Socket.IO (real-time) is NOT supported on Vercel serverless.
 *   The rest of the REST API works exactly as before.
 *   For WebSocket support in production use Railway / Render / Fly.io instead.
 */

// Ensure Firebase Admin is initialized before the first request hits a handler.
require('../config/firebaseAdmin');

const app = require('../app');

// Vercel expects the file to export the Express handler directly.
module.exports = app;
