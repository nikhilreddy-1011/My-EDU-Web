const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required for course-specific conversations'],
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student is required'],
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Teacher is required'],
        },
        lastMessage: {
            type: String,
            default: '',
        },
        lastMessageSender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        unreadStudent: {
            type: Number,
            default: 0,
        },
        unreadTeacher: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// One conversation per student-course-teacher tuple
conversationSchema.index({ student: 1, course: 1, teacher: 1 }, { unique: true });
conversationSchema.index({ student: 1, lastMessageAt: -1 });
conversationSchema.index({ teacher: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
