const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);
    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            createdAt: user.createdAt,
        },
    });
};

// @desc   Register user
// @route  POST /api/v1/auth/register
// @access Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }

        // Prevent self-assigning ADMIN
        const assignedRole = role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

        const user = await User.create({ name, email, password, role: assignedRole });
        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};

// @desc   Login user
// @route  POST /api/v1/auth/login
// @access Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc   Get current user
// @route  GET /api/v1/auth/me
// @access Private
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            bio: req.user.bio,
            createdAt: req.user.createdAt,
        },
    });
};

module.exports = { register, login, getMe };
