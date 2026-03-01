const express = require('express');
const router = express.Router();
const { getMatches, getMatch, createMatch, updateMatch, deleteMatch,
    setToss, startMatch, getLiveMatches } = require('../controllers/matchController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/live', getLiveMatches);
router.get('/', getMatches);
router.get('/:id', getMatch);
router.post('/', protect, requireRole('admin', 'coordinator'), createMatch);
router.put('/:id', protect, requireRole('admin', 'coordinator'), updateMatch);
router.delete('/:id', protect, requireRole('admin'), deleteMatch);
router.post('/:id/toss', protect, requireRole('admin', 'coordinator', 'scorer'), setToss);
router.post('/:id/start', protect, requireRole('admin', 'coordinator', 'scorer'), startMatch);

module.exports = router;
