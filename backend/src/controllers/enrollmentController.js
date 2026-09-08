const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc   Enroll in a course
// @route  POST /api/v1/enrollments
// @access Private (STUDENT)
const enrollInCourse = async (req, res, next) => {
    try {
        const { courseId } = req.body;

        const course = await Course.findById(courseId);
        if (!course || !course.published) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Paid courses must be purchased via Razorpay
        const isPaidCourse = course.price > 0 && !course.isFree;
        if (isPaidCourse) {
            return res.status(400).json({
                success: false,
                message: 'This is a paid course. Please purchase it to enroll.',
                isPaid: true,
                price: course.price,
            });
        }

        // Check if already enrolled
        const existing = await Enrollment.findOne({ student: req.user._id, course: courseId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: courseId,
            paymentId: 'free',
            orderId: 'free',
            amount: 0,
            status: 'paid',
        });

        // Add student to course.students array
        await Course.findByIdAndUpdate(courseId, { $addToSet: { students: req.user._id } });

        res.status(201).json({ success: true, enrollment });
    } catch (error) {
        next(error);
    }
};

// @desc   Get my enrollments
// @route  GET /api/v1/enrollments/my
// @access Private
const getMyEnrollments = async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user._id })
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name avatar' },
                select: 'title thumbnail category level rating totalLessons totalDuration instructor published',
            })
            .sort({ lastAccessedAt: -1 });

        res.status(200).json({ success: true, count: enrollments.length, enrollments });
    } catch (error) {
        next(error);
    }
};

// @desc   Update lesson progress
// @route  PATCH /api/v1/enrollments/:id/progress
// @access Private
const updateProgress = async (req, res, next) => {
    try {
        const { lessonId } = req.body;

        const enrollment = await Enrollment.findById(req.params.id);
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        if (enrollment.student.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Add lesson to completedLessons (no duplicates)
        if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
            enrollment.completedLessons.push(lessonId);
        }

        // Recalculate progress
        const course = await Course.findById(enrollment.course);
        const totalLessons = course?.totalLessons || 1;
        enrollment.progress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
        enrollment.lastAccessedAt = new Date();

        if (enrollment.progress >= 100) {
            enrollment.completedAt = new Date();
        }

        await enrollment.save();

        res.status(200).json({ success: true, enrollment });
    } catch (error) {
        next(error);
    }
};

// @desc   Get logged-in student's enrolled/purchased courses categorized by In Progress and Completed
// @route  GET /api/v1/enrollments/my-courses
// @access Private (STUDENT)
const getMyCoursesList = async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({
            student: req.user._id,
            status: 'paid',
        })
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name avatar email bio' },
                select: 'title description thumbnail category level totalLessons totalDuration instructor price isFree modules',
            })
            .sort({ lastAccessedAt: -1 });

        const inProgress = [];
        const completed = [];

        enrollments.forEach(enr => {
            if (!enr.course) return;

            const totalLessons = enr.course.totalLessons || (enr.course.modules ? enr.course.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.length : 0), 0) : 0) || 1;
            const completedCount = Array.isArray(enr.completedLessons) ? enr.completedLessons.length : 0;
            const progress = Math.min(100, Math.max(enr.progress || 0, Math.round((completedCount / totalLessons) * 100)));
            const isCompleted = progress >= 100 || Boolean(enr.completedAt);

            const courseItem = {
                enrollmentId: enr._id,
                courseId: enr.course._id,
                title: enr.course.title,
                description: enr.course.description,
                thumbnail: enr.course.thumbnail,
                category: enr.course.category,
                level: enr.course.level,
                instructor: enr.course.instructor,
                progress,
                completedLessons: completedCount,
                totalLessons,
                lastAccessedAt: enr.lastAccessedAt,
                completedAt: enr.completedAt,
                status: isCompleted ? 'Completed' : 'In Progress',
                paymentId: enr.paymentId,
                amount: enr.amount,
            };

            if (isCompleted) {
                completed.push(courseItem);
            } else {
                inProgress.push(courseItem);
            }
        });

        res.status(200).json({
            success: true,
            totalCount: inProgress.length + completed.length,
            inProgressCount: inProgress.length,
            completedCount: completed.length,
            inProgress,
            completed,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { enrollInCourse, getMyEnrollments, updateProgress, getMyCoursesList };
