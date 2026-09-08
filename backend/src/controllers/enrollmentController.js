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

// @desc   Get user's enrolled courses separated into inProgress and completed
// @route  GET /api/v1/enrollments/my-courses
// @access Private (STUDENT)
const getMyCoursesList = async (req, res, next) => {
    try {
        const studentId = req.user._id;
        const enrollments = await Enrollment.find({
            student: studentId,
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

        enrollments.forEach((enr) => {
            if (!enr.course) return;
            const course = enr.course;
            const modules = course.modules || [];
            const allLessons = modules.flatMap((m) => m.lessons || []);
            const totalLessons = course.totalLessons || allLessons.length || 1;
            const completedCount = Array.isArray(enr.completedLessons) ? enr.completedLessons.length : 0;
            const progress = Math.min(100, Math.max(0, Math.round((completedCount / totalLessons) * 100)));
            const isCompleted = progress >= 100 || Boolean(enr.completedAt);

            const item = {
                id: enr._id,
                courseId: course._id,
                title: course.title,
                thumbnail: course.thumbnail,
                category: course.category,
                level: course.level,
                instructor: {
                    _id: course.instructor?._id,
                    name: course.instructor?.name || 'Instructor',
                    avatar: course.instructor?.avatar || '',
                },
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
                completed.push(item);
            } else {
                inProgress.push(item);
            }
        });

        res.status(200).json({
            success: true,
            totalCount: enrollments.length,
            inProgressCount: inProgress.length,
            completedCount: completed.length,
            inProgress,
            completed,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get authenticated student's dynamic learning dashboard metrics
// @route  GET /api/v1/enrollments/dashboard
// @access Private (STUDENT)
const getStudentDashboard = async (req, res, next) => {
    try {
        const studentId = req.user._id;

        const enrollments = await Enrollment.find({
            student: studentId,
            status: 'paid',
        })
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name avatar email bio' },
                select: 'title description thumbnail category level totalLessons totalDuration instructor price isFree modules',
            })
            .sort({ lastAccessedAt: -1 });

        let totalCompletedLessons = 0;
        let totalCourseLessons = 0;
        let totalCompletedMinutes = 0;

        const inProgress = [];
        const completed = [];
        const continueLearning = [];

        enrollments.forEach((enr) => {
            if (!enr.course) return;

            const course = enr.course;
            const modules = course.modules || [];
            const allLessons = modules.flatMap((m) => m.lessons || []);
            const totalLessons = course.totalLessons || allLessons.length || 1;
            const completedCount = Array.isArray(enr.completedLessons) ? enr.completedLessons.length : 0;
            const progress = Math.min(100, Math.max(0, Math.round((completedCount / totalLessons) * 100)));
            const isCompleted = progress >= 100 || Boolean(enr.completedAt);

            totalCompletedLessons += completedCount;
            totalCourseLessons += totalLessons;

            // Calculate learning hours based on completed lesson durations
            if (completedCount > 0 && allLessons.length > 0) {
                const completedSet = new Set(enr.completedLessons);
                allLessons.forEach((l) => {
                    if (completedSet.has(l._id?.toString()) || completedSet.has(l.id)) {
                        totalCompletedMinutes += l.duration || 10;
                    }
                });
            }

            // Determine active/resume lesson
            let activeLesson = null;
            if (enr.currentLesson) {
                activeLesson = allLessons.find(
                    (l) => l._id?.toString() === enr.currentLesson || l.id === enr.currentLesson
                );
            }
            if (!activeLesson && allLessons.length > 0) {
                const completedSet = new Set(enr.completedLessons || []);
                activeLesson = allLessons.find(
                    (l) => !completedSet.has(l._id?.toString()) && !completedSet.has(l.id)
                ) || allLessons[0];
            }

            const item = {
                id: enr._id,
                enrollmentId: enr._id,
                courseId: course._id,
                progress,
                completedLessons: enr.completedLessons || [],
                completedCount,
                totalLessons,
                lastAccessedAt: enr.lastAccessedAt,
                completedAt: enr.completedAt,
                currentLesson: activeLesson ? {
                    id: activeLesson._id || activeLesson.id,
                    title: activeLesson.title,
                    duration: activeLesson.duration,
                } : null,
                course: {
                    _id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    level: course.level,
                    instructor: {
                        name: course.instructor?.name || 'Instructor',
                        avatar: course.instructor?.avatar || '',
                    },
                },
            };

            if (isCompleted) {
                completed.push(item);
            } else {
                inProgress.push(item);
            }

            // Continue learning: active courses that are not yet finished
            if (!isCompleted) {
                continueLearning.push(item);
            }
        });

        // Calculate student's overall progress (0% if no enrollments)
        const overallProgress = totalCourseLessons > 0
            ? Math.min(100, Math.round((totalCompletedLessons / totalCourseLessons) * 100))
            : 0;

        const learningHours = Math.round((totalCompletedMinutes / 60) * 10) / 10;

        // Fetch real weekly activity for student
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let activities = [];
        try {
            const LearningActivity = require('../models/LearningActivity');
            activities = await LearningActivity.find({
                user: studentId,
                createdAt: { $gte: weekAgo },
            });
        } catch {}

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyMap = {
            Mon: { day: 'Mon', hours: 0, lessonsCompleted: 0 },
            Tue: { day: 'Tue', hours: 0, lessonsCompleted: 0 },
            Wed: { day: 'Wed', hours: 0, lessonsCompleted: 0 },
            Thu: { day: 'Thu', hours: 0, lessonsCompleted: 0 },
            Fri: { day: 'Fri', hours: 0, lessonsCompleted: 0 },
            Sat: { day: 'Sat', hours: 0, lessonsCompleted: 0 },
            Sun: { day: 'Sun', hours: 0, lessonsCompleted: 0 },
        };

        activities.forEach((act) => {
            const d = days[new Date(act.createdAt).getDay()];
            if (weeklyMap[d]) {
                weeklyMap[d].hours += Math.round(((act.durationMinutes || 15) / 60) * 10) / 10;
                if (act.activityType === 'lesson_completed') {
                    weeklyMap[d].lessonsCompleted += 1;
                }
            }
        });

        const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
            (d) => weeklyMap[d]
        );

        // Compute streak based on distinct active days
        let streak = 0;
        try {
            const LearningActivity = require('../models/LearningActivity');
            const recentActs = await LearningActivity.find({ user: studentId })
                .sort({ createdAt: -1 })
                .limit(30);
            const distinctDates = new Set(
                recentActs.map((a) => new Date(a.createdAt).toISOString().split('T')[0])
            );
            streak = distinctDates.size;
        } catch {}

        res.status(200).json({
            success: true,
            stats: {
                overallProgress,
                coursesInProgress: inProgress.length,
                coursesCompleted: completed.length,
                learningHours,
                currentStreak: streak,
                totalEnrolled: enrollments.length,
                weeklyActivity,
            },
            continueLearning: continueLearning.slice(0, 5),
            inProgress,
            completed,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Mark a lesson complete and update student-isolated enrollment progress
// @route  POST /api/v1/enrollments/:courseId/lessons/:lessonId/complete
// @access Private (STUDENT)
const completeLesson = async (req, res, next) => {
    try {
        const { courseId, lessonId } = req.params;
        const studentId = req.user._id;

        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: 'paid',
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found. Please enroll in this course first.',
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Find lesson in course modules
        let foundLesson = null;
        if (course.modules) {
            for (const mod of course.modules) {
                if (mod.lessons) {
                    const l = mod.lessons.find(
                        (less) => less._id?.toString() === lessonId || less.id === lessonId
                    );
                    if (l) {
                        foundLesson = l;
                        break;
                    }
                }
            }
        }

        const isNewCompletion = !enrollment.completedLessons.includes(lessonId);

        if (isNewCompletion) {
            enrollment.completedLessons.push(lessonId);
        }

        enrollment.currentLesson = lessonId;
        enrollment.lastAccessedAt = new Date();

        const allLessons = (course.modules || []).flatMap((m) => m.lessons || []);
        const totalLessons = course.totalLessons || allLessons.length || 1;
        enrollment.progress = Math.min(
            100,
            Math.round((enrollment.completedLessons.length / totalLessons) * 100)
        );

        const justCompletedCourse = enrollment.progress >= 100 && !enrollment.completedAt;
        if (enrollment.progress >= 100) {
            enrollment.completedAt = enrollment.completedAt || new Date();
        }

        await enrollment.save();

        // Record real learning activity
        try {
            const LearningActivity = require('../models/LearningActivity');
            await LearningActivity.create({
                user: studentId,
                course: courseId,
                lessonId: lessonId,
                lessonTitle: foundLesson?.title || 'Lesson Completed',
                activityType: 'lesson_completed',
                durationMinutes: foundLesson?.duration || 15,
            });

            if (justCompletedCourse) {
                await LearningActivity.create({
                    user: studentId,
                    course: courseId,
                    activityType: 'course_completed',
                    metadata: { courseTitle: course.title },
                });

                // Generate in-app notification for course completion
                const Notification = require('../models/Notification');
                await Notification.create({
                    user: studentId,
                    title: `Congratulations! 🎓`,
                    message: `You have successfully completed "${course.title}". Claim your certificate now!`,
                    type: 'ACHIEVEMENT',
                    link: `/student/certificates?courseId=${courseId}`,
                });
            }
        } catch (actErr) {
            console.error('Failed to log learning activity:', actErr.message);
        }

        res.status(200).json({
            success: true,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons,
            currentLesson: enrollment.currentLesson,
            isCompleted: enrollment.progress >= 100,
            enrollment,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get logged-in student's enrollment for a specific course
// @route  GET /api/v1/enrollments/course/:courseId
// @access Private (STUDENT)
const getCourseEnrollment = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: 'paid',
        });

        if (!enrollment) {
            return res.status(200).json({
                success: true,
                isEnrolled: false,
                enrollment: null,
            });
        }

        res.status(200).json({
            success: true,
            isEnrolled: true,
            enrollment,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    enrollInCourse,
    getMyEnrollments,
    updateProgress,
    getMyCoursesList,
    getStudentDashboard,
    completeLesson,
    getCourseEnrollment,
};
