const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { bcryptRounds } = require('../config/env');
const { ROLES } = require('../config/constants');

/* One collection for every human in the system. `role` decides what they can
   reach; client-specific fields (company, phone) stay optional for staff. */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENT, index: true },
    company: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 32 },
    avatar: { type: String },
    position: { type: String, trim: true, maxlength: 80 },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, bcryptRounds);
  this.passwordChangedAt = new Date();
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/* Never let a hash or reset token leave the API, whatever the controller does. */
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
