const express = require('express');
const {
    getConversations,
    startConversation,
    getMessages,
    sendMessage,
    markConversationAsRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, startConversation);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, sendMessage);
router.patch('/:id/read', protect, markConversationAsRead);

module.exports = router;
