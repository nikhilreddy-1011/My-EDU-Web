const express = require('express');
const { getProfile, updateProfile, changePassword, getAllUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, updateProfile);
router.patch('/password', protect, changePassword);
router.get('/', protect, authorize('ADMIN'), getAllUsers);

module.exports = router;
