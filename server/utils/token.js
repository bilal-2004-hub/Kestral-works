const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpires,
  });

const signRefreshToken = (user) =>
  jwt.sign({ sub: user._id.toString(), type: 'refresh' }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpires,
  });

const verifyAccessToken = (token) => jwt.verify(token, jwtConfig.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, jwtConfig.refreshSecret);

/* Reset tokens: the raw value is emailed, only its hash is stored. */
const createResetToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: crypto.createHash('sha256').update(raw).digest('hex') };
};
const hashResetToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

module.exports = {
  signAccessToken, signRefreshToken, verifyAccessToken,
  verifyRefreshToken, createResetToken, hashResetToken,
};
