const express = require('express');
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getMyCourses,
    checkCourseAccess,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCourses);
router.get('/my', protect, authorize('TEACHER', 'ADMIN'), getMyCourses);
router.get('/:id/access', protect, checkCourseAccess);
router.get('/:id', getCourse);
router.post('/', protect, authorize('TEACHER', 'ADMIN'), createCourse);
router.put('/:id', protect, authorize('TEACHER', 'ADMIN'), updateCourse);
router.delete('/:id', protect, authorize('TEACHER', 'ADMIN'), deleteCourse);

module.exports = router;
