const mongoose = require('mongoose');
const { TASK_STATUS, TASK_PRIORITY } = require('../config/constants');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, maxlength: 4000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: TASK_STATUS, default: 'pending', index: true },
    priority: { type: String, enum: TASK_PRIORITY, default: 'medium' },
    weight: { type: Number, min: 0, default: 1 },
    dueDate: { type: Date },
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
    visibleToClient: { type: Boolean, default: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1, dueDate: 1 });

taskSchema.pre('save', function stampCompletion(next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : undefined;
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
