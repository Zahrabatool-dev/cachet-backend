const Document = require('../models/Document');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const logActivity = require('../utils/logActivity');
const ActivityLog = require('../models/ActivityLog');
const AdmZip = require('adm-zip');
const streamifier = require('streamifier');

// UPLOAD document
exports.uploadDocument = async (req, res) => {
  try {
    // Multer ne file already Cloudinary pe upload kar di hai
    // req.file mein uska data mil jayega
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, category, tags, expiryDate } = req.body;

    // tags string se array banao (agar frontend se comma-separated string aayi)
    const tagsArray = tags ? tags.split(',').map((tag) => tag.trim()) : [];

    const newDocument = await Document.create({
  userId: req.user.id,
  title: title || req.file.originalname,
  category: category || 'other',
  fileUrl: req.file.path,
  fileType: req.file.mimetype,
  fileSize: req.file.size,
  tags: tagsArray,
  expiryDate: expiryDate || null,
});
    // User ka storageUsed update karo
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { storageUsed: req.file.size },
    });

    // Activity log add karo
    await logActivity(req.user.id, newDocument._id, 'upload');

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET all documents - ab search, filter, aur sort ke sath
exports.getDocuments = async (req, res) => {
  try {
    const { category, search, tag, sortBy, order } = req.query;
    // Example query: /api/documents?category=identity&search=cnic&sortBy=expiryDate&order=asc

    const filter = { userId: req.user.id };

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = tag; // ek tag se match karega
    }

    if (search) {
      // title mein search karo (case-insensitive)
      filter.title = { $regex: search, $options: 'i' };
    }

    // Sorting logic
    let sortOption = { createdAt: -1 }; // default: naya document pehle
    if (sortBy === 'expiryDate') {
      sortOption = { expiryDate: order === 'desc' ? -1 : 1 };
    } else if (sortBy === 'uploadDate') {
      sortOption = { createdAt: order === 'desc' ? -1 : 1 };
    } else if (sortBy === 'title') {
      sortOption = { title: order === 'desc' ? -1 : 1 };
    }

    const documents = await Document.find(filter).sort(sortOption);

    res.status(200).json({ documents, count: documents.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id, // sirf apna document dekh sake
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
     // Activity log add karo
    await logActivity(req.user.id, document._id, 'view');

    res.status(200).json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// UPDATE document (rename, change category/tags/expiry)
exports.updateDocument = async (req, res) => {
  try {
    const { title, category, tags, expiryDate } = req.body;

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Sirf jo fields bheji gayi hain unhe update karo
    if (title) document.title = title;
    if (category) document.category = category;
    if (tags) document.tags = tags.split(',').map((tag) => tag.trim());
    if (expiryDate !== undefined) document.expiryDate = expiryDate;

    await document.save();

    res.status(200).json({ message: 'Document updated', document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Cloudinary se bhi file delete karo (public_id nikal kar)
    const publicId = document.fileUrl.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(`digital-locker/${publicId}`).catch(() => {
      // agar delete fail ho to bhi DB record delete kar do, warning bas log kar do
      console.log('Cloudinary delete warning: file not found or already deleted');
    });

    // User ka storageUsed kam karo
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { storageUsed: -document.fileSize },
    });

    await logActivity(req.user.id, document._id, 'delete');
    await document.deleteOne();

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Dashboard widget ke liye - jo documents 30 din mein expire ho rahe hain
exports.getExpiringSoon = async (req, res) => {
  try {
    const today = new Date();
    const reminderDate = new Date();
    reminderDate.setDate(today.getDate() + 30);

    const expiringDocs = await Document.find({
      userId: req.user.id,
      expiryDate: { $ne: null, $gte: today, $lte: reminderDate },
    }).sort({ expiryDate: 1 }); // jo pehle expire ho raha hai wo upar

    res.status(200).json({ documents: expiringDocs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Storage usage widget ke liye - "250MB / 1GB used"
exports.getStorageUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('storageUsed');

    const STORAGE_LIMIT = 1024 * 1024 * 1024; // 1GB in bytes

    res.status(200).json({
      storageUsed: user.storageUsed,
      storageLimit: STORAGE_LIMIT,
      percentageUsed: ((user.storageUsed / STORAGE_LIMIT) * 100).toFixed(2),
      storageUsedMB: (user.storageUsed / (1024 * 1024)).toFixed(2),
      storageLimitMB: (STORAGE_LIMIT / (1024 * 1024)).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// User ki poori activity history dekhne ke liye
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.user.id })
      .populate('documentId', 'title category')
      .sort({ timestamp: -1 })
      .limit(50);

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// BULK UPLOAD via ZIP — extracts a zip and creates a Document for each valid file inside
exports.uploadZip = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No zip file uploaded' });
    }

    const { category, expiryDate } = req.body;
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries().filter((e) => {
      if (e.isDirectory) return false;
      const ext = e.entryName.slice(e.entryName.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (entries.length === 0) {
      return res.status(400).json({ message: 'No valid PDF/JPG/PNG files found in the zip' });
    }

    const results = { created: [], skipped: [] };

    // helper: upload a single buffer to Cloudinary via stream
    const uploadBufferToCloudinary = (buffer, filename) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'digital-locker', resource_type: 'auto', public_id: filename.split('.')[0] },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

    for (const entry of entries) {
      try {
        const buffer = entry.getData();
        const fileName = entry.entryName.split('/').pop(); // strip any folder path inside zip

        // basic size guard — skip files over 20MB
        if (buffer.length > 20 * 1024 * 1024) {
          results.skipped.push({ name: fileName, reason: 'File too large (max 20MB)' });
          continue;
        }

        const uploadResult = await uploadBufferToCloudinary(buffer, fileName);

        const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
        const mimeMap = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

        const newDocument = await Document.create({
          userId: req.user.id,
          title: fileName,
          category: category || 'other',
          fileUrl: uploadResult.secure_url,
          fileType: mimeMap[ext] || 'application/octet-stream',
          fileSize: buffer.length,
          tags: [],
          expiryDate: expiryDate || null,
        });

        await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: buffer.length } });
        await logActivity(req.user.id, newDocument._id, 'upload');

        results.created.push(fileName);
      } catch (err) {
        results.skipped.push({ name: entry.entryName, reason: 'Upload failed' });
      }
    }

    res.status(201).json({
      message: `${results.created.length} document(s) imported`,
      created: results.created,
      skipped: results.skipped,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};