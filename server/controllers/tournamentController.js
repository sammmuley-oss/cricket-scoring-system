const Tournament = require('../models/Tournament');

// GET /api/tournaments
exports.getTournaments = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        const tournaments = await Tournament.find(filter)
            .populate('teams', 'name shortName color')
            .populate('createdBy', 'name')
            .sort('-createdAt');
        res.json({ success: true, data: tournaments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/tournaments/:id
exports.getTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('teams', 'name shortName color players')
            .populate('matches')
            .populate('pointsTable.team', 'name shortName color');
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, data: tournament });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/tournaments
exports.createTournament = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const tournament = await Tournament.create(req.body);
        res.status(201).json({ success: true, data: tournament });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/tournaments/:id
exports.updateTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, data: tournament });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/tournaments/:id
exports.deleteTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, message: 'Tournament deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/tournaments/:id/teams - Add team to tournament
exports.addTeamToTournament = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        const { teamId } = req.body;
        if (tournament.teams.includes(teamId)) {
            return res.status(400).json({ success: false, message: 'Team already in tournament' });
        }
        tournament.teams.push(teamId);
        // Add team to points table
        tournament.pointsTable.push({ team: teamId });
        await tournament.save();
        res.json({ success: true, data: tournament });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/tournaments/:id/points-table
exports.getPointsTable = async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('pointsTable.team', 'name shortName color');
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        // Sort by points, then NRR
        const sorted = tournament.pointsTable.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.nrr - a.nrr;
        });
        res.json({ success: true, data: sorted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
