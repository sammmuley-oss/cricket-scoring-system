const express = require('express');
const router = express.Router();
const { getTournaments, getTournament, createTournament, updateTournament,
    deleteTournament, addTeamToTournament, getPointsTable } = require('../controllers/tournamentController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', getTournaments);
router.get('/:id', getTournament);
router.post('/', protect, requireRole('admin', 'coordinator'), createTournament);
router.put('/:id', protect, requireRole('admin', 'coordinator'), updateTournament);
router.delete('/:id', protect, requireRole('admin'), deleteTournament);
router.post('/:id/teams', protect, requireRole('admin', 'coordinator'), addTeamToTournament);
router.get('/:id/points-table', getPointsTable);

module.exports = router;
