import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from './api-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('ls_token') || '') : '';
        const apiUrl = getBaseUrl();

        socket = io(apiUrl, {
            auth: {
                token,
            },
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

export const connectSocket = (): Socket => {
    const s = getSocket();
    const token = typeof window !== 'undefined' ? (localStorage.getItem('ls_token') || '') : '';
    s.auth = { token };
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = (): void => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};
