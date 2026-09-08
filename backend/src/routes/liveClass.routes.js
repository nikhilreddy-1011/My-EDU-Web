const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
    getLiveClasses,
    scheduleLiveClass,
    getLiveClassById,
    updateLiveClassStatus,
    deleteLiveClass,
} = require('../controllers/liveClassController');

// Middleware that verifies JWT teacher/admin or falls back to demo teacher
const teacherAuthWithFallback = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (user && (user.role === 'TEACHER' || user.role === 'ADMIN')) {
                req.user = user;
                return next();
            }
        } catch {}
    }
    // Fallback to active teacher in database
    try {
        const teacher = await User.findOne({ role: 'TEACHER' }) || await User.findOne({ role: 'ADMIN' });
        if (teacher) {
            req.user = teacher;
            return next();
        }
    } catch {}
    return res.status(401).json({ success: false, message: 'Teacher authentication required' });
};

router.route('/')
    .get(getLiveClasses)
    .post(teacherAuthWithFallback, scheduleLiveClass);

router.route('/:id')
    .get(getLiveClassById)
    .delete(teacherAuthWithFallback, deleteLiveClass);

router.route('/:id/status')
    .patch(teacherAuthWithFallback, updateLiveClassStatus);

module.exports = router;

