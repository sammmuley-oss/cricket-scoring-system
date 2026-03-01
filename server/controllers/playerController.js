const Player = require('../models/Player');
const Team = require('../models/Team');

// GET /api/players
exports.getPlayers = async (req, res) => {
    try {
        const filter = {};
        if (req.query.team) filter.team = req.query.team;
        if (req.query.role) filter.role = req.query.role;
        if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
        const players = await Player.find(filter).populate('team', 'name shortName');
        res.json({ success: true, data: players });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/players/:id
exports.getPlayer = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id).populate('team', 'name shortName color');
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/players
exports.createPlayer = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const player = await Player.create(req.body);
        // If team was specified, add player to team
        if (req.body.team) {
            await Team.findByIdAndUpdate(req.body.team, { $addToSet: { players: player._id } });
        }
        res.status(201).json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/players/:id
exports.updatePlayer = async (req, res) => {
    try {
        const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        res.json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/players/:id
exports.deletePlayer = async (req, res) => {
    try {
        const player = await Player.findByIdAndDelete(req.params.id);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        // Remove from team
        if (player.team) {
            await Team.findByIdAndUpdate(player.team, { $pull: { players: player._id } });
        }
        res.json({ success: true, message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
