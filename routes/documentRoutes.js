const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const upload = require('../config/multer');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getExpiringSoon,
  getStorageUsage,
  getActivityLogs,
} = documentController;
const { checkExpiringDocuments } = require('../cron/expiryChecker');

// Zip file ke liye alag memory-storage wala multer instance (buffer chahiye hota hai Cloudinary ke liye)
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB zip limit

router.post('/upload', protect, upload.single('file'), uploadDocument);

router.post('/upload', protect, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer ki apni errors (file size, unexpected field, etc.)
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Max size is 20MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // fileFilter ya CloudinaryStorage se aayi custom errors
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  });
}, uploadDocument);
router.post('/upload-zip', protect, memoryUpload.single('zipFile'), documentController.uploadZip);
router.get('/test-expiry-check', protect, async (req, res) => {
  await checkExpiringDocuments();
  res.json({ message: 'Expiry check triggered manually' });
});
router.get('/dashboard/expiring-soon', protect, getExpiringSoon);
router.get('/dashboard/storage-usage', protect, getStorageUsage);
router.get('/dashboard/activity-logs', protect, getActivityLogs);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);
module.exports = router;