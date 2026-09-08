const User = require('../models/User');
const Enrollment = require('../models/Enrollment');

// @desc   Get own profile
// @route  GET /api/v1/users/profile
// @access Private
const getProfile = async (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            bio: req.user.bio,
            title: req.user.title || '',
            createdAt: req.user.createdAt,
        },
    });
};

// @desc   Update own profile
// @route  PATCH /api/v1/users/profile
// @access Private
const updateProfile = async (req, res, next) => {
    try {
        const { name, bio, avatar, title } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar !== undefined) updateData.avatar = avatar;
        if (title !== undefined) updateData.title = title;

        const user = await User.findByIdAndUpdate(req.user._id, updateData, {
            returnDocument: 'after',
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                title: user.title || '',
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Change password
// @route  PATCH /api/v1/users/password
// @access Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Both current and new password are required' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc   Get all users (admin only)
// @route  GET /api/v1/users
// @access Private (ADMIN)
const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProfile, updateProfile, changePassword, getAllUsers };
