const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const chatRoutes = require('./routes/chat.routes');
const certificateRoutes = require('./routes/certificate.routes');
const notificationRoutes = require('./routes/notification.routes');
const liveClassRoutes = require('./routes/liveClass.routes');

const app = express();

// --------------------------------------------------
// Security Middleware
// --------------------------------------------------
app.use(helmet());

// CORS — allow frontend origin
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // allow requests with no origin (mobile apps, curl, etc)
            if (!origin) return callback(null, true);
            if (
                allowedOrigins.includes(origin) ||
                /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
            ) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    })
);

// Rate limiting — 100 requests per 10 minutes per IP
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// --------------------------------------------------
// Body Parsing
// --------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// --------------------------------------------------
// Health Check
// --------------------------------------------------
app.get('/', (req, res) => {
    res.json({ success: true, message: '🚀 LearnSphere API is running!', version: '1.0.0' });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/conversations', chatRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/live-classes', liveClassRoutes);

// --------------------------------------------------
// Error Handling (must be last)
// --------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;