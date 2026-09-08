const Notification = require('../models/Notification');

// @desc   Get user's notifications & unread count
// @route  GET /api/v1/notifications
// @access Private
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Mark a notification as read
// @route  PATCH /api/v1/notifications/:id/read
// @access Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: { read: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });

        res.status(200).json({
            success: true,
            notification,
            unreadCount,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Mark all notifications as read
// @route  PATCH /api/v1/notifications/read-all
// @access Private
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            unreadCount: 0,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Delete a notification
// @route  DELETE /api/v1/notifications/:id
// @access Private
const deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        res.status(200).json({ success: true, message: 'Notification removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
