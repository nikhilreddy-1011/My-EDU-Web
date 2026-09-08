import { apiClient } from '@/lib/api-client';
import { ApiCourse } from './courses';

export interface Enrollment {
    _id: string;
    student: string;
    course: ApiCourse;
    progress: number;
    completedLessons: string[];
    lastAccessedAt: string;
    completedAt: string | null;
    paymentId?: string;
    orderId?: string;
    amount?: number;
    status?: string;
    createdAt: string;
}

export interface EnrollmentsResponse {
    success: boolean;
    count: number;
    enrollments: Enrollment[];
}

export const enrollInCourse = async (courseId: string): Promise<{ success: boolean; enrollment: Enrollment }> => {
    return apiClient(`/api/v1/enrollments`, { method: 'POST', body: { courseId } });
};

export const getMyEnrollments = async (): Promise<EnrollmentsResponse> => {
    return apiClient<EnrollmentsResponse>('/api/v1/enrollments/my');
};

export const updateLessonProgress = async (
    enrollmentId: string,
    lessonId: string
): Promise<{ success: boolean; enrollment: Enrollment }> => {
    return apiClient(`/api/v1/enrollments/${enrollmentId}/progress`, {
        method: 'PATCH',
        body: { lessonId },
    });
};

export interface MyCourseItem {
    enrollmentId: string;
    courseId: string;
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    level: string;
    instructor: {
        _id?: string;
        name: string;
        avatar?: string;
        email?: string;
        bio?: string;
    };
    progress: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessedAt: string;
    completedAt: string | null;
    status: 'In Progress' | 'Completed';
    paymentId?: string;
    amount?: number;
}

export type EnrollmentItem = MyCourseItem;

export interface MyCoursesListResponse {
    success: boolean;
    totalCount: number;
    inProgressCount: number;
    completedCount: number;
    inProgress: MyCourseItem[];
    completed: MyCourseItem[];
}

export const getMyCoursesList = async (): Promise<MyCoursesListResponse> => {
    return apiClient<MyCoursesListResponse>('/api/v1/enrollments/my-courses');
};

export interface StudentDashboardStats {
    overallProgress: number;
    coursesInProgress: number;
    coursesCompleted: number;
    learningHours: number;
    currentStreak: number;
    totalEnrolled: number;
    weeklyActivity: { day: string; hours: number; lessonsCompleted: number }[];
}

export interface StudentDashboardResponse {
    success: boolean;
    stats: StudentDashboardStats;
    continueLearning: any[];
    inProgress: any[];
    completed: any[];
    enrollments?: any[];
}

export const getStudentDashboard = async (): Promise<StudentDashboardResponse> => {
    return apiClient<StudentDashboardResponse>('/api/v1/enrollments/dashboard');
};

export const completeLesson = async (
    courseId: string,
    lessonId: string
): Promise<{
    success: boolean;
    progress: number;
    completedLessons: string[];
    currentLesson: string;
    isCompleted: boolean;
    enrollment: any;
}> => {
    return apiClient(`/api/v1/enrollments/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST',
    });
};

export const getCourseEnrollment = async (
    courseId: string
): Promise<{ success: boolean; isEnrolled: boolean; enrollment: any }> => {
    return apiClient(`/api/v1/enrollments/course/${courseId}`);
};

