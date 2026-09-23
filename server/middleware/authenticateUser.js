const { requireAuth } = require('./auth');

/**
 * Firebase authentication middleware as specified in system migration guidelines.
 * 1. Reads the Firebase ID token from Authorization header or cookie.
 * 2. Verifies the token using Firebase Admin SDK.
 * 3. Identifies the Firebase user and loads their Firestore profile.
 * 4. Attaches the authenticated user to req.user.
 * 5. Rejects unauthorized requests with 401.
 */
module.exports = requireAuth;
