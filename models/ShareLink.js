// ShareLink schema - temporary shareable links ka record
const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // ye link ka unique identifier hoga
    },
    password: {
      type: String,
      default: null, // agar set hai to hashed save hoga
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShareLink', shareLinkSchema);