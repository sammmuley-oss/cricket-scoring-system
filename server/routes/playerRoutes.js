const express = require('express');
const router = express.Router();
const { getPlayers, getPlayer, createPlayer, updatePlayer, deletePlayer } = require('../controllers/playerController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/', getPlayers);
router.get('/:id', getPlayer);
router.post('/', protect, requireRole('admin', 'coordinator'), createPlayer);
router.put('/:id', protect, requireRole('admin', 'coordinator'), updatePlayer);
router.delete('/:id', protect, requireRole('admin'), deletePlayer);

module.exports = router;
