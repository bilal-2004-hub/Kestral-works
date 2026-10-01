const path = require('path');
const dotenv = require('dotenv');

// Load .env from server folder and from cwd
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const isDev = (process.env.NODE_ENV || 'development') === 'development';

if (!process.env.JWT_ACCESS_SECRET && isDev) {
  process.env.JWT_ACCESS_SECRET = 'dev_access_secret_99f36a8d7e2b104c8f5e1a2b3c4d5e6f';
}
if (!process.env.JWT_REFRESH_SECRET && isDev) {
  process.env.JWT_REFRESH_SECRET = 'dev_refresh_secret_11a22b33c44d55e66f77a88b99c00d11';
}

// MONGO_URI is no longer required — database is Firebase/Firestore.
const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  // Fail fast: a half-configured server is worse than one that refuses to boot.
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 8) * 1024 * 1024,
  firebaseApiKey: process.env.FIREBASE_API_KEY || 'AIzaSyBhN988Ic68ssAX_4xCDA7uU7naJlsNnl8',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@kestrel.dev',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'no-reply@example.com',
  },
};
