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
const quizRoutes = require('./routes/quiz.routes');

const app = express();

// Normalize multiple slashes in request path (e.g. //api/v1/... -> /api/v1/...)
app.use((req, res, next) => {
    if (req.url && req.url.startsWith('//')) {
        req.url = req.url.replace(/^\/+/, '/');
    }
    next();
});

// --------------------------------------------------
// Security Middleware
// --------------------------------------------------
app.use(helmet());

// CORS — allow frontend origin and preview environments
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, server-to-server)
            if (!origin) return callback(null, true);

            // Allow any localhost, 127.0.0.1, or local LAN IP (192.168.x.x, 172.x.x.x, 10.x.x.x) on any port
            if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }

            // Allow all Vercel domains (*.vercel.app) or Render domains
            if (origin.includes('vercel.app') || origin.includes('onrender.com')) {
                return callback(null, true);
            }

            // Allow configured origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // In development, allow any origin to facilitate testing
            if (process.env.NODE_ENV !== 'production') {
                return callback(null, true);
            }

            // Gracefully disallow without crashing with an unhandled 500 error
            callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
);

// Rate limiting — generous limit in dev (5000), 500 in prod per 10 minutes
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 500 : 5000,
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
app.use('/api/v1/quizzes', quizRoutes);

// --------------------------------------------------
// Error Handling (must be last)
// --------------------------------------------------
app.use(notFound);
app.use(errorHandler);

module.exports = app;