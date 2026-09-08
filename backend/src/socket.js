const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

let io = null;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin) ||
                    /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin) ||
                    origin === process.env.FRONTEND_URL
                ) {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            methods: ['GET', 'POST', 'PATCH'],
            credentials: true,
        },
    });

    // JWT Handshake Authentication Middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (token && typeof token === 'string' && token.trim().length > 0) {
                const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
                try {
                    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
                    const user = await User.findById(decoded.id).select('_id name email role');
                    if (user) {
                        socket.user = user;
                    }
                } catch {}
            }
            // Always allow connection so all clients receive platform-wide live class broadcasts
            next();
        } catch (err) {
            next();
        }
    });

    io.on('connection', (socket) => {
        if (socket.user && socket.user._id) {
            const userId = socket.user._id.toString();
            // Join personal user room for direct alerts & notifications
            socket.join(`user_${userId}`);
        }

        // Join course-specific conversation room
        socket.on('join_conversation', async ({ conversationId }) => {
            try {
                if (!conversationId) return;
                const conv = await Conversation.findById(conversationId);
                if (!conv) return;

                // Authorization check: only student or teacher of this conversation can join
                const isStudent = conv.student.toString() === userId;
                const isTeacher = conv.teacher.toString() === userId;
                if (!isStudent && !isTeacher) {
                    return socket.emit('error', { message: 'Not authorized to join this conversation' });
                }

                socket.join(`conv_${conversationId}`);
            } catch (err) {
                console.error('Socket join_conversation error:', err);
            }
        });

        socket.on('leave_conversation', ({ conversationId }) => {
            if (conversationId) {
                socket.leave(`conv_${conversationId}`);
            }
        });

        socket.on('disconnect', () => {
            // Handled automatically
        });
    });

    return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
