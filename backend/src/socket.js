const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');

let io = null;

// In-memory active meeting sessions:
// Map<meetingId, Map<userId, Participant>>
const meetingSessions = new Map();

// Map<socketId, Set<meetingId>> for instant disconnect cleanup
const socketMeetings = new Map();

// Helper to generate consistent avatar colors based on userId
const USER_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'];
const getUserColor = (userId = '') => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

const getInitials = (name = 'User') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin) ||
                    /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin) ||
                    origin.includes('vercel.app') ||
                    origin.includes('onrender.com') ||
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
                    const user = await User.findById(decoded.id).select('_id name email role avatar');
                    if (user) {
                        socket.user = user;
                    }
                } catch {}
            }
            next();
        } catch (err) {
            next();
        }
    });

    io.on('connection', (socket) => {
        socketMeetings.set(socket.id, new Set());

        if (socket.user && socket.user._id) {
            const userId = socket.user._id.toString();
            socket.join(`user_${userId}`);
        }

        // ── Direct Conversation Rooms ────────────────────────────
        socket.on('join_conversation', async ({ conversationId }) => {
            try {
                if (!conversationId || !socket.user) return;
                const userId = socket.user._id.toString();
                const conv = await Conversation.findById(conversationId);
                if (!conv) return;

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

        // ── Live Meeting / Video Session Tracking with Teacher Admission Control
        socket.on('join_meeting', async (data = {}) => {
            try {
                const { meetingId, isCameraOn = false, isMicOn = false, isHandRaised = false, token } = data;
                if (!meetingId) return;

                // Resolve user from socket.user or provided token
                let user = socket.user;
                if (!user && token && typeof token === 'string') {
                    try {
                        const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
                        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
                        user = await User.findById(decoded.id).select('_id name email role avatar');
                        if (user) socket.user = user;
                    } catch {}
                }

                if (!user) {
                    return socket.emit('meeting_error', { message: 'Authentication required to join live meeting' });
                }

                const userId = user._id.toString();
                const roomName = `meeting_${meetingId}`;
                const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';

                // Initialize meeting session structure
                if (!meetingSessions.has(meetingId)) {
                    meetingSessions.set(meetingId, {
                        meetingId,
                        hostUserId: isTeacher ? userId : null,
                        acceptedParticipants: new Map(),
                        waitingRequests: new Map(),
                    });
                }

                const session = meetingSessions.get(meetingId);
                if (isTeacher && !session.hostUserId) {
                    session.hostUserId = userId;
                }

                const alreadyAdmitted = session.acceptedParticipants.has(userId);

                // TEACHER or ALREADY ADMITTED USER enters the live meeting directly
                if (isTeacher || alreadyAdmitted) {
                    // Remove from waiting requests if they were there
                    session.waitingRequests.delete(userId);

                    const participant = {
                        id: userId,
                        userId,
                        socketId: socket.id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar || '',
                        role: user.role,
                        isTeacher,
                        isCameraOn: Boolean(isCameraOn),
                        isMicOn: Boolean(isMicOn),
                        isHandRaised: Boolean(isHandRaised),
                        color: getUserColor(userId),
                        initials: getInitials(user.name),
                        joinedAt: new Date(),
                    };

                    // Keyed by userId to prevent duplicates on refresh
                    session.acceptedParticipants.set(userId, participant);

                    const userMeetings = socketMeetings.get(socket.id);
                    if (userMeetings) userMeetings.add(meetingId);

                    socket.join(roomName);

                    const currentParticipants = Array.from(session.acceptedParticipants.values());
                    const count = currentParticipants.length;
                    const waitingList = Array.from(session.waitingRequests.values());

                    // Send complete room state to joining participant
                    socket.emit('meeting_state', {
                        meetingId,
                        status: 'admitted',
                        participants: currentParticipants,
                        participantCount: count,
                        waitingRequests: waitingList,
                    });

                    // Broadcast join event to all other room members
                    socket.to(roomName).emit('participant_joined', {
                        meetingId,
                        participant,
                        participantCount: count,
                    });

                    io.to(roomName).emit('participant_count_updated', {
                        meetingId,
                        participantCount: count,
                    });

                    console.log(`[Meeting ${meetingId}]: User "${user.name}" (${user.role}) admitted to room. Total: ${count}`);
                } else {
                    // STUDENT: Must wait for teacher admission!
                    const request = {
                        userId,
                        socketId: socket.id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar || '',
                        initials: getInitials(user.name),
                        requestedAt: new Date(),
                        isCameraOn: Boolean(isCameraOn),
                        isMicOn: Boolean(isMicOn),
                    };

                    session.waitingRequests.set(userId, request);

                    const userMeetings = socketMeetings.get(socket.id);
                    if (userMeetings) userMeetings.add(meetingId);

                    socket.join(`waiting_${meetingId}`);

                    // Send waiting state to student
                    socket.emit('join_waiting', {
                        meetingId,
                        status: 'waiting',
                        message: 'Waiting for the teacher to admit you...',
                    });

                    // Notify teacher/host in the live meeting room
                    io.to(roomName).emit('new_join_request', {
                        meetingId,
                        request,
                        waitingCount: session.waitingRequests.size,
                    });

                    io.to(roomName).emit('waiting_requests_updated', {
                        meetingId,
                        waitingRequests: Array.from(session.waitingRequests.values()),
                    });

                    console.log(`[Meeting ${meetingId}]: Student "${user.name}" queued in waiting room.`);
                }
            } catch (err) {
                console.error('Socket join_meeting error:', err);
                socket.emit('meeting_error', { message: 'Failed to join meeting' });
            }
        });

        // Teacher Admits Student into Live Class
        socket.on('admit_student', ({ meetingId, studentId, studentUserId } = {}) => {
            try {
                const targetStudentId = studentId || studentUserId;
                if (!meetingId || !targetStudentId || !socket.user) return;
                const isTeacher = socket.user.role === 'TEACHER' || socket.user.role === 'ADMIN';
                if (!isTeacher) {
                    return socket.emit('meeting_error', { message: 'Only instructors can admit students' });
                }

                const session = meetingSessions.get(meetingId);
                if (!session) return;

                const request = session.waitingRequests.get(targetStudentId);
                if (!request) return;

                // Remove from waiting requests
                session.waitingRequests.delete(targetStudentId);

                // Build clean admitted participant
                const participant = {
                    id: targetStudentId,
                    userId: targetStudentId,
                    socketId: request.socketId,
                    name: request.name,
                    email: request.email,
                    avatar: request.avatar,
                    role: 'STUDENT',
                    isTeacher: false,
                    isCameraOn: Boolean(request.isCameraOn),
                    isMicOn: Boolean(request.isMicOn),
                    isHandRaised: false,
                    color: getUserColor(studentId),
                    initials: request.initials,
                    joinedAt: new Date(),
                };

                session.acceptedParticipants.set(targetStudentId, participant);

                const roomName = `meeting_${meetingId}`;

                // Target student socket: leave waiting room, join live meeting room
                const targetSocket = io.sockets.sockets.get(request.socketId);
                if (targetSocket) {
                    targetSocket.leave(`waiting_${meetingId}`);
                    targetSocket.join(roomName);

                    const currentParticipants = Array.from(session.acceptedParticipants.values());
                    const count = currentParticipants.length;

                    targetSocket.emit('join_admitted', {
                        meetingId,
                        status: 'admitted',
                        participants: currentParticipants,
                        participantCount: count,
                    });
                }

                const currentParticipants = Array.from(session.acceptedParticipants.values());
                const count = currentParticipants.length;

                // Broadcast participant_joined to all other room members
                io.to(roomName).emit('participant_joined', {
                    meetingId,
                    participant,
                    participantCount: count,
                });

                io.to(roomName).emit('participant_count_updated', {
                    meetingId,
                    participantCount: count,
                });

                // Update waiting list for the teacher
                io.to(roomName).emit('waiting_requests_updated', {
                    meetingId,
                    waitingRequests: Array.from(session.waitingRequests.values()),
                });

                console.log(`[Meeting ${meetingId}]: Teacher "${socket.user.name}" admitted student "${request.name}". Total: ${count}`);
            } catch (err) {
                console.error('Socket admit_student error:', err);
            }
        });

        // Teacher Rejects Student
        socket.on('reject_student', ({ meetingId, studentId, studentUserId } = {}) => {
            try {
                const targetStudentId = studentId || studentUserId;
                if (!meetingId || !targetStudentId || !socket.user) return;
                const isTeacher = socket.user.role === 'TEACHER' || socket.user.role === 'ADMIN';
                if (!isTeacher) {
                    return socket.emit('meeting_error', { message: 'Only instructors can decline join requests' });
                }

                const session = meetingSessions.get(meetingId);
                if (!session) return;

                const request = session.waitingRequests.get(targetStudentId);
                if (!request) return;

                session.waitingRequests.delete(targetStudentId);

                // Notify student socket of rejection
                const targetSocket = io.sockets.sockets.get(request.socketId);
                if (targetSocket) {
                    targetSocket.leave(`waiting_${meetingId}`);
                    targetSocket.emit('join_rejected', {
                        meetingId,
                        status: 'rejected',
                        message: 'Your request to join this live class was declined by the instructor.',
                    });
                }

                const roomName = `meeting_${meetingId}`;
                io.to(roomName).emit('waiting_requests_updated', {
                    meetingId,
                    waitingRequests: Array.from(session.waitingRequests.values()),
                });

                console.log(`[Meeting ${meetingId}]: Teacher "${socket.user.name}" rejected student "${request.name}".`);
            } catch (err) {
                console.error('Socket reject_student error:', err);
            }
        });

        socket.on('leave_meeting', ({ meetingId } = {}) => {
            if (!meetingId || !socket.user) return;
            handleUserLeaveMeeting(socket, meetingId);
        });

        socket.on('meeting_media_toggle', ({ meetingId, isCameraOn, isMicOn, isHandRaised } = {}) => {
            if (!meetingId || !socket.user) return;
            const userId = socket.user._id.toString();
            const session = meetingSessions.get(meetingId);
            if (!session || !session.acceptedParticipants.has(userId)) return;

            const participant = session.acceptedParticipants.get(userId);
            if (typeof isCameraOn === 'boolean') participant.isCameraOn = isCameraOn;
            if (typeof isMicOn === 'boolean') participant.isMicOn = isMicOn;
            if (typeof isHandRaised === 'boolean') participant.isHandRaised = isHandRaised;

            io.to(`meeting_${meetingId}`).emit('participant_media_updated', {
                meetingId,
                userId,
                isCameraOn: participant.isCameraOn,
                isMicOn: participant.isMicOn,
                isHandRaised: participant.isHandRaised,
            });
        });

        socket.on('meeting_chat', ({ meetingId, text } = {}) => {
            if (!meetingId || !text || !socket.user) return;
            const cleanText = String(text).trim();
            if (!cleanText) return;

            const user = socket.user;
            const chatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                userId: user._id.toString(),
                user: user.name,
                role: user.role,
                isHost: user.role === 'TEACHER' || user.role === 'ADMIN',
                msg: cleanText,
                time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            };

            io.to(`meeting_${meetingId}`).emit('meeting_chat_message', {
                meetingId,
                message: chatMessage,
            });
        });

        socket.on('meeting_reaction', ({ meetingId, emoji } = {}) => {
            if (!meetingId || !emoji || !socket.user) return;
            io.to(`meeting_${meetingId}`).emit('meeting_reaction', {
                meetingId,
                emoji,
                userId: socket.user._id.toString(),
                user: socket.user.name,
            });
        });

        // ── Disconnect & Cleanup ──────────────────────────────────
        socket.on('disconnect', () => {
            const userMeetings = socketMeetings.get(socket.id);
            if (userMeetings) {
                userMeetings.forEach((meetingId) => {
                    handleUserLeaveMeeting(socket, meetingId);
                });
                socketMeetings.delete(socket.id);
            }
        });
    });

    return io;
};

// Helper to remove participant and broadcast leave
const handleUserLeaveMeeting = (socket, meetingId) => {
    try {
        const session = meetingSessions.get(meetingId);
        if (!session) return;

        let leftUserId = null;
        let leftUserName = null;

        if (socket.user && socket.user._id) {
            leftUserId = socket.user._id.toString();
            leftUserName = socket.user.name;
        } else {
            // Find by socketId in acceptedParticipants
            for (const [uid, p] of session.acceptedParticipants.entries()) {
                if (p.socketId === socket.id) {
                    leftUserId = uid;
                    leftUserName = p.name;
                    break;
                }
            }
            // Or find by socketId in waitingRequests
            if (!leftUserId) {
                for (const [uid, r] of session.waitingRequests.entries()) {
                    if (r.socketId === socket.id) {
                        leftUserId = uid;
                        leftUserName = r.name;
                        break;
                    }
                }
            }
        }

        if (!leftUserId) return;

        const roomName = `meeting_${meetingId}`;

        // 1. If in waitingRequests:
        if (session.waitingRequests.has(leftUserId)) {
            session.waitingRequests.delete(leftUserId);
            socket.leave(`waiting_${meetingId}`);
            io.to(roomName).emit('waiting_requests_updated', {
                meetingId,
                waitingRequests: Array.from(session.waitingRequests.values()),
            });
            console.log(`[Meeting ${meetingId}]: Student "${leftUserName}" left waiting room.`);
        }

        // 2. If in acceptedParticipants:
        if (session.acceptedParticipants.has(leftUserId)) {
            session.acceptedParticipants.delete(leftUserId);
            socket.leave(roomName);

            const remaining = Array.from(session.acceptedParticipants.values());
            const count = remaining.length;

            io.to(roomName).emit('participant_left', {
                meetingId,
                userId: leftUserId,
                name: leftUserName,
                participantCount: count,
            });

            io.to(roomName).emit('participant_count_updated', {
                meetingId,
                participantCount: count,
            });

            console.log(`[Meeting ${meetingId}]: Admitted user "${leftUserName}" left. Remaining: ${count}`);
        }

        // 3. Clean up empty session
        if (session.acceptedParticipants.size === 0 && session.waitingRequests.size === 0) {
            meetingSessions.delete(meetingId);
            console.log(`[Meeting ${meetingId}]: Room empty, session cleared.`);
        }
    } catch (err) {
        console.error('handleUserLeaveMeeting error:', err);
    }
};

const getIO = () => io;

const getActiveMeetingParticipants = (meetingId) => {
    const session = meetingSessions.get(meetingId);
    if (!session) return [];
    return Array.from(session.acceptedParticipants.values());
};

module.exports = { initSocket, getIO, getActiveMeetingParticipants };

