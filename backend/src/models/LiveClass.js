const mongoose = require('mongoose');

const LiveClassSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Class title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    },
    courseTitle: {
        type: String,
        default: 'General Session',
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    instructorName: {
        type: String,
        required: true,
    },
    instructorAvatar: {
        type: String,
        default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor',
    },
    scheduledAt: {
        type: Date,
        required: [true, 'Class scheduled date and time is required'],
    },
    duration: {
        type: Number,
        default: 60, // minutes
    },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'],
        default: 'UPCOMING',
    },
    attendeesCount: {
        type: Number,
        default: 0,
    },
    maxSeats: {
        type: Number,
        default: 500,
    },
    platform: {
        type: String,
        default: 'in-app',
    },
    meetingId: {
        type: String,
        unique: true,
        required: true,
    },
    meetingUrl: {
        type: String,
    },
    tags: [{
        type: String,
    }],
    recordingUrl: {
        type: String,
    },
}, {
    timestamps: true,
});

LiveClassSchema.index({ status: 1, scheduledAt: 1 });
LiveClassSchema.index({ instructor: 1 });

module.exports = mongoose.model('LiveClass', LiveClassSchema);
