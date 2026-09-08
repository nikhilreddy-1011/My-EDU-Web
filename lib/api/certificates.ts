import { apiClient } from '@/lib/api-client';

export interface CertificateItem {
    _id: string;
    certificateId: string;
    course: {
        _id: string;
        title: string;
        thumbnail?: string;
        category?: string;
        level?: string;
        totalLessons?: number;
        totalDuration?: number;
        instructor?: {
            name: string;
            avatar?: string;
            bio?: string;
        };
    };
    student: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    instructor: {
        _id: string;
        name: string;
        avatar?: string;
    };
    issueDate: string;
    grade: string;
    pdfUrl?: string;
}

export interface CertificatesResponse {
    success: boolean;
    count: number;
    certificates: CertificateItem[];
}

export const getMyCertificates = async (): Promise<CertificatesResponse> => {
    return apiClient<CertificatesResponse>('/api/v1/certificates');
};

export const getCertificates = getMyCertificates;

export const claimCertificate = async (courseId: string): Promise<{ success: boolean; message: string; certificate: CertificateItem }> => {
    return apiClient(`/api/v1/certificates/claim/${courseId}`, {
        method: 'POST',
    });
};

export const verifyCertificate = async (certificateId: string): Promise<{ success: boolean; verified: boolean; certificate: CertificateItem }> => {
    return apiClient(`/api/v1/certificates/verify/${certificateId}`);
};

