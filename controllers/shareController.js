const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const ShareLink = require('../models/ShareLink');
const Document = require('../models/Document');
const logActivity = require('../utils/logActivity');
// const ActivityLog = require('../models/ActivityLog'); // Week 5 mein add karenge

// CREATE share link
exports.createShareLink = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { expiresInHours, password } = req.body; // jaise expiresInHours: 24

    // Check karo document is user ka hai
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Random unique token generate karo
    const token = crypto.randomBytes(24).toString('hex');

    // Expiry time calculate karo
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (expiresInHours || 24)); // default 24 hours

    // Agar password diya gaya hai to hash karo
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const shareLink = await ShareLink.create({
      documentId,
      token,
      password: hashedPassword,
      expiresAt,
    });
    await logActivity(req.user.id, documentId, 'share');

    // Shareable URL banao (frontend URL apni marzi se adjust kar lena)
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${token}`;

    res.status(201).json({
      message: 'Share link created successfully',
      shareUrl,
      expiresAt,
      hasPassword: !!password,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ACCESS shared document (public route - login ki zaroorat nahi)
exports.accessSharedDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body; // agar link password-protected hai

    const shareLink = await ShareLink.findOne({ token }).populate('documentId');

    if (!shareLink) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }

    // Expiry check karo
    if (new Date() > shareLink.expiresAt) {
      return res.status(410).json({ message: 'This link has expired' });
    }

    // Agar password set hai to verify karo
    if (shareLink.password) {
      if (!password) {
        return res.status(401).json({ message: 'Password required', requiresPassword: true });
      }

      const isMatch = await bcrypt.compare(password, shareLink.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    if (!shareLink.documentId) {
      return res.status(404).json({ message: 'Document no longer exists' });
    }

    // Access count badhao
    shareLink.accessCount += 1;
    await shareLink.save();

    res.status(200).json({
      document: {
        title: shareLink.documentId.title,
        fileUrl: shareLink.documentId.fileUrl,
        fileType: shareLink.documentId.fileType,
        category: shareLink.documentId.category,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET all share links for a document (owner ke liye - manage karne ke liye)
exports.getShareLinksForDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verify document is user ka hai
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const shareLinks = await ShareLink.find({ documentId }).sort({ createdAt: -1 });

    res.status(200).json({ shareLinks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE / revoke share link manually
exports.revokeShareLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const shareLink = await ShareLink.findById(linkId).populate('documentId');

    if (!shareLink) {
      return res.status(404).json({ message: 'Share link not found' });
    }

    // Verify document owner hi revoke kar sake
    if (shareLink.documentId.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await shareLink.deleteOne();

    res.status(200).json({ message: 'Share link revoked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};