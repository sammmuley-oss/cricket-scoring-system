const express = require('express');
const router = express.Router();
const { getTeams, getTeam, createTeam, updateTeam, deleteTeam, addPlayerToTeam } = require('../controllers/teamController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', getTeams);
router.get('/:id', getTeam);
router.post('/', protect, requireRole('admin', 'coordinator'), createTeam);
router.put('/:id', protect, requireRole('admin', 'coordinator'), updateTeam);
router.delete('/:id', protect, requireRole('admin'), deleteTeam);
router.post('/:id/players', protect, requireRole('admin', 'coordinator'), addPlayerToTeam);

module.exports = router;
