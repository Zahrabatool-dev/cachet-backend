// Document schema - har uploaded document ka record isme save hoga
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // User model se link karta hai
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['identity', 'education', 'financial', 'medical', 'legal', 'other'],
      default: 'other',
    },
    fileUrl: {
      type: String,
      required: true, // Cloudinary se milne wala secure URL
    },
    fileType: {
      type: String, // jaise "pdf", "jpg", "png"
    },
    fileSize: {
      type: Number, // bytes mein
    },
    tags: {
      type: [String], // array of strings, jaise ["urgent", "2026"]
      default: [],
    },
    expiryDate: {
      type: Date,
      default: null, // optional - Week 3 mein use hoga
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Search aur filter fast rakhne ke liye indexes
documentSchema.index({ title: 'text' }); // text search ke liye
documentSchema.index({ userId: 1, category: 1 }); // category filter fast karne ke liye
documentSchema.index({ userId: 1, expiryDate: 1 }); // expiry sort fast karne ke liye

module.exports = mongoose.model('Document', documentSchema);