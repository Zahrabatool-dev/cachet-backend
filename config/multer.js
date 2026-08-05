// Multer + Cloudinary storage setup
// Ye decide karta hai file kahan jayegi aur kis format mein save hogi
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'digital-locker', // Cloudinary mein is naam ka folder banega
    resource_type: 'auto', // PDF aur images dono handle karega
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});

// File size limit: 10MB
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;