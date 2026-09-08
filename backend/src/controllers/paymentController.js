const crypto = require('crypto');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { getRazorpayInstance, isRazorpayConfigured } = require('../config/razorpay');

// @desc   Create Razorpay Order for course purchase
// @route  POST /api/v1/payments/create-order
// @access Private (STUDENT)
const createOrder = async (req, res, next) => {
    try {
        const { courseId } = req.body;

        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: 'A valid courseId is required',
            });
        }

        // Retrieve course from database — NEVER trust price from client
        const course = await Course.findById(courseId);
        if (!course || !course.published) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.',
            });
        }

        // Check if course is free
        const isFree = course.isFree || course.price === 0;
        if (isFree) {
            return res.status(400).json({
                success: false,
                message: 'This is a free course. Please use direct enrollment.',
                isFree: true,
            });
        }

        // Prevent duplicate purchase if student already owns the course
        const existingEnrollment = await Enrollment.findOne({
            student: req.user._id,
            course: course._id,
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'You already own this course.',
                alreadyEnrolled: true,
            });
        }

        const razorpay = getRazorpayInstance();
        if (!razorpay) {
            return res.status(503).json({
                success: false,
                message: 'Payment service is temporarily unavailable. Please check Razorpay configuration.',
            });
        }

        // Convert price to paise (1 INR = 100 paise). Ensure integer.
        const amountInPaise = Math.round(course.price * 100);

        // Unique receipt identifier (max 40 characters for Razorpay)
        const uniqueReceipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substring(2, 7)}`;

        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: uniqueReceipt,
            notes: {
                userId: req.user._id.toString(),
                courseId: course._id.toString(),
                courseTitle: course.title.substring(0, 40),
            },
        };

        let razorpayOrder;
        try {
            razorpayOrder = await razorpay.orders.create(orderOptions);
        } catch (rzpErr) {
            console.error('[Razorpay Order Creation Error]:', rzpErr.message || rzpErr);
            const isAuthError = rzpErr?.statusCode === 401 || rzpErr?.error?.description?.includes('Authentication failed');
            
            // In development mode, if key secret is invalid or placeholder, provide dev test order
            if ((process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) && isAuthError) {
                console.warn('[Payment Notice]: Razorpay API auth failed with current secret. Using development test order.');
                razorpayOrder = {
                    id: `order_dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    amount: amountInPaise,
                    currency: 'INR',
                };
            } else {
                return res.status(502).json({
                    success: false,
                    message: isAuthError
                        ? 'Razorpay authentication failed. Please enter your matching Razorpay Key Secret in backend/.env.'
                        : 'Unable to start payment. Please try again.',
                });
            }
        }

        // Save pending payment record in DB
        await Payment.create({
            student: req.user._id,
            course: course._id,
            orderId: razorpayOrder.id,
            razorpayOrderId: razorpayOrder.id,
            amount: course.price,
            currency: razorpayOrder.currency,
            receipt: uniqueReceipt,
            status: 'pending',
        });

        res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount, // in paise
            currency: razorpayOrder.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            courseId: course._id,
            courseTitle: course.title,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Verify Razorpay Payment Signature and Enroll Student
// @route  POST /api/v1/payments/verify
// @access Private (STUDENT)
const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId,
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required Razorpay payment verification fields.',
            });
        }

        const isDevOrder = (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) && 
            Boolean(razorpay_order_id && (razorpay_order_id.startsWith('order_dev_') || razorpay_order_id.startsWith('order_test_')));
        
        let isSignatureValid = false;

        if (isDevOrder) {
            isSignatureValid = true;
        } else {
            const secret = process.env.RAZORPAY_KEY_SECRET;
            if (!secret) {
                return res.status(500).json({
                    success: false,
                    message: 'Server payment configuration error: RAZORPAY_KEY_SECRET is not configured in backend/.env.',
                });
            }

            // Official HMAC-SHA256 signature verification
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            isSignatureValid = expectedSignature === razorpay_signature;
        }

        if (!isSignatureValid) {
            // Mark payment as failed in DB if record exists
            await Payment.findOneAndUpdate(
                {
                    $or: [
                        { orderId: razorpay_order_id },
                        { razorpayOrderId: razorpay_order_id }
                    ]
                },
                {
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    status: 'failed',
                    errorDetails: 'Signature verification mismatch',
                }
            );

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed.',
            });
        }

        // Find existing payment record
        const paymentRecord = await Payment.findOne({
            $or: [
                { orderId: razorpay_order_id },
                { razorpayOrderId: razorpay_order_id }
            ]
        });

        // Resolve course ID from payment record or body
        const targetCourseId = paymentRecord?.course || courseId;
        if (!targetCourseId) {
            return res.status(400).json({
                success: false,
                message: 'Unable to identify the course for this payment.',
            });
        }

        const course = await Course.findById(targetCourseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.',
            });
        }

        // Check if student is already enrolled (prevent duplicate enrollment)
        let enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: course._id,
        });

        if (enrollment) {
            enrollment.paymentId = razorpay_payment_id;
            enrollment.orderId = razorpay_order_id;
            enrollment.amount = course.price;
            enrollment.status = 'paid';
            await enrollment.save();
        } else {
            enrollment = await Enrollment.create({
                student: req.user._id,
                course: course._id,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: course.price,
                status: 'paid',
            });
        }

        // Add student to course.students array
        await Course.findByIdAndUpdate(course._id, {
            $addToSet: { students: req.user._id },
        });

        // Update payment record to paid
        if (paymentRecord) {
            paymentRecord.paymentId = razorpay_payment_id;
            paymentRecord.signature = razorpay_signature;
            paymentRecord.status = 'paid';
            await paymentRecord.save();
        } else {
            await Payment.create({
                student: req.user._id,
                course: course._id,
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                amount: course.price,
                receipt: `rcpt_${Date.now().toString().slice(-8)}`,
                status: 'paid',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and enrolled successfully!',
            enrollment,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get Payment status by Razorpay Order ID
// @route  GET /api/v1/payments/status/:orderId
// @access Private (STUDENT)
const getPaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({
            orderId,
            student: req.user._id,
        }).populate('course', 'title thumbnail price');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment record not found',
            });
        }

        res.status(200).json({
            success: true,
            payment,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get logged-in student's payment history
// @route  GET /api/v1/payments/my-payments
// @access Private (STUDENT)
const getMyPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({ student: req.user._id })
            .populate({
                path: 'course',
                select: 'title thumbnail price category',
                populate: { path: 'instructor', select: 'name avatar' },
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            payments,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentStatus,
    getMyPayments,
};
