const mongoose = require('mongoose');
const { PROJECT_STATUS, MILESTONE_STATUS, PROGRESS_MODE } = require('../config/constants');

const milestoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, maxlength: 2000 },
    status: { type: String, enum: MILESTONE_STATUS, default: 'pending' },
    dueDate: { type: Date },
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    weight: { type: Number, min: 0, default: 1 },
  },
  { _id: true, timestamps: false }
);

milestoneSchema.pre('save', function stampCompletion(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, trim: true, lowercase: true, index: true },
    description: { type: String, required: true, maxlength: 4000 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    category: { type: String, trim: true, default: 'Web Development' },
    technologies: [{ type: String, trim: true }],
    status: { type: String, enum: PROJECT_STATUS, default: 'planning', index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    progressMode: { type: String, enum: PROGRESS_MODE, default: 'task_based' },
    autoComplete: { type: Boolean, default: true },
    lastProgressAt: { type: Date },
    milestones: [milestoneSchema],
    startDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    completedAt: { type: Date },
    budget: { type: Number, min: 0 },
    coverImage: { type: String },
    demoUrl: { type: String, trim: true },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    isPublic: { type: Boolean, default: false, index: true }, // shown in the public portfolio
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ name: 'text', description: 'text' });

projectSchema.virtual('tasks', {
  ref: 'Task', localField: '_id', foreignField: 'project',
});

projectSchema.pre('save', function setSlug(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    this.progress = 100;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
