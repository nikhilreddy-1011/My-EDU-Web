import { apiClient } from '@/lib/api-client';
import { ApiCourse } from './courses';

export interface WishlistCourse extends ApiCourse {
    wishlistId: string;
    savedAt: string;
}

export type WishlistItem = WishlistCourse;

export interface WishlistResponse {
    success: boolean;
    count: number;
    wishlist: WishlistCourse[];
}

export const getWishlist = async (): Promise<WishlistResponse> => {
    return apiClient<WishlistResponse>('/api/v1/wishlist');
};

export const addToWishlist = async (courseId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/v1/wishlist/${courseId}`, { method: 'POST' });
};

export const removeFromWishlist = async (courseId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/v1/wishlist/${courseId}`, { method: 'DELETE' });
};

export const checkWishlistStatus = async (courseId: string): Promise<{ success: boolean; isWishlisted: boolean }> => {
    return apiClient(`/api/v1/wishlist/check/${courseId}`);
};
