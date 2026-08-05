// ActivityLog schema - track karta hai kab kya action hua kis document par
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    action: {
      type: String,
      enum: ['upload', 'download', 'share', 'delete', 'view'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // hum apna khud ka timestamp field use kar rahe hain
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);