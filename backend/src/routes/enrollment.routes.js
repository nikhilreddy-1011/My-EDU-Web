const express = require('express');
const { enrollInCourse, getMyEnrollments, updateProgress, getMyCoursesList } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, enrollInCourse);
router.get('/my', protect, getMyEnrollments);
router.get('/my-courses', protect, getMyCoursesList);
router.patch('/:id/progress', protect, updateProgress);

module.exports = router;
