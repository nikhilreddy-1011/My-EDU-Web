const express = require('express');
const router = express.Router();
const {
    getLiveClasses,
    scheduleLiveClass,
    getLiveClassById,
    updateLiveClassStatus,
    deleteLiveClass,
    checkLiveClassAccess,
} = require('../controllers/liveClassController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(getLiveClasses)
    .post(protect, authorize('TEACHER', 'ADMIN'), scheduleLiveClass);

// Access check: verifies authenticated student enrollment or teacher ownership
router.route('/:id/access')
    .get(protect, checkLiveClassAccess);

router.route('/:id')
    .get(getLiveClassById)
    .delete(protect, authorize('TEACHER', 'ADMIN'), deleteLiveClass);

router.route('/:id/status')
    .patch(protect, authorize('TEACHER', 'ADMIN'), updateLiveClassStatus);

module.exports = router;


