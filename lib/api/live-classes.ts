import { apiClient } from '@/lib/api-client';

export interface LiveClassItem {
    _id: string;
    id?: string;
    title: string;
    description?: string;
    course?: {
        _id: string;
        title: string;
        thumbnail?: string;
        category?: string;
    };
    courseTitle?: string;
    instructor?: {
        _id?: string;
        name: string;
        avatar?: string;
        email?: string;
        bio?: string;
    };
    instructorName: string;
    instructorAvatar?: string;
    scheduledAt: string;
    date?: string; // compatibility alias
    duration: number;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
    attendeesCount: number;
    attendees?: number; // compatibility alias
    maxSeats: number;
    platform: string;
    meetingId: string;
    meetingUrl?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface LiveClassesResponse {
    success: boolean;
    totalCount: number;
    classes: LiveClassItem[];
    liveNow: LiveClassItem[];
    upcoming: LiveClassItem[];
    completed: LiveClassItem[];
}

export interface ScheduleLiveClassParams {
    title: string;
    description?: string;
    course?: string;
    date?: string;
    scheduledAt?: string;
    duration?: number | string;
    maxSeats?: number | string;
    platform?: string;
    tags?: string[] | string;
}

export const getLiveClasses = async (params: { status?: string; courseId?: string; instructorId?: string } = {}): Promise<LiveClassesResponse> => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.courseId) query.set('courseId', params.courseId);
    if (params.instructorId) query.set('instructorId', params.instructorId);

    const qs = query.toString();
    return apiClient<LiveClassesResponse>(`/api/v1/live-classes${qs ? `?${qs}` : ''}`);
};

export const getLiveClassById = async (id: string): Promise<{ success: boolean; liveClass: LiveClassItem }> => {
    return apiClient(`/api/v1/live-classes/${id}`);
};

export const scheduleLiveClass = async (data: ScheduleLiveClassParams): Promise<{ success: boolean; message: string; liveClass: LiveClassItem }> => {
    return apiClient('/api/v1/live-classes', {
        method: 'POST',
        body: data,
    });
};

export const updateLiveClassStatus = async (id: string, status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED'): Promise<{ success: boolean; message: string; liveClass: LiveClassItem }> => {
    return apiClient(`/api/v1/live-classes/${id}/status`, {
        method: 'PATCH',
        body: { status },
    });
};

export const deleteLiveClass = async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient(`/api/v1/live-classes/${id}`, {
        method: 'DELETE',
    });
};

export interface LiveClassAccessResponse {
    success: boolean;
    authorized: boolean;
    isTeacher: boolean;
    role: string;
    liveClass: LiveClassItem;
    message?: string;
}

export const checkLiveClassAccess = async (id: string, token?: string | null): Promise<LiveClassAccessResponse> => {
    return apiClient<LiveClassAccessResponse>(`/api/v1/live-classes/${id}/access`, {
        method: 'GET',
        token,
    });
};

export interface LiveKitTokenResponse {
    success: boolean;
    token?: string;
    serverUrl?: string;
    roomName?: string;
    admitted?: boolean;
    participant?: {
        identity: string;
        name: string;
        role: string;
        isTeacher: boolean;
    };
    message?: string;
}

export const getLiveKitToken = async (id: string, token?: string | null): Promise<LiveKitTokenResponse> => {
    return apiClient<LiveKitTokenResponse>(`/api/v1/live-classes/${id}/livekit-token`, {
        method: 'GET',
        token,
    });
};


