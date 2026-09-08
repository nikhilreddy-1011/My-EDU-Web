const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        completedLessons: [
            {
                type: String, // lesson _id as string
            },
        ],
        lastAccessedAt: {
            type: Date,
            default: Date.now,
        },
        completedAt: {
            type: Date,
            default: null,
        },
        paymentId: {
            type: String,
            default: '',
        },
        orderId: {
            type: String,
            default: '',
        },
        amount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'paid',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: user alias for student
enrollmentSchema.virtual('user').get(function () {
    return this.student;
});

// Each student can only enroll once per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
