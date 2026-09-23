const mongoose = require('mongoose');

/* Threaded discussion attached to a project, and optionally to one task. */
const commentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    message: { type: String, required: true, maxlength: 4000 },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    isResolved: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

commentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
