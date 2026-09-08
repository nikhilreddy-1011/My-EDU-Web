const express = require('express');
const {
    enrollInCourse,
    getMyEnrollments,
    updateProgress,
    getMyCoursesList,
    getStudentDashboard,
    completeLesson,
    getCourseEnrollment,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, enrollInCourse);
router.get('/my', protect, getMyEnrollments);
router.get('/dashboard', protect, getStudentDashboard);
router.get('/my-courses', protect, getMyCoursesList);
router.get('/course/:courseId', protect, getCourseEnrollment);
router.post('/:courseId/lessons/:lessonId/complete', protect, completeLesson);
router.patch('/:id/progress', protect, updateProgress);

module.exports = router;
