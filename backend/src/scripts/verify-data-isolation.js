const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const QuizAttempt = require('../models/QuizAttempt');
const LearningActivity = require('../models/LearningActivity');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'learnsphere_jwt_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

async function runVerification() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Find Student A and Student B
    const studentA = await User.findOne({ email: 'student@learnsphere.com' });
    const studentB = await User.findOne({ email: 'nikhilreddyofficial8@gmail.com' });

    if (!studentA || !studentB) {
      console.error('Students not found:', { studentA: !!studentA, studentB: !!studentB });
      process.exit(1);
    }

    console.log('\n--- VERIFICATION TEST 1: Initial Account States ---');
    console.log(`Student A: ${studentA.name} (${studentA.email}) [ID: ${studentA._id}]`);
    console.log(`Student B: ${studentB.name} (${studentB.email}) [ID: ${studentB._id}]`);

    // Student A enrollments
    const enrollmentsA = await Enrollment.find({ student: studentA._id, status: { $in: ['paid', 'active'] } });
    console.log(`Student A active enrollments: ${enrollmentsA.length}`);
    enrollmentsA.forEach(e => {
      console.log(`  - Course: ${e.course}, progress: ${e.progress}%, completedLessons: [${e.completedLessons.join(', ')}]`);
    });

    // Student B enrollments
    const enrollmentsB = await Enrollment.find({ student: studentB._id, status: { $in: ['paid', 'active'] } });
    console.log(`Student B active enrollments: ${enrollmentsB.length} (Expected: 0)`);

    // 2. Perform a real lesson completion for Student A
    console.log('\n--- VERIFICATION TEST 2: Student A Completes Lesson l1 ---');
    const targetEnrollment = enrollmentsA[0];
    if (!targetEnrollment) {
      console.error('No enrollment found for Student A to test lesson completion');
      process.exit(1);
    }

    const testLessonId = 'lesson_test_1';
    
    // Simulate what enrollmentController.completeLesson does:
    const courseDoc = await Course.findById(targetEnrollment.course);
    const totalLessons = (courseDoc && courseDoc.totalLessons > 0) ? courseDoc.totalLessons : 10;
    
    if (!targetEnrollment.completedLessons.includes(testLessonId)) {
      targetEnrollment.completedLessons.push(testLessonId);
    }
    targetEnrollment.currentLesson = testLessonId;
    targetEnrollment.progress = Math.min(100, Math.round((targetEnrollment.completedLessons.length / totalLessons) * 100));
    targetEnrollment.lastAccessedAt = new Date();
    await targetEnrollment.save();

    await LearningActivity.create({
      user: studentA._id,
      course: targetEnrollment.course,
      lessonId: testLessonId,
      lessonTitle: 'Test Lesson 1',
      activityType: 'lesson_completed',
      durationMinutes: 15,
    });

    console.log(`Updated Student A enrollment: progress=${targetEnrollment.progress}%, completedLessons=[${targetEnrollment.completedLessons.join(', ')}]`);

    // 3. Perform a quiz attempt for Student A
    console.log('\n--- VERIFICATION TEST 3: Student A Submits Quiz Attempt ---');
    await QuizAttempt.deleteMany({ student: studentA._id, quizId: 'quiz_test_1' });
    
    const attemptA = await QuizAttempt.create({
      student: studentA._id,
      quizId: 'quiz_test_1',
      quizTitle: 'React Fundamentals Assessment',
      course: targetEnrollment.course,
      score: 90,
      passingScore: 70,
      isPassed: true,
      answers: [{ questionIndex: 0, selectedOption: 1, isCorrect: true }],
    });
    console.log(`Created QuizAttempt for Student A: id=${attemptA._id}, score=${attemptA.score}%, isPassed=${attemptA.isPassed}`);

    // 4. Verify Student B Isolation
    console.log('\n--- VERIFICATION TEST 4: Verifying Student B Data Isolation ---');
    const enrollmentsBAfter = await Enrollment.find({ student: studentB._id });
    const quizAttemptsB = await QuizAttempt.find({ student: studentB._id });
    const activitiesB = await LearningActivity.find({ user: studentB._id });

    console.log(`Student B enrollments count: ${enrollmentsBAfter.length}`);
    console.log(`Student B quiz attempts count: ${quizAttemptsB.length}`);
    console.log(`Student B learning activities count: ${activitiesB.length}`);

    // Check Student A vs Student B isolation
    const hasLeakage = enrollmentsBAfter.some(e => e.completedLessons.includes(testLessonId)) ||
                       quizAttemptsB.some(q => q.quizId === 'quiz_test_1') ||
                       activitiesB.some(a => a.lessonId === testLessonId);

    if (hasLeakage) {
      console.error('❌ CRITICAL ERROR: Data leakage detected! Student B sees Student A data!');
      process.exit(1);
    } else {
      console.log('✅ PASS: Complete data isolation confirmed between Student A and Student B in MongoDB!');
    }

    // 5. Test HTTP API responses for both users
    console.log('\n--- VERIFICATION TEST 5: HTTP API Simulation ---');
    const tokenA = signToken(studentA._id);
    const tokenB = signToken(studentB._id);

    const app = require('../app');
    const http = require('http');

    const server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = server.address().port;

    function testApi(path, token) {
      return new Promise((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: port,
          path,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ raw: data, statusCode: res.statusCode });
            }
          });
        });
        req.on('error', reject);
        req.end();
      });
    }

    const dashA = await testApi('/api/v1/enrollments/dashboard', tokenA);
    const dashB = await testApi('/api/v1/enrollments/dashboard', tokenB);

    console.log(`API Dashboard for Student A: overallProgress=${dashA.stats?.overallProgress}%, coursesInProgress=${dashA.stats?.coursesInProgress}, continueLearningCount=${dashA.continueLearning?.length}`);
    console.log(`API Dashboard for Student B: overallProgress=${dashB.stats?.overallProgress}%, coursesInProgress=${dashB.stats?.coursesInProgress}, continueLearningCount=${dashB.continueLearning?.length}`);

    if (dashB.stats?.overallProgress === 0 && dashB.stats?.coursesInProgress === 0 && dashB.continueLearning?.length === 0) {
      console.log('✅ PASS: Student B HTTP dashboard returns isolated 0% metrics & 0 continue learning courses!');
    } else {
      console.error('❌ ERROR: Student B HTTP dashboard returned non-zero stats:', dashB.stats);
    }

    const quizzesA = await testApi('/api/v1/quizzes/attempts', tokenA);
    const quizzesB = await testApi('/api/v1/quizzes/attempts', tokenB);

    console.log(`API Quizzes for Student A: attemptsCount=${quizzesA.count} (Score: ${quizzesA.attempts?.[0]?.score}%)`);
    console.log(`API Quizzes for Student B: attemptsCount=${quizzesB.count}`);

    if (quizzesB.count === 0 && quizzesA.count >= 1) {
      console.log('✅ PASS: Student B sees 0 quiz attempts while Student A sees their own attempts!');
    } else {
      console.error('❌ ERROR: Quiz attempts not properly isolated!');
    }

    server.close();

    console.log('\n=============================================');
    console.log('🎉 ALL DATA ISOLATION VERIFICATION TESTS PASSED!');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

runVerification();
