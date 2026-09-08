import { apiClient } from '@/lib/api-client';
import { User, UserRole } from '@/types';

export interface AuthResponse {
    success: boolean;
    token: string;
    user: User & { id: string };
}

export interface MeResponse {
    success: boolean;
    user: User & { id: string };
}

export const loginUser = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
    });
};

export const registerUser = async (
    name: string,
    email: string,
    password: string,
    role: 'STUDENT' | 'TEACHER' = 'STUDENT'
): Promise<AuthResponse> => {
    return apiClient<AuthResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: { name, email, password, role },
    });
};

export const getCurrentUser = async (): Promise<MeResponse> => {
    return apiClient<MeResponse>('/api/v1/auth/me');
};
