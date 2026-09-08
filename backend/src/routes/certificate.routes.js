const express = require('express');
const {
    getMyCertificates,
    claimCertificate,
    verifyCertificate,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getMyCertificates);
router.post('/claim/:courseId', protect, claimCertificate);
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;
