// ============================================================
// LEARNSPHERE — TypeScript Type Definitions
// ============================================================

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type LessonType = 'VIDEO' | 'ARTICLE' | 'PDF' | 'QUIZ'
export type NotificationType = 'LIVE_CLASS' | 'QUIZ' | 'ANNOUNCEMENT' | 'ACHIEVEMENT' | 'NEW_COURSE' | 'SYSTEM'
export type LiveClassStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    bio?: string
    title?: string          // Teacher's professional title
    expertise?: string[]    // Teacher's expertise areas
    createdAt: string
    learningStreak?: number  // Days streak
    totalHours?: number
}

export interface Course {
    id: string
    title: string
    description: string
    thumbnail: string
    category: string
    difficulty: CourseDifficulty
    instructorId: string
    instructor: User
    status: CourseStatus
    price: number           // 0 = free
    originalPrice?: number
    isFree?: boolean
    rating: number
    reviewCount: number
    studentCount: number
    duration: string        // e.g., "12h 30m"
    totalLessons: number
    tags: string[]
    createdAt: string
    updatedAt: string
    language: string
    certificate: boolean
}

export interface Module {
    id: string
    courseId: string
    title: string
    description?: string
    order: number
    lessons: Lesson[]
}

export interface Lesson {
    id: string
    moduleId: string
    title: string
    type: LessonType
    duration: string        // e.g., "8:24"
    content?: string        // URL or markdown content
    order: number
    isLocked: boolean
    isCompleted?: boolean   // Per-user
    resources?: Resource[]
}

export interface Resource {
    id: string
    title: string
    type: 'PDF' | 'LINK' | 'VIDEO'
    url: string
}

export interface Enrollment {
    id: string
    userId: string
    courseId: string
    course: Course
    progress: number        // 0-100 percentage
    currentLessonId?: string
    completedLessons: string[]
    enrolledAt: string
    completedAt?: string
    paymentId?: string
    orderId?: string
    amount?: number
    status?: 'pending' | 'paid' | 'failed'
}

export interface Quiz {
    id: string
    courseId: string
    moduleId?: string
    title: string
    description?: string
    duration: number        // minutes
    passingScore: number    // percentage
    questions: Question[]
    isPublished: boolean
    deadline?: string
    createdAt: string
}

export interface Question {
    id: string
    quizId: string
    question: string
    options: string[]
    correctAnswer: number   // index
    explanation?: string
    points: number
}

export interface QuizAttempt {
    id: string
    quizId: string
    userId: string
    quiz: Quiz
    answers: Record<string, number>  // questionId -> selectedIndex
    score: number           // percentage
    timeSpent: number       // seconds
    completedAt: string
    isPassed: boolean
}

export interface LiveClass {
    id: string
    courseId: string
    instructorId: string
    instructor: User
    course: Course
    title: string
    description?: string
    date: string
    duration: number        // minutes
    meetingUrl: string
    status: LiveClassStatus
    attendees?: number
    maxAttendees?: number
}

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    read: boolean
    createdAt: string
    actionUrl?: string
    metadata?: Record<string, string>
}

export interface Badge {
    id: string
    name: string
    description: string
    icon: string            // emoji or icon name
    color: string           // badge color
    criteria: string
}

export interface UserBadge {
    userId: string
    badgeId: string
    badge: Badge
    earnedAt: string
}

export interface Review {
    id: string
    courseId: string
    userId: string
    user: User
    rating: number          // 1-5
    comment: string
    createdAt: string
}

export interface Note {
    id: string
    lessonId: string
    userId: string
    content: string
    timestamp?: number      // video timestamp in seconds
    createdAt: string
}

export interface StudentStats {
    userId: string
    overallProgress: number
    coursesInProgress: number
    coursesCompleted: number
    learningHours: number
    quizAverage: number
    currentStreak: number
    longestStreak: number
    weeklyActivity: WeeklyActivity[]
}

export interface WeeklyActivity {
    day: string
    hours: number
    lessonsCompleted: number
}

export interface TeacherStats {
    userId: string
    totalStudents: number
    activeCourses: number
    totalRevenue: number
    averageRating: number
    completionRate: number
    averageQuizScore: number
    enrollmentTrend: TrendData[]
    topCourses: { courseId: string; title: string; students: number; rating: number }[]
}

export interface TrendData {
    month: string
    value: number
}

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

export interface SearchResult {
    id: string
    type: 'course' | 'lesson' | 'teacher' | 'student'
    title: string
    subtitle?: string
    thumbnail?: string
    url: string
}
