const LiveClass = require('../models/LiveClass');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Helper to seed initial sample classes if empty
const seedDefaultClassesIfEmpty = async () => {
    try {
        const count = await LiveClass.countDocuments();
        if (count === 0) {
            const User = require('../models/User');
            const teacher = await User.findOne({ role: 'TEACHER' });
            const teacherId = teacher ? teacher._id : null;
            const teacherName = teacher ? teacher.name : 'Dr. Sarah Mitchell';
            const teacherAvatar = teacher ? teacher.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah';

            const now = Date.now();
            const defaultClasses = [
                {
                    title: 'Advanced React Patterns & Micro-Frontends Architecture',
                    description: 'Deep dive into concurrent mode, Server Components, and real-world micro-frontend orchestration.',
                    courseTitle: 'Full-Stack Web Development Bootcamp',
                    instructor: teacherId || '6a9e82d2f12fd2a46e309234',
                    instructorName: teacherName,
                    instructorAvatar: teacherAvatar,
                    scheduledAt: new Date(now - 15 * 60 * 1000), // started 15 min ago -> LIVE NOW
                    duration: 90,
                    status: 'LIVE',
                    attendeesCount: 42,
                    maxSeats: 500,
                    platform: 'in-app',
                    meetingId: 'lc_live_now_1',
                    tags: ['React', 'Architecture', 'Next.js'],
                },
                {
                    title: 'Interactive System Design: High-Scale Distributed Cache',
                    description: 'Designing a Redis/Memcached cluster handling 500k RPS with write-through consistency.',
                    courseTitle: 'System Design & Distributed Systems',
                    instructor: teacherId || '6a9e82d2f12fd2a46e309234',
                    instructorName: teacherName,
                    instructorAvatar: teacherAvatar,
                    scheduledAt: new Date(now + 2 * 3600 * 1000), // in 2 hours
                    duration: 60,
                    status: 'UPCOMING',
                    attendeesCount: 0,
                    maxSeats: 300,
                    platform: 'in-app',
                    meetingId: 'lc_upcoming_1',
                    tags: ['System Design', 'Backend', 'Redis'],
                },
                {
                    title: 'Figma Auto-Layout & Design Tokens to Production CSS',
                    description: 'Bridge the gap between design tokens and production React styling with Tailwind & Vanilla CSS.',
                    courseTitle: 'UI/UX Design Masterclass: From Figma to Code',
                    instructor: teacherId || '6a9e82d2f12fd2a46e309234',
                    instructorName: teacherName,
                    instructorAvatar: teacherAvatar,
                    scheduledAt: new Date(now + 24 * 3600 * 1000), // tomorrow
                    duration: 75,
                    status: 'UPCOMING',
                    attendeesCount: 0,
                    maxSeats: 500,
                    platform: 'in-app',
                    meetingId: 'lc_upcoming_2',
                    tags: ['UI/UX', 'Figma', 'CSS'],
                },
            ];

            await LiveClass.insertMany(defaultClasses);
        }
    } catch (err) {
        console.error('Failed to seed default live classes:', err.message);
    }
};

// @desc   Get all live classes (live, upcoming, completed)
// @route  GET /api/v1/live-classes
// @access Public / Private
const getLiveClasses = async (req, res, next) => {
    try {
        await seedDefaultClassesIfEmpty();

        const { status, courseId, instructorId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (courseId) filter.course = courseId;
        if (instructorId) filter.instructor = instructorId;

        const classes = await LiveClass.find(filter)
            .populate('instructor', 'name avatar email bio')
            .populate('course', 'title thumbnail category')
            .sort({ scheduledAt: 1 });

        // Categorize for easy frontend consumption
        const liveNow = classes.filter(c => c.status === 'LIVE');
        const upcoming = classes.filter(c => c.status === 'UPCOMING');
        const completed = classes.filter(c => c.status === 'COMPLETED');

        res.status(200).json({
            success: true,
            totalCount: classes.length,
            classes,
            liveNow,
            upcoming,
            completed,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Schedule a new live class
// @route  POST /api/v1/live-classes
// @access Private (TEACHER, ADMIN)
const scheduleLiveClass = async (req, res, next) => {
    try {
        const {
            title,
            description,
            course: courseId,
            date,
            scheduledAt,
            duration,
            maxSeats,
            platform,
            tags,
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Class title is required' });
        }

        const classDate = scheduledAt || date;
        if (!classDate) {
            return res.status(400).json({ success: false, message: 'Scheduled date and time is required' });
        }

        let courseTitle = 'General Live Session';
        let matchedCourse = null;

        if (courseId && courseId !== 'c1' && courseId !== 'all') {
            try {
                matchedCourse = await Course.findById(courseId);
                if (matchedCourse) {
                    courseTitle = matchedCourse.title;
                }
            } catch {
                // ignore invalid courseId format
            }
        }

        const meetingId = `lc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const newClass = await LiveClass.create({
            title: title.trim(),
            description: description ? description.trim() : '',
            course: matchedCourse ? matchedCourse._id : undefined,
            courseTitle,
            instructor: req.user ? req.user._id : undefined,
            instructorName: req.user ? req.user.name : 'Lead Instructor',
            instructorAvatar: (req.user && req.user.avatar) ? req.user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor',
            scheduledAt: new Date(classDate),
            duration: Number(duration) || 60,
            maxSeats: Number(maxSeats) || 500,
            platform: platform || 'in-app',
            meetingId,
            tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
            status: 'UPCOMING',
        });

        // Broadcast to all connected clients via Socket.IO
        try {
            const io = getIO();
            if (io) {
                io.emit('live_class_scheduled', newClass);
            }
        } catch {
            // ignore socket errors if offline
        }

        // Notify students enrolled in this course or all students
        try {
            let targetStudentIds = [];
            if (matchedCourse) {
                const enrollments = await Enrollment.find({ course: matchedCourse._id }).select('student');
                targetStudentIds = enrollments.map(e => e.student);
            }

            if (targetStudentIds.length > 0) {
                const notifs = targetStudentIds.map(studentId => ({
                    user: studentId,
                    type: 'live_class',
                    title: `Live Class Scheduled: ${newClass.title}`,
                    message: `Instructor ${req.user.name} scheduled a new live session for ${new Date(newClass.scheduledAt).toLocaleDateString()} at ${new Date(newClass.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
                    link: `/student/live-classes/${newClass.meetingId}`,
                    metadata: { liveClassId: newClass._id, meetingId: newClass.meetingId },
                }));
                await Notification.insertMany(notifs);
            }
        } catch (notifErr) {
            console.error('Failed to dispatch notifications for live class:', notifErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Live class scheduled successfully!',
            liveClass: newClass,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get single live class by ID or meetingId
// @route  GET /api/v1/live-classes/:id
// @access Public / Private
const getLiveClassById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let liveClass = await LiveClass.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }]
        })
        .populate('instructor', 'name avatar email bio')
        .populate('course', 'title thumbnail category');

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found' });
        }

        res.status(200).json({
            success: true,
            liveClass,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Update live class status (e.g. start class -> LIVE, end class -> COMPLETED)
// @route  PATCH /api/v1/live-classes/:id/status
// @access Private (TEACHER, ADMIN)
const updateLiveClassStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }

        const liveClass = await LiveClass.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }]
        });

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found' });
        }

        // Verify ownership (or allow TEACHER / ADMIN)
        if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER' && liveClass.instructor && liveClass.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this live class' });
        }

        liveClass.status = status;
        await liveClass.save();

        // Broadcast status update
        try {
            const io = getIO();
            if (io) {
                io.emit('live_class_status_changed', {
                    id: liveClass._id,
                    meetingId: liveClass.meetingId,
                    status: liveClass.status,
                });
            }
        } catch {}

        res.status(200).json({
            success: true,
            message: `Live class status changed to ${status}`,
            liveClass,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Delete / Cancel live class
// @route  DELETE /api/v1/live-classes/:id
// @access Private (TEACHER, ADMIN)
const deleteLiveClass = async (req, res, next) => {
    try {
        const { id } = req.params;

        const liveClass = await LiveClass.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }]
        });

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found' });
        }

        if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER' && liveClass.instructor && liveClass.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this live class' });
        }

        await LiveClass.findByIdAndDelete(liveClass._id);

        res.status(200).json({
            success: true,
            message: 'Live class deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Verify whether authenticated user has access to join a live class
// @route  GET /api/v1/live-classes/:id/access
// @access Private (STUDENT, TEACHER, ADMIN)
const checkLiveClassAccess = async (req, res, next) => {
    try {
        const { id } = req.params;
        const liveClass = await LiveClass.findOne({
            $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { meetingId: id }]
        })
        .populate('instructor', 'name avatar email')
        .populate('course', 'title thumbnail instructor isFree price students');

        if (!liveClass) {
            return res.status(404).json({ success: false, message: 'Live class not found' });
        }

        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';

        if (isTeacher) {
            // Check if teacher created the live class or instructs the course
            const isCreator = liveClass.instructor && (liveClass.instructor._id || liveClass.instructor).toString() === user._id.toString();
            const isCourseInstructor = liveClass.course && liveClass.course.instructor && liveClass.course.instructor.toString() === user._id.toString();

            if (!isCreator && !isCourseInstructor && user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    authorized: false,
                    message: 'You are not authorized to host this live class. You do not teach this course.',
                });
            }

            return res.status(200).json({
                success: true,
                authorized: true,
                isTeacher: true,
                role: user.role,
                liveClass,
            });
        }

        // Student Access Control:
        // If liveClass is linked to a course, verify enrollment
        if (liveClass.course) {
            const courseId = liveClass.course._id || liveClass.course;
            const course = liveClass.course;

            // Check if course is free or student is enrolled
            const isFree = course.isFree || course.price === 0;
            if (!isFree) {
                const enrollment = await Enrollment.findOne({
                    student: user._id,
                    course: courseId,
                });

                const isEnrolled = enrollment && (enrollment.status === 'paid' || enrollment.status === 'active');
                const isStudentInCourseArray = Array.isArray(course.students) && course.students.some(s => s.toString() === user._id.toString());

                if (!isEnrolled && !isStudentInCourseArray) {
                    return res.status(403).json({
                        success: false,
                        authorized: false,
                        message: `Access denied. Please enroll in "${course.title || 'the course'}" to attend this live session.`,
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            authorized: true,
            isTeacher: false,
            role: 'STUDENT',
            liveClass,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLiveClasses,
    scheduleLiveClass,
    getLiveClassById,
    updateLiveClassStatus,
    deleteLiveClass,
    checkLiveClassAccess,
};

