const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { maxUploadBytes } = require('../config/env');

// Vercel's serverless functions only allow writes inside /tmp.
// In development (or any other host) we keep the local uploads/ folder.
const IS_VERCEL = process.env.VERCEL === '1';
const UPLOAD_DIR = IS_VERCEL
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf',
  'application/zip', 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client filename on disk: random name + validated extension.
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxUploadBytes, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(ApiError.badRequest(`Files of type ${file.mimetype} are not accepted`));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_DIR };
