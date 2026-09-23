const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'project_assigned', 'project_status', 'project_completed', 'progress_updated', 'milestone_updated',
        'task_assigned', 'task_status',
        'feedback_new', 'feedback_reply',
        'comment_new', 'review_submitted', 'review_moderated', 'contact_new',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 160 },
    body: { type: String, maxlength: 500 },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
// Housekeeping: notifications expire after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('Notification', notificationSchema);
