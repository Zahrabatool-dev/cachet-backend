const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createShareLink,
  accessSharedDocument,
  getShareLinksForDocument,
  revokeShareLink,
} = require('../controllers/shareController');

// Owner ke liye protected routes
router.post('/create/:documentId', protect, createShareLink);
router.get('/document/:documentId', protect, getShareLinksForDocument);
router.delete('/:linkId', protect, revokeShareLink);

// Public route - koi bhi is link se access kar sakta hai (login ki zaroorat nahi)
router.post('/access/:token', accessSharedDocument);

module.exports = router;