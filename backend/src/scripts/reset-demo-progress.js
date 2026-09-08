const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Enrollment = require('../models/Enrollment');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');

const resetDemoProgress = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully.\n');

        console.log('--- 1. Resetting Enrollment Progress ---');
        // Reset all enrollments to 0 progress and empty completedLessons
        const enrollResult = await Enrollment.updateMany(
            {},
            {
                $set: {
                    progress: 0,
                    completedLessons: [],
                    currentLesson: '',
                    completedAt: null,
                    lastAccessedAt: new Date(),
                },
            }
        );
        console.log(`Reset ${enrollResult.modifiedCount} enrollment(s) to 0% progress and empty completedLessons.`);

        console.log('\n--- 2. Cleaning Demo Quiz Attempts ---');
        const quizResult = await QuizAttempt.deleteMany({});
        console.log(`Cleared ${quizResult.deletedCount} demo quiz attempt(s).`);

        console.log('\n--- 3. Cleaning Demo Learning Activities ---');
        const actResult = await LearningActivity.deleteMany({});
        console.log(`Cleared ${actResult.deletedCount} demo learning activity record(s).`);

        console.log('\n=============================================');
        console.log('✅ DEMO PROGRESS SAFELY RESET TO 0%');
        console.log('   - All Users preserved.');
        console.log('   - All Courses & Lessons preserved.');
        console.log('   - All Valid Enrollments & Payments preserved.');
        console.log('   - Every student now begins with 0% progress.');
        console.log('=============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Reset failed:', error);
        process.exit(1);
    }
};

resetDemoProgress();
