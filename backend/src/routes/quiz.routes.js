const express = require('express');
const { getMyQuizAttempts, submitQuizAttempt } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/attempts/my', protect, getMyQuizAttempts);
router.get('/attempts', protect, getMyQuizAttempts);
router.post('/attempts', protect, submitQuizAttempt);

module.exports = router;
