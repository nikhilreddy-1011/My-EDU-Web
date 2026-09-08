const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        quizId: {
            type: String,
            required: true,
            index: true,
        },
        quizTitle: {
            type: String,
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            default: null,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        passingScore: {
            type: Number,
            default: 70,
        },
        isPassed: {
            type: Boolean,
            required: true,
        },
        totalQuestions: {
            type: Number,
            default: 0,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        answers: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

quizAttemptSchema.index({ student: 1, quizId: 1, completedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
