import { apiClient } from '@/lib/api-client';

export interface QuizAttemptRecord {
    _id: string;
    student: string;
    quizId: string;
    quizTitle: string;
    course?: {
        _id: string;
        title: string;
        thumbnail?: string;
    };
    score: number;
    passingScore: number;
    isPassed: boolean;
    totalQuestions: number;
    correctAnswers: number;
    answers?: Record<string, any>;
    completedAt: string;
}

export interface MyQuizAttemptsResponse {
    success: boolean;
    count: number;
    averageScore: number;
    passedCount: number;
    attempts: QuizAttemptRecord[];
}

export const getMyQuizAttempts = async (): Promise<MyQuizAttemptsResponse> => {
    return apiClient<MyQuizAttemptsResponse>('/api/v1/quizzes/attempts/my');
};

export const submitQuizAttempt = async (data: {
    quizId: string;
    quizTitle: string;
    courseId?: string;
    score: number;
    passingScore?: number;
    totalQuestions?: number;
    correctAnswers?: number;
    answers?: Record<string, any>;
}): Promise<{ success: boolean; attempt: QuizAttemptRecord }> => {
    return apiClient('/api/v1/quizzes/attempts', {
        method: 'POST',
        body: data,
    });
};
