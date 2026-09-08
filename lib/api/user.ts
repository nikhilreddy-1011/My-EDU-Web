import { apiClient } from '@/lib/api-client';
import { User } from '@/types';

export interface UpdateProfileParams {
    name?: string;
    bio?: string;
    avatar?: string;
    title?: string;
}

export interface UserProfileResponse {
    success: boolean;
    user: User & { id?: string; _id?: string };
    message?: string;
}

export const getUserProfile = async (): Promise<UserProfileResponse> => {
    return apiClient<UserProfileResponse>('/api/v1/users/profile');
};

export const updateUserProfile = async (data: UpdateProfileParams): Promise<UserProfileResponse> => {
    return apiClient<UserProfileResponse>('/api/v1/users/profile', {
        method: 'PATCH',
        body: data,
    });
};
