const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const authService = require('../services/auth.service');
const { env } = require('../config/env');

/* The refresh token lives in an httpOnly cookie; the short-lived access token
   is returned in the body for the Authorization header. */
const refreshCookie = {
  httpOnly: true,
  secure: env === 'production',
  sameSite: env === 'production' ? 'strict' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setSession = (res, { refreshToken }) => res.cookie('refreshToken', refreshToken, refreshCookie);

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  created(res, { data: { user: result.user }, message: 'Account created' });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  setSession(res, result);

  // Automatically record client portal login in Firestore clientLogins
  await authService.recordClientLogin(result.user, {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.headers['user-agent'] || '',
    portal: 'client_portal',
    loginMethod: 'email_password',
  });

  success(res, { data: { user: result.user, accessToken: result.accessToken }, message: 'Signed in' });
});

exports.recordLogin = asyncHandler(async (req, res) => {
  const loginRecord = await authService.recordClientLogin(req.user, {
    ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    userAgent: req.headers['user-agent'] || '',
    portal: req.body?.portal || 'client_portal',
    loginMethod: req.body?.loginMethod || 'firebase_auth',
  });
  success(res, { data: loginRecord, message: 'Client login recorded in Firestore' });
});

exports.getClientLogins = asyncHandler(async (req, res) => {
  const result = await authService.listClientLogins(req.query);
  success(res, { data: result.items, meta: result.meta });
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.cookies?.refreshToken || req.body.refreshToken);
  setSession(res, result);
  success(res, { data: { user: result.user, accessToken: result.accessToken } });
});

exports.logout = asyncHandler(async (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  success(res, { message: 'Signed out' });
});

exports.me = asyncHandler(async (req, res) => success(res, { data: { user: req.user } }));

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  success(res, { message: 'If that email is registered, a reset link is on its way' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  setSession(res, result);
  success(res, { data: { user: result.user, accessToken: result.accessToken }, message: 'Password updated' });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  setSession(res, result);
  success(res, { data: { accessToken: result.accessToken }, message: 'Password updated' });
});
