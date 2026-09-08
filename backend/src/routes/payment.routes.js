const express = require('express');
const {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All payment endpoints require authentication
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
