import { apiClient } from '@/lib/api-client';

export interface ChatUser {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string;
    bio?: string;
}

export interface ChatCourse {
    _id: string;
    title: string;
    thumbnail?: string;
    category?: string;
}

export interface Conversation {
    _id: string;
    course: ChatCourse;
    teacher: ChatUser;
    student: ChatUser;
    lastMessage: string;
    lastMessageSender?: string;
    lastMessageAt: string;
    unreadStudent: number;
    unreadTeacher: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    _id: string;
    conversation: string;
    course: string;
    sender: ChatUser;
    receiver: string;
    message: string;
    read: boolean;
    readAt?: string;
    createdAt: string;
}

export interface ConversationsResponse {
    success: boolean;
    count: number;
    conversations: Conversation[];
}

export interface MessagesResponse {
    success: boolean;
    count: number;
    messages: ChatMessage[];
}

export const getConversations = async (): Promise<ConversationsResponse> => {
    return apiClient<ConversationsResponse>('/api/v1/conversations');
};

export const startConversation = async (courseId: string, teacherId?: string): Promise<{ success: boolean; conversation: Conversation }> => {
    return apiClient('/api/v1/conversations', {
        method: 'POST',
        body: { courseId, teacherId },
    });
};

export const getMessages = async (conversationId: string): Promise<MessagesResponse> => {
    return apiClient<MessagesResponse>(`/api/v1/conversations/${conversationId}/messages`);
};

export const sendMessage = async (conversationId: string, message: string): Promise<{ success: boolean; message: ChatMessage }> => {
    return apiClient(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: { message },
    });
};

export const markConversationAsRead = async (conversationId: string): Promise<{ success: boolean }> => {
    return apiClient(`/api/v1/conversations/${conversationId}/read`, {
        method: 'PATCH',
    });
};
