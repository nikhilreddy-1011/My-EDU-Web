const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string | null;
};

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;

    // 1. Check direct token key
    const direct = localStorage.getItem('ls_token');
    if (direct && direct.trim().length > 0) {
        return direct.trim();
    }

    // 2. Check Zustand persisted auth store in localStorage
    try {
        const authData = localStorage.getItem('learnsphere-auth');
        if (authData) {
            const parsed = JSON.parse(authData);
            const token = parsed?.state?.token;
            if (token && typeof token === 'string' && token.trim().length > 0) {
                // Keep ls_token synchronized
                localStorage.setItem('ls_token', token.trim());
                return token.trim();
            }
        }
    } catch {}

    return null;
};

export const apiClient = async <T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    const { method = 'GET', body, token } = options;

    const resolvedToken = token ?? getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (resolvedToken) {
        headers['Authorization'] = `Bearer ${resolvedToken}`;
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, config);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('fetch failed')) {
            throw new ApiError(
                `Unable to connect to the backend server at ${BASE_URL}. Please make sure the backend server is running on port 5000.`,
                0
            );
        }
        throw new ApiError(msg, 0);
    }

    let data: { success: boolean; message?: string } & T;
    try {
        data = await response.json();
    } catch {
        throw new ApiError('Failed to parse server response', response.status);
    }

    if (!response.ok) {
        // If 401, clear stored auth data to prevent stale ghost sessions
        if (response.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('ls_token');
            try {
                const authData = localStorage.getItem('learnsphere-auth');
                if (authData) {
                    const parsed = JSON.parse(authData);
                    if (parsed?.state) {
                        parsed.state.token = null;
                        parsed.state.isAuthenticated = false;
                        parsed.state.user = null;
                        localStorage.setItem('learnsphere-auth', JSON.stringify(parsed));
                    }
                }
            } catch {}
        }
        throw new ApiError(data?.message || 'An error occurred', response.status);
    }

    return data as T;
};
