// Multer + Cloudinary storage setup
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'digital-locker',
    resource_type: 'auto',
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = /\.(pdf|jpg|jpeg|png)$/i;

    const mimeOk = allowedMimeTypes.includes(file.mimetype);
    const extOk = allowedExtensions.test(file.originalname);

    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
  },
});

module.exports = upload;