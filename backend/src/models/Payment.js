const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        razorpayOrderId: {
            type: String,
            default: '',
        },
        paymentId: {
            type: String,
            default: '',
        },
        razorpayPaymentId: {
            type: String,
            default: '',
        },
        signature: {
            type: String,
            default: '',
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        receipt: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        errorDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ student: 1, course: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
