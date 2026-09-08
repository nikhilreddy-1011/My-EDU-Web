require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

const seed = async () => {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    await Enrollment.deleteMany({});
    await Course.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ─── Create Users ────────────────────────────────────────
    const [admin, teacher1, teacher2, student1, student2] = await User.create([
        {
            name: 'Admin User',
            email: 'admin@learnsphere.com',
            password: 'Admin@123',
            role: 'ADMIN',
            bio: 'Platform administrator',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        },
        {
            name: 'Dr. Sarah Mitchell',
            email: 'teacher@learnsphere.com',
            password: 'Teacher@123',
            role: 'TEACHER',
            bio: 'Full-Stack Developer with 10+ years of experience. Former engineer at Google and Meta.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        },
        {
            name: 'Prof. James Okonkwo',
            email: 'james@learnsphere.com',
            password: 'Teacher@123',
            role: 'TEACHER',
            bio: 'Data Scientist and ML researcher. PhD in Computer Science from MIT.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james',
        },
        {
            name: 'Alex Johnson',
            email: 'student@learnsphere.com',
            password: 'Student@123',
            role: 'STUDENT',
            bio: 'Aspiring developer, learning every day.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        },
        {
            name: 'Priya Sharma',
            email: 'priya@learnsphere.com',
            password: 'Student@123',
            role: 'STUDENT',
            bio: 'CS graduate exploring the world of AI and machine learning.',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya',
        },
    ]);
    console.log('✅ Created 5 users (1 admin, 2 teachers, 2 students)');

    // ─── Create Courses ──────────────────────────────────────
    const courses = await Course.create([
        {
            title: 'Complete React & Next.js Developer Bootcamp',
            description:
                'Master modern React 19, Next.js 15 App Router, TypeScript, Tailwind CSS, and full-stack development. Build 10+ real-world projects from scratch. This course covers everything from React fundamentals to advanced patterns like Server Components, streaming, and edge runtime.',
            shortDescription: 'Go from zero to full-stack developer with React & Next.js 15.',
            instructor: teacher1._id,
            thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
            price: 1499,
            originalPrice: 4999,
            category: 'Web Development',
            level: 'BEGINNER',
            tags: ['react', 'nextjs', 'typescript', 'tailwind', 'javascript'],
            published: true,
            featured: true,
            rating: { average: 4.9, count: 2847 },
            modules: [
                {
                    title: 'JavaScript & React Fundamentals',
                    description: 'Core concepts you need before diving into React',
                    order: 1,
                    lessons: [
                        { title: 'Welcome & Course Overview', duration: 5, order: 1, isFree: true },
                        { title: 'Modern JavaScript (ES6+)', duration: 45, order: 2, isFree: true },
                        { title: 'React Basics & JSX', duration: 40, order: 3, isFree: false },
                        { title: 'Components & Props', duration: 35, order: 4, isFree: false },
                        { title: 'State & Event Handling', duration: 50, order: 5, isFree: false },
                    ],
                },
                {
                    title: 'Next.js App Router',
                    description: 'Deep dive into the Next.js App Router architecture',
                    order: 2,
                    lessons: [
                        { title: 'File-based Routing', duration: 30, order: 1, isFree: false },
                        { title: 'Server Components vs Client Components', duration: 40, order: 2, isFree: false },
                        { title: 'Data Fetching & Caching', duration: 45, order: 3, isFree: false },
                        { title: 'API Routes & Server Actions', duration: 50, order: 4, isFree: false },
                    ],
                },
                {
                    title: 'Full-Stack Project: E-Commerce App',
                    description: 'Build a complete e-commerce platform from scratch',
                    order: 3,
                    lessons: [
                        { title: 'Project Setup & Architecture', duration: 25, order: 1, isFree: false },
                        { title: 'Authentication with NextAuth', duration: 55, order: 2, isFree: false },
                        { title: 'Database Design with Prisma', duration: 60, order: 3, isFree: false },
                        { title: 'Stripe Payment Integration', duration: 45, order: 4, isFree: false },
                        { title: 'Deployment to Vercel', duration: 30, order: 5, isFree: false },
                    ],
                },
            ],
        },
        {
            title: 'Machine Learning Fundamentals with Python',
            description:
                'Learn machine learning from scratch using Python, NumPy, Pandas, Scikit-learn, and TensorFlow. Covers supervised, unsupervised learning, neural networks, and real-world ML projects including a predictive model and image classifier.',
            shortDescription: 'Master ML with Python — from linear regression to deep neural networks.',
            instructor: teacher2._id,
            thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800',
            price: 1999,
            originalPrice: 5999,
            category: 'Machine Learning',
            level: 'INTERMEDIATE',
            tags: ['python', 'machine learning', 'tensorflow', 'scikit-learn', 'ai'],
            published: true,
            featured: true,
            rating: { average: 4.8, count: 1923 },
            modules: [
                {
                    title: 'Python for Data Science',
                    description: 'Python essentials for ML: NumPy, Pandas, Matplotlib',
                    order: 1,
                    lessons: [
                        { title: 'Python Refresher', duration: 30, order: 1, isFree: true },
                        { title: 'NumPy Arrays & Operations', duration: 45, order: 2, isFree: true },
                        { title: 'Pandas DataFrames', duration: 50, order: 3, isFree: false },
                        { title: 'Data Visualization with Matplotlib', duration: 40, order: 4, isFree: false },
                    ],
                },
                {
                    title: 'Supervised Learning',
                    description: 'Classification and regression algorithms',
                    order: 2,
                    lessons: [
                        { title: 'Linear Regression from Scratch', duration: 55, order: 1, isFree: false },
                        { title: 'Logistic Regression & Classification', duration: 50, order: 2, isFree: false },
                        { title: 'Decision Trees & Random Forests', duration: 60, order: 3, isFree: false },
                        { title: 'Model Evaluation & Cross-Validation', duration: 45, order: 4, isFree: false },
                    ],
                },
                {
                    title: 'Deep Learning & Neural Networks',
                    description: 'Build and train neural networks with TensorFlow',
                    order: 3,
                    lessons: [
                        { title: 'Introduction to Neural Networks', duration: 40, order: 1, isFree: false },
                        { title: 'Building a Neural Net with TensorFlow', duration: 65, order: 2, isFree: false },
                        { title: 'Convolutional Neural Networks (CNN)', duration: 70, order: 3, isFree: false },
                        { title: 'Project: Image Classifier', duration: 80, order: 4, isFree: false },
                    ],
                },
            ],
        },
        {
            title: 'UI/UX Design Masterclass: From Figma to Code',
            description:
                'Learn professional UI/UX design using Figma. Master design systems, wireframing, prototyping, user research, and how to hand off designs to developers. Includes real-world projects and portfolio pieces.',
            shortDescription: 'Become a professional UI/UX designer — from wireframes to polished prototypes.',
            instructor: teacher1._id,
            thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
            price: 1,
            originalPrice: 100,
            category: 'UI/UX Design',
            level: 'BEGINNER',
            tags: ['figma', 'ui design', 'ux design', 'design systems', 'prototyping'],
            published: true,
            featured: false,
            rating: { average: 4.7, count: 1245 },
            modules: [
                {
                    title: 'Design Fundamentals',
                    description: 'Core principles of visual design',
                    order: 1,
                    lessons: [
                        { title: 'Color Theory & Typography', duration: 40, order: 1, isFree: true },
                        { title: 'Layout & Grid Systems', duration: 35, order: 2, isFree: true },
                        { title: 'Visual Hierarchy', duration: 30, order: 3, isFree: false },
                    ],
                },
                {
                    title: 'Figma Essentials',
                    description: 'Master Figma from basics to advanced',
                    order: 2,
                    lessons: [
                        { title: 'Figma Interface & Tools', duration: 25, order: 1, isFree: false },
                        { title: 'Components & Design Systems', duration: 55, order: 2, isFree: false },
                        { title: 'Auto Layout & Constraints', duration: 45, order: 3, isFree: false },
                        { title: 'Prototyping & Animations', duration: 40, order: 4, isFree: false },
                    ],
                },
            ],
        },
        {
            title: 'Node.js & Express: Build REST APIs',
            description:
                'Build production-ready REST APIs with Node.js, Express, MongoDB, and JWT authentication. Learn API design principles, middleware, error handling, rate limiting, and deploy to cloud platforms.',
            shortDescription: 'Build scalable backend APIs with Node.js, Express & MongoDB.',
            instructor: teacher1._id,
            thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
            price: 1299,
            originalPrice: 3999,
            category: 'Web Development',
            level: 'INTERMEDIATE',
            tags: ['nodejs', 'express', 'mongodb', 'api', 'backend', 'jwt'],
            published: true,
            featured: true,
            rating: { average: 4.8, count: 987 },
            modules: [
                {
                    title: 'Node.js Core',
                    description: 'Understanding the Node.js runtime',
                    order: 1,
                    lessons: [
                        { title: 'Node.js Architecture & Event Loop', duration: 35, order: 1, isFree: true },
                        { title: 'Modules & npm', duration: 30, order: 2, isFree: true },
                        { title: 'File System & Streams', duration: 40, order: 3, isFree: false },
                    ],
                },
                {
                    title: 'Express & REST APIs',
                    description: 'Build robust REST APIs with Express',
                    order: 2,
                    lessons: [
                        { title: 'Express Setup & Routing', duration: 35, order: 1, isFree: false },
                        { title: 'Middleware & Error Handling', duration: 40, order: 2, isFree: false },
                        { title: 'JWT Authentication', duration: 55, order: 3, isFree: false },
                        { title: 'Rate Limiting & Security', duration: 35, order: 4, isFree: false },
                    ],
                },
            ],
        },
        {
            title: 'Python for Data Science & Analytics',
            description:
                'Master data analysis with Python using Pandas, NumPy, Matplotlib, and Seaborn. Learn to clean data, analyze trends, create visualizations, and build interactive dashboards.',
            shortDescription: 'Analyze real-world datasets and build stunning data visualizations.',
            instructor: teacher2._id,
            thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
            price: 0,
            originalPrice: 0,
            category: 'Data Science',
            level: 'BEGINNER',
            tags: ['python', 'data science', 'pandas', 'visualization', 'analytics'],
            published: true,
            featured: false,
            rating: { average: 4.6, count: 3102 },
            modules: [
                {
                    title: 'Getting Started with Data Science',
                    description: 'Setup and core tools',
                    order: 1,
                    lessons: [
                        { title: 'What is Data Science?', duration: 15, order: 1, isFree: true },
                        { title: 'Setting Up Your Environment', duration: 20, order: 2, isFree: true },
                        { title: 'Jupyter Notebooks', duration: 25, order: 3, isFree: true },
                    ],
                },
                {
                    title: 'Data Wrangling with Pandas',
                    description: 'Clean, transform, and analyze data',
                    order: 2,
                    lessons: [
                        { title: 'DataFrames & Series', duration: 45, order: 1, isFree: true },
                        { title: 'Data Cleaning Techniques', duration: 50, order: 2, isFree: false },
                        { title: 'Grouping & Aggregation', duration: 40, order: 3, isFree: false },
                        { title: 'Merging & Joining DataFrames', duration: 35, order: 4, isFree: false },
                    ],
                },
            ],
        },
        {
            title: 'AWS Cloud Practitioner & Solutions Architect',
            description:
                'Prepare for the AWS Cloud Practitioner and Solutions Architect Associate certifications. Covers core AWS services: EC2, S3, RDS, Lambda, VPC, IAM, CloudFront, and more. Includes hands-on labs.',
            shortDescription: 'Get AWS certified — from Cloud Practitioner to Solutions Architect.',
            instructor: teacher2._id,
            thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800',
            price: 2499,
            originalPrice: 6999,
            category: 'DevOps',
            level: 'INTERMEDIATE',
            tags: ['aws', 'cloud', 'devops', 'certification', 'infrastructure'],
            published: true,
            featured: true,
            rating: { average: 4.9, count: 2156 },
            modules: [
                {
                    title: 'AWS Fundamentals',
                    description: 'Core AWS concepts and global infrastructure',
                    order: 1,
                    lessons: [
                        { title: 'AWS Global Infrastructure', duration: 20, order: 1, isFree: true },
                        { title: 'IAM & Security', duration: 45, order: 2, isFree: true },
                        { title: 'EC2 & Auto Scaling', duration: 60, order: 3, isFree: false },
                        { title: 'S3 & Storage Services', duration: 50, order: 4, isFree: false },
                    ],
                },
                {
                    title: 'Architecting on AWS',
                    description: 'Design scalable, highly available architectures',
                    order: 2,
                    lessons: [
                        { title: 'VPC & Networking', duration: 55, order: 1, isFree: false },
                        { title: 'RDS & Database Services', duration: 45, order: 2, isFree: false },
                        { title: 'Lambda & Serverless', duration: 50, order: 3, isFree: false },
                        { title: 'CloudFront & CDN', duration: 35, order: 4, isFree: false },
                        { title: 'Exam Practice & Tips', duration: 40, order: 5, isFree: false },
                    ],
                },
            ],
        },
    ]);
    console.log(`✅ Created ${courses.length} courses`);

    // ─── Enroll students ─────────────────────────────────────
    const enrollment1 = await Enrollment.create({
        student: student1._id,
        course: courses[0]._id,
        progress: 65,
        completedLessons: [
            courses[0].modules[0].lessons[0]._id.toString(),
            courses[0].modules[0].lessons[1]._id.toString(),
            courses[0].modules[0].lessons[2]._id.toString(),
            courses[0].modules[0].lessons[3]._id.toString(),
        ],
    });

    const enrollment2 = await Enrollment.create({
        student: student1._id,
        course: courses[4]._id, // free course
        progress: 100,
        completedLessons: courses[4].modules.flatMap((m) => m.lessons.map((l) => l._id.toString())),
        completedAt: new Date(),
    });

    const enrollment3 = await Enrollment.create({
        student: student2._id,
        course: courses[1]._id,
        progress: 30,
        completedLessons: [
            courses[1].modules[0].lessons[0]._id.toString(),
            courses[1].modules[0].lessons[1]._id.toString(),
        ],
    });

    // Update student counts on courses
    await Course.findByIdAndUpdate(courses[0]._id, { $addToSet: { students: student1._id } });
    await Course.findByIdAndUpdate(courses[4]._id, { $addToSet: { students: student1._id } });
    await Course.findByIdAndUpdate(courses[1]._id, { $addToSet: { students: student2._id } });

    console.log('✅ Created 3 enrollments');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Demo Login Credentials:');
    console.log('   Admin:   admin@learnsphere.com   / Admin@123');
    console.log('   Teacher: teacher@learnsphere.com / Teacher@123');
    console.log('   Student: student@learnsphere.com / Student@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
