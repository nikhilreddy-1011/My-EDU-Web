const mongoose = require('mongoose');

const learningActivitySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: false,
        },
        lessonId: {
            type: String,
            default: '',
        },
        lessonTitle: {
            type: String,
            default: '',
        },
        activityType: {
            type: String,
            enum: ['lesson_completed', 'course_enrolled', 'quiz_completed', 'course_completed', 'certificate_claimed'],
            required: true,
        },
        durationMinutes: {
            type: Number,
            default: 0,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

learningActivitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('LearningActivity', learningActivitySchema);
