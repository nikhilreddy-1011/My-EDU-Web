const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');

// @desc   Get logged-in student's wishlist
// @route  GET /api/v1/wishlist
// @access Private (STUDENT)
const getWishlist = async (req, res, next) => {
    try {
        const items = await Wishlist.find({ student: req.user._id })
            .populate({
                path: 'course',
                populate: { path: 'instructor', select: 'name avatar bio' },
                select: 'title description thumbnail price originalPrice isFree category level rating studentCount totalLessons totalDuration',
            })
            .sort({ createdAt: -1 });

        const validCourses = items
            .filter(item => item.course != null)
            .map(item => ({
                wishlistId: item._id,
                savedAt: item.createdAt,
                ...item.course.toObject(),
            }));

        res.status(200).json({
            success: true,
            count: validCourses.length,
            wishlist: validCourses,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Add course to wishlist
// @route  POST /api/v1/wishlist/:courseId
// @access Private (STUDENT)
const addToWishlist = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const existing = await Wishlist.findOne({ student: req.user._id, course: courseId });
        if (existing) {
            return res.status(200).json({ success: true, message: 'Course is already in wishlist', item: existing });
        }

        const item = await Wishlist.create({
            student: req.user._id,
            course: courseId,
        });

        res.status(201).json({
            success: true,
            message: 'Course saved to wishlist',
            item,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Remove course from wishlist
// @route  DELETE /api/v1/wishlist/:courseId
// @access Private (STUDENT)
const removeFromWishlist = async (req, res, next) => {
    try {
        const { courseId } = req.params;

        const deleted = await Wishlist.findOneAndDelete({
            student: req.user._id,
            course: courseId,
        });

        res.status(200).json({
            success: true,
            message: deleted ? 'Course removed from wishlist' : 'Course was not in wishlist',
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Check if a course is in student's wishlist
// @route  GET /api/v1/wishlist/check/:courseId
// @access Private (STUDENT)
const checkWishlistStatus = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        const exists = await Wishlist.exists({ student: req.user._id, course: courseId });
        res.status(200).json({ success: true, isWishlisted: Boolean(exists) });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus,
};
