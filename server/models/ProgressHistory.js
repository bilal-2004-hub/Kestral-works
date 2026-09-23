const mongoose = require('mongoose');

const progressHistorySchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    previousProgress: { type: Number, required: true },
    newProgress: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

progressHistorySchema.index({ project: 1, createdAt: -1 });
// Housekeeping: history entries expire after 1 year.
progressHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

module.exports = mongoose.model('ProgressHistory', progressHistorySchema);
