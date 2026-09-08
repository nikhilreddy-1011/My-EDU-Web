const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// @desc   Get logged-in student's earned certificates
// @route  GET /api/v1/certificates
// @access Private (STUDENT)
const getMyCertificates = async (req, res, next) => {
    try {
        const certificates = await Certificate.find({ student: req.user._id })
            .populate({
                path: 'course',
                select: 'title description thumbnail category level totalLessons totalDuration',
                populate: { path: 'instructor', select: 'name avatar bio' },
            })
            .populate('instructor', 'name avatar')
            .sort({ issueDate: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            certificates,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Claim/generate a certificate upon satisfying 100% course completion
// @route  POST /api/v1/certificates/claim/:courseId
// @access Private (STUDENT)
const claimCertificate = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user._id;

        const course = await Course.findById(courseId).populate('instructor', 'name avatar');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if certificate already exists
        let existingCert = await Certificate.findOne({ student: studentId, course: courseId })
            .populate('course', 'title thumbnail category totalLessons')
            .populate('instructor', 'name avatar');

        if (existingCert) {
            return res.status(200).json({
                success: true,
                message: 'Certificate already claimed',
                certificate: existingCert,
            });
        }

        // Verify that the student is enrolled and has completed the course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: 'paid',
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course.',
            });
        }

        const totalLessons = course.totalLessons || 1;
        const completedLessonsCount = Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.length : 0;
        const progress = Math.min(100, Math.max(enrollment.progress || 0, Math.round((completedLessonsCount / totalLessons) * 100)));

        if (progress < 100 && !enrollment.completedAt) {
            return res.status(400).json({
                success: false,
                message: `Course requirements not satisfied yet. You have completed ${progress}% of the course.`,
                progress,
                completedLessons: completedLessonsCount,
                totalLessons,
            });
        }

        // Generate unique certificate ID: e.g. CERT-LS-839201
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const certificateId = `CERT-LS-${randomNum}`;

        const newCert = await Certificate.create({
            student: studentId,
            course: courseId,
            instructor: course.instructor._id,
            certificateId,
            issueDate: new Date(),
            grade: 'Excellence in Completion',
        });

        // Create in-app notification
        try {
            const notif = await Notification.create({
                user: studentId,
                type: 'certificate',
                title: '🏆 Certificate Unlocked!',
                message: `Congratulations! You have earned your certificate for ${course.title}.`,
                link: '/student/certificates',
                metadata: { certificateId, courseId },
            });

            const io = getIO();
            if (io) {
                io.to(`user_${studentId.toString()}`).emit('new_notification', notif);
            }
        } catch (e) {}

        const populated = await Certificate.findById(newCert._id)
            .populate('course', 'title thumbnail category totalLessons')
            .populate('instructor', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Certificate successfully issued!',
            certificate: populated,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get public verifiable certificate by ID
// @route  GET /api/v1/certificates/verify/:certificateId
// @access Public
const verifyCertificate = async (req, res, next) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId })
            .populate('student', 'name email avatar')
            .populate('course', 'title thumbnail category')
            .populate('instructor', 'name avatar');

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
        }

        res.status(200).json({
            success: true,
            verified: true,
            certificate,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyCertificates,
    claimCertificate,
    verifyCertificate,
};
