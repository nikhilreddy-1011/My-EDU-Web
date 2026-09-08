const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        certificateId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        grade: {
            type: String,
            default: 'Excellence in Completion',
        },
        pdfUrl: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// One certificate per student per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
