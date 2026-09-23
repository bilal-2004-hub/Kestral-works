const mongoose = require('mongoose');

const clientLoginSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    company: { type: String, default: '' },
    role: { type: String, default: 'client' },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    portal: { type: String, default: 'client_portal' },
    loginMethod: { type: String, default: 'email_password' },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    loginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ClientLogin', clientLoginSchema);
