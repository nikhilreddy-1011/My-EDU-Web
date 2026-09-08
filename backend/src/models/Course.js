const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // in minutes
    order: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
});

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Course title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            required: [true, 'Course description is required'],
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        shortDescription: {
            type: String,
            maxlength: [300, 'Short description cannot exceed 300 characters'],
            default: '',
        },
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        thumbnail: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative'],
        },
        originalPrice: {
            type: Number,
            default: 0,
        },
        isFree: {
            type: Boolean,
            default: false,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            enum: [
                'Web Development',
                'Mobile Development',
                'Data Science',
                'Machine Learning',
                'DevOps',
                'Cybersecurity',
                'UI/UX Design',
                'Business',
                'Marketing',
                'Other',
            ],
        },
        level: {
            type: String,
            enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
            default: 'BEGINNER',
        },
        tags: [{ type: String, lowercase: true }],
        modules: [moduleSchema],
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        rating: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
        language: { type: String, default: 'English' },
        published: { type: Boolean, default: false },
        featured: { type: Boolean, default: false },
        totalDuration: { type: Number, default: 0 }, // in minutes
        totalLessons: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: student count
courseSchema.virtual('studentCount').get(function () {
    return Array.isArray(this.students) ? this.students.length : 0;
});

// Text index for search
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Auto-compute totalDuration, totalLessons and isFree before save
courseSchema.pre('save', function () {
    let totalDuration = 0;
    let totalLessons = 0;
    this.modules.forEach((mod) => {
        mod.lessons.forEach((lesson) => {
            totalDuration += lesson.duration || 0;
            totalLessons += 1;
        });
    });
    this.totalDuration = totalDuration;
    this.totalLessons = totalLessons;
    if (this.price === 0) {
        this.isFree = true;
    }
});

module.exports = mongoose.model('Course', courseSchema);
