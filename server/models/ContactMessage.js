const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 32 },
    company: { type: String, trim: true, maxlength: 120 },
    service: { type: String, trim: true },
    budget: { type: String, trim: true },
    message: { type: String, required: true, maxlength: 4000 },
    status: { type: String, enum: ['new', 'read', 'replied', 'archived'], default: 'new', index: true },
    ip: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
