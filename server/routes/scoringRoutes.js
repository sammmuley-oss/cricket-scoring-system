const express = require('express');
const router = express.Router();
const { recordBall, undoLastBall, startSecondInnings, endInnings } = require('../controllers/scoringController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/:matchId/ball', protect, requireRole('admin', 'coordinator', 'scorer'), recordBall);
router.post('/:matchId/undo', protect, requireRole('admin', 'coordinator', 'scorer'), undoLastBall);
router.post('/:matchId/second-innings', protect, requireRole('admin', 'coordinator', 'scorer'), startSecondInnings);
router.post('/:matchId/end-innings', protect, requireRole('admin', 'coordinator', 'scorer'), endInnings);

module.exports = router;
