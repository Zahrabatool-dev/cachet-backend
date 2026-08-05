const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { updateProfile, updatePassword } = require('../controllers/userController');

router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;