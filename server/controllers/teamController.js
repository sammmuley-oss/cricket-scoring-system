const Team = require('../models/Team');
const Player = require('../models/Player');

// GET /api/teams
exports.getTeams = async (req, res) => {
    try {
        const teams = await Team.find().populate('players', 'name role jerseyNumber').populate('captain', 'name');
        res.json({ success: true, data: teams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/teams/:id
exports.getTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('players', 'name role jerseyNumber battingStyle bowlingStyle stats')
            .populate('captain', 'name');
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/teams
exports.createTeam = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const team = await Team.create(req.body);
        res.status(201).json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/teams/:id
exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/teams/:id/players - Add player to team
exports.addPlayerToTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
        const player = await Player.findById(req.body.playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
        if (!team.players.includes(player._id)) {
            team.players.push(player._id);
            player.team = team._id;
            await Promise.all([team.save(), player.save()]);
        }
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
