import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('ls_token') || '') : '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
