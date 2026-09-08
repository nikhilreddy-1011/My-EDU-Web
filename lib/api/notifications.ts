import { apiClient } from '@/lib/api-client';

export interface NotificationItem {
    _id: string;
    type: 'message' | 'payment' | 'enrollment' | 'lesson' | 'quiz' | 'certificate' | 'live_class' | 'announcement';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    readAt?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface NotificationsResponse {
    success: boolean;
    count: number;
    unreadCount: number;
    notifications: NotificationItem[];
}

export const getNotifications = async (): Promise<NotificationsResponse> => {
    return apiClient<NotificationsResponse>('/api/v1/notifications');
};

export const markNotificationRead = async (id: string): Promise<{ success: boolean; unreadCount: number }> => {
    return apiClient(`/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
    });
};

export const markAllNotificationsRead = async (): Promise<{ success: boolean; unreadCount: number }> => {
    return apiClient('/api/v1/notifications/read-all', {
        method: 'PATCH',
    });
};

export const deleteNotification = async (id: string): Promise<{ success: boolean }> => {
    return apiClient(`/api/v1/notifications/${id}`, {
        method: 'DELETE',
    });
};
