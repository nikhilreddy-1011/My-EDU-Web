const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc   Get all published courses (with filters)
// @route  GET /api/v1/courses
// @access Public
const getCourses = async (req, res, next) => {
    try {
        const { category, level, search, page = 1, limit = 12, featured } = req.query;

        const query = { published: true };

        if (category) query.category = category;
        if (level) query.level = level;
        if (featured === 'true') query.featured = true;
        if (search) {
            query.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Course.countDocuments(query);

        const courses = await Course.find(query)
            .populate('instructor', 'name avatar bio')
            .select('-modules -students')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: courses.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            courses,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get single course
// @route  GET /api/v1/courses/:id
// @access Public
const getCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name avatar bio');

        if (!course || !course.published) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, course });
    } catch (error) {
        next(error);
    }
};

// @desc   Create course
// @route  POST /api/v1/courses
// @access Private (TEACHER, ADMIN)
const createCourse = async (req, res, next) => {
    try {
        req.body.instructor = req.user._id;
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, course });
    } catch (error) {
        next(error);
    }
};

// @desc   Update course
// @route  PUT /api/v1/courses/:id
// @access Private (owner TEACHER, ADMIN)
const updateCourse = async (req, res, next) => {
    try {
        let course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Only instructor or admin can update
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
        }

        course = await Course.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('instructor', 'name avatar');

        res.status(200).json({ success: true, course });
    } catch (error) {
        next(error);
    }
};

// @desc   Delete course
// @route  DELETE /api/v1/courses/:id
// @access Private (owner TEACHER, ADMIN)
const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
        }

        await course.deleteOne();
        await Enrollment.deleteMany({ course: req.params.id });

        res.status(200).json({ success: true, message: 'Course deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc   Get courses created by the logged-in instructor
// @route  GET /api/v1/courses/my
// @access Private (TEACHER, ADMIN)
const getMyCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({ instructor: req.user._id })
            .select('-students')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: courses.length, courses });
    } catch (error) {
        next(error);
    }
};

// @desc   Check if currently logged-in student has access to a course
// @route  GET /api/v1/courses/:id/access
// @access Private
const checkCourseAccess = async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const course = await Course.findById(courseId).select('title price originalPrice isFree thumbnail instructor published');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Teachers who own the course or Admins always have access
        if (course.instructor.toString() === req.user._id.toString() || req.user.role === 'ADMIN') {
            return res.status(200).json({
                success: true,
                hasAccess: true,
                isEnrolled: true,
                isOwner: true,
                course: {
                    _id: course._id,
                    title: course.title,
                    price: course.price,
                    isFree: course.isFree || course.price === 0,
                    thumbnail: course.thumbnail,
                },
            });
        }

        // Check if student has valid enrollment
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId,
            status: 'paid',
        });

        const hasAccess = Boolean(enrollment);

        res.status(200).json({
            success: true,
            hasAccess,
            isEnrolled: hasAccess,
            isFree: Boolean(course.isFree || course.price === 0),
            price: course.price,
            course: {
                _id: course._id,
                title: course.title,
                price: course.price,
                isFree: course.isFree || course.price === 0,
                thumbnail: course.thumbnail,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getMyCourses,
    checkCourseAccess,
};
