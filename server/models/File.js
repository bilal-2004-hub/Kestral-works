const mongoose = require('mongoose');

/* Upload metadata. The binary lives on disk (or S3 later); only the record
   is stored here so access can be authorised per project. */
const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('File', fileSchema);
