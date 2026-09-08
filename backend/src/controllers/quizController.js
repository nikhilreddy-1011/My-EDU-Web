const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const Notification = require('../models/Notification');

// @desc   Get logged-in student's quiz attempts
// @route  GET /api/v1/quizzes/attempts/my
// @access Private (STUDENT)
const getMyQuizAttempts = async (req, res, next) => {
    try {
        const studentId = req.user._id;

        const attempts = await QuizAttempt.find({ student: studentId })
            .populate('course', 'title thumbnail')
            .sort({ completedAt: -1 });

        const totalAttempts = attempts.length;
        const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const averageScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
        const passedCount = attempts.filter((a) => a.isPassed).length;

        res.status(200).json({
            success: true,
            count: totalAttempts,
            averageScore,
            passedCount,
            attempts,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Submit a quiz attempt and persist student-isolated score
// @route  POST /api/v1/quizzes/attempts
// @access Private (STUDENT)
const submitQuizAttempt = async (req, res, next) => {
    try {
        const studentId = req.user._id;
        const {
            quizId,
            quizTitle,
            courseId,
            score,
            passingScore = 70,
            totalQuestions = 0,
            correctAnswers = 0,
            answers = {},
        } = req.body;

        if (!quizId || !quizTitle) {
            return res.status(400).json({
                success: false,
                message: 'quizId and quizTitle are required',
            });
        }

        const numericScore = Number(score) || 0;
        const isPassed = numericScore >= Number(passingScore);

        const attempt = await QuizAttempt.create({
            student: studentId,
            quizId,
            quizTitle,
            course: courseId || null,
            score: numericScore,
            passingScore: Number(passingScore),
            isPassed,
            totalQuestions: Number(totalQuestions),
            correctAnswers: Number(correctAnswers),
            answers,
            completedAt: new Date(),
        });

        // Record student learning activity
        try {
            await LearningActivity.create({
                user: studentId,
                course: courseId || null,
                activityType: 'quiz_completed',
                metadata: {
                    quizId,
                    quizTitle,
                    score: numericScore,
                    isPassed,
                },
            });

            if (isPassed) {
                await Notification.create({
                    user: studentId,
                    title: 'Quiz Passed! 🎯',
                    message: `You scored ${numericScore}% on "${quizTitle}". Great job!`,
                    type: 'QUIZ',
                    link: `/student/quizzes`,
                });
            }
        } catch (e) {
            console.error('Quiz activity logging failed:', e.message);
        }

        res.status(201).json({
            success: true,
            attempt,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMyQuizAttempts,
    submitQuizAttempt,
};
