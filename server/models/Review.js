const mongoose = require('mongoose');
const { REVIEW_STATUS } = require('../config/constants');

/* Submitted from the portal, held back until an admin approves it. */
const reviewSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: REVIEW_STATUS, default: 'pending', index: true },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    moderationNote: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// A client reviews a given project once.
reviewSchema.index({ client: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
