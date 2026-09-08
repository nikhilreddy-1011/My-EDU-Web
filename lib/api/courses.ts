import { apiClient } from '@/lib/api-client';

export interface ApiCourse {
    _id: string;
    title: string;
    description: string;
    shortDescription: string;
    instructor: {
        _id: string;
        name: string;
        avatar: string;
        bio: string;
    };
    thumbnail: string;
    price: number;
    originalPrice: number;
    isFree?: boolean;
    category: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    tags: string[];
    rating: { average: number; count: number };
    totalDuration: number;
    totalLessons: number;
    studentCount: number;
    published: boolean;
    featured: boolean;
    createdAt: string;
}

export interface CourseListResponse {
    success: boolean;
    count: number;
    total: number;
    page: number;
    pages: number;
    courses: ApiCourse[];
}

export interface CourseSingleResponse {
    success: boolean;
    course: ApiCourse & {
        modules: Array<{
            _id: string;
            title: string;
            description: string;
            order: number;
            lessons: Array<{
                _id: string;
                title: string;
                description: string;
                duration: number;
                order: number;
                isFree: boolean;
                videoUrl: string;
            }>;
        }>;
    };
}

export interface GetCoursesParams {
    category?: string;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
    featured?: boolean;
}

export const getCourses = async (params: GetCoursesParams = {}): Promise<CourseListResponse> => {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.level) query.set('level', params.level);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.featured) query.set('featured', 'true');

    const qs = query.toString();
    return apiClient<CourseListResponse>(`/api/v1/courses${qs ? `?${qs}` : ''}`);
};

export const getCourseById = async (id: string): Promise<CourseSingleResponse> => {
    return apiClient<CourseSingleResponse>(`/api/v1/courses/${id}`);
};

export const createCourse = async (data: Partial<ApiCourse>): Promise<{ success: boolean; course: ApiCourse }> => {
    return apiClient(`/api/v1/courses`, { method: 'POST', body: data });
};

export const updateCourse = async (id: string, data: Partial<ApiCourse>): Promise<{ success: boolean; course: ApiCourse }> => {
    return apiClient(`/api/v1/courses/${id}`, { method: 'PUT', body: data });
};

export const deleteCourse = async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/v1/courses/${id}`, { method: 'DELETE' });
};

export const getMyCourses = async (): Promise<CourseListResponse> => {
    return apiClient<CourseListResponse>('/api/v1/courses/my');
};

export interface CourseAccessResponse {
    success: boolean;
    hasAccess: boolean;
    isEnrolled: boolean;
    isFree: boolean;
    price: number;
    course: {
        _id: string;
        title: string;
        price: number;
        isFree: boolean;
        thumbnail?: string;
    };
}

export const checkCourseAccess = async (courseId: string): Promise<CourseAccessResponse> => {
    return apiClient<CourseAccessResponse>(`/api/v1/courses/${courseId}/access`);
};
