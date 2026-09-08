const express = require('express');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getWishlist);
router.get('/check/:courseId', protect, checkWishlistStatus);
router.post('/:courseId', protect, addToWishlist);
router.delete('/:courseId', protect, removeFromWishlist);

module.exports = router;
