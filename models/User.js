// User schema - is mein storageUsed aur isVerified bhi rakha hai future features ke liye
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // ye hashed hoga, plain text kabhi save nahi hoga
    },
    isVerified: {
      type: Boolean,
      default: false, // 2FA/OTP feature ke liye baad mein use hoga
    },
    storageUsed: {
      type: Number,
      default: 0, // bytes mein storage track karenge
    },
    googleId: {
   type: String,
   default: null,
   },
   avatar: {
   type: String,
   default: null,
   },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    },
  { timestamps: true } // createdAt aur updatedAt automatically add ho jayenge
);

module.exports = mongoose.model('User', userSchema);