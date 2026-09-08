const Razorpay = require('razorpay');

let razorpayInstance = null;

const isRazorpayConfigured = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    return Boolean(
        keyId &&
        keySecret &&
        keyId.trim() !== '' &&
        keySecret.trim() !== '' &&
        !keyId.includes('your_key_id')
    );
};

const getRazorpayInstance = () => {
    if (!isRazorpayConfigured()) {
        return null;
    }

    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID.trim(),
            key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
        });
    }

    return razorpayInstance;
};

module.exports = {
    getRazorpayInstance,
    isRazorpayConfigured,
};
