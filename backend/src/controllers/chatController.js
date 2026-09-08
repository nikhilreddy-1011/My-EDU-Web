const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// @desc   Get user's conversations
// @route  GET /api/v1/conversations
// @access Private (STUDENT or TEACHER)
const getConversations = async (req, res, next) => {
    try {
        const query = req.user.role === 'TEACHER'
            ? { teacher: req.user._id }
            : { student: req.user._id };

        const conversations = await Conversation.find(query)
            .populate('course', 'title thumbnail category instructor')
            .populate('teacher', 'name avatar email bio')
            .populate('student', 'name avatar email')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({
            success: true,
            count: conversations.length,
            conversations,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get or create course-specific conversation with strict authorization
// @route  POST /api/v1/conversations
// @access Private (STUDENT)
const startConversation = async (req, res, next) => {
    try {
        const { courseId, teacherId } = req.body;
        const studentId = req.user._id;

        if (!courseId) {
            return res.status(400).json({ success: false, message: 'Course ID is required' });
        }

        // 1. Check Course Exists
        const course = await Course.findById(courseId).select('title instructor published isFree price');
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const actualTeacherId = course.instructor.toString();

        // 2. If teacherId was passed, verify it belongs to this course
        if (teacherId && teacherId.toString() !== actualTeacherId) {
            return res.status(403).json({
                success: false,
                message: 'Students can only contact the teacher of a course they are enrolled in.',
            });
        }

        // 3. Verify Student has valid enrollment/access to this course
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: 'paid',
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Students can only contact the teacher of a course they are enrolled in.',
            });
        }

        // 4. Find existing conversation or create new
        let conversation = await Conversation.findOne({
            student: studentId,
            course: courseId,
            teacher: actualTeacherId,
        })
            .populate('course', 'title thumbnail category')
            .populate('teacher', 'name avatar email bio')
            .populate('student', 'name avatar email');

        if (!conversation) {
            const created = await Conversation.create({
                student: studentId,
                course: courseId,
                teacher: actualTeacherId,
                lastMessage: '',
                lastMessageAt: new Date(),
            });

            conversation = await Conversation.findById(created._id)
                .populate('course', 'title thumbnail category')
                .populate('teacher', 'name avatar email bio')
                .populate('student', 'name avatar email');
        }

        res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Get messages for a conversation
// @route  GET /api/v1/conversations/:id/messages
// @access Private (STUDENT or TEACHER)
const getMessages = async (req, res, next) => {
    try {
        const conversationId = req.params.id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const userId = req.user._id.toString();
        const isStudent = conversation.student.toString() === userId;
        const isTeacher = conversation.teacher.toString() === userId;

        if (!isStudent && !isTeacher && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name avatar role')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: messages.length,
            messages,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Send a message in a course conversation
// @route  POST /api/v1/conversations/:id/messages
// @access Private (STUDENT or TEACHER)
const sendMessage = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const conversation = await Conversation.findById(conversationId).populate('course', 'title');
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        const senderId = req.user._id.toString();
        const isStudent = conversation.student.toString() === senderId;
        const isTeacher = conversation.teacher.toString() === senderId;

        if (!isStudent && !isTeacher && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to post in this conversation' });
        }

        // If sender is a student, re-validate enrollment
        if (isStudent) {
            const hasEnrollment = await Enrollment.exists({
                student: conversation.student,
                course: conversation.course._id,
                status: 'paid',
            });
            if (!hasEnrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'Students can only contact the teacher of a course they are enrolled in.',
                });
            }
        }

        const receiverId = isStudent ? conversation.teacher : conversation.student;

        // Create message
        const newMsg = await Message.create({
            conversation: conversationId,
            course: conversation.course._id,
            sender: req.user._id,
            receiver: receiverId,
            message: message.trim(),
        });

        // Update conversation metadata
        conversation.lastMessage = message.trim();
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSender = req.user._id;

        if (isStudent) {
            conversation.unreadTeacher = (conversation.unreadTeacher || 0) + 1;
        } else {
            conversation.unreadStudent = (conversation.unreadStudent || 0) + 1;
        }
        await conversation.save();

        const populatedMsg = await Message.findById(newMsg._id).populate('sender', 'name avatar role');

        // Create in-app Notification for receiver
        try {
            const notif = await Notification.create({
                user: receiverId,
                type: 'message',
                title: isTeacher ? `Teacher replied in ${conversation.course.title}` : `New question in ${conversation.course.title}`,
                message: `${req.user.name}: "${message.trim().slice(0, 70)}${message.length > 70 ? '...' : ''}"`,
                link: '/student/messages',
                metadata: { conversationId, courseId: conversation.course._id },
            });

            // Emit real-time socket events
            const io = getIO();
            if (io) {
                io.to(`conv_${conversationId}`).emit('new_message', populatedMsg);
                io.to(`user_${receiverId.toString()}`).emit('new_notification', notif);
            }
        } catch (e) {
            console.warn('Notification creation error:', e);
        }

        res.status(201).json({
            success: true,
            message: populatedMsg,
        });
    } catch (error) {
        next(error);
    }
};

// @desc   Mark messages in conversation as read
// @route  PATCH /api/v1/conversations/:id/read
// @access Private
const markConversationAsRead = async (req, res, next) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        // Mark unread messages sent to current user as read
        await Message.updateMany(
            { conversation: conversationId, receiver: userId, read: false },
            { $set: { read: true, readAt: new Date() } }
        );

        if (conversation.student.toString() === userId.toString()) {
            conversation.unreadStudent = 0;
        } else if (conversation.teacher.toString() === userId.toString()) {
            conversation.unreadTeacher = 0;
        }
        await conversation.save();

        res.status(200).json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getConversations,
    startConversation,
    getMessages,
    sendMessage,
    markConversationAsRead,
};
