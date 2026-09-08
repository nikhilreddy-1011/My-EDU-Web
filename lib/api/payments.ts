import { apiClient } from '@/lib/api-client';

export interface CreateOrderResponse {
    success: boolean;
    orderId: string;
    amount: number; // in paise
    currency: string;
    razorpayKeyId: string;
    courseId: string;
    courseTitle: string;
    message?: string;
}

export interface VerifyPaymentParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    courseId: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    message: string;
    enrollment: {
        _id: string;
        student: string;
        course: string;
        progress: number;
        paymentId?: string;
        orderId?: string;
        amount?: number;
        status?: string;
    };
}

export interface PaymentStatusResponse {
    success: boolean;
    payment: {
        _id: string;
        orderId: string;
        paymentId?: string;
        status: 'pending' | 'paid' | 'failed';
        amount: number;
        currency: string;
        course: {
            _id: string;
            title: string;
            thumbnail?: string;
            price: number;
        };
        createdAt: string;
    };
}

export const createPaymentOrder = async (courseId: string, token?: string | null): Promise<CreateOrderResponse> => {
    return apiClient<CreateOrderResponse>('/api/v1/payments/create-order', {
        method: 'POST',
        body: { courseId },
        token,
    });
};

export const verifyPayment = async (data: VerifyPaymentParams, token?: string | null): Promise<VerifyPaymentResponse> => {
    return apiClient<VerifyPaymentResponse>('/api/v1/payments/verify', {
        method: 'POST',
        body: data,
        token,
    });
};

export const getPaymentStatus = async (orderId: string, token?: string | null): Promise<PaymentStatusResponse> => {
    return apiClient<PaymentStatusResponse>(`/api/v1/payments/status/${orderId}`, {
        token,
    });
};

export interface PaymentItem {
    _id: string;
    orderId: string;
    paymentId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'failed';
    course: {
        _id: string;
        title: string;
        thumbnail?: string;
        price: number;
        category?: string;
        instructor?: {
            name: string;
            avatar?: string;
        };
    };
    receipt: string;
    createdAt: string;
}

export type PaymentRecord = PaymentItem;

export interface MyPaymentsResponse {
    success: boolean;
    count: number;
    payments: PaymentItem[];
}

export const getMyPayments = async (token?: string | null): Promise<MyPaymentsResponse> => {
    return apiClient<MyPaymentsResponse>('/api/v1/payments/my-payments', { token });
};
