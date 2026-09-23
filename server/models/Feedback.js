const mongoose = require('mongoose');
const { FEEDBACK_STATUS } = require('../config/constants');

/* Structured change requests from a client, with a reply thread the team owns. */
const feedbackSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 4000 },
    type: { type: String, enum: ['change_request', 'bug', 'question', 'approval'], default: 'change_request' },
    status: { type: String, enum: FEEDBACK_STATUS, default: 'open', index: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    replies: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true, maxlength: 4000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
