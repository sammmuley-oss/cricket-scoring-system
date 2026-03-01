const ScoringEngine = require('../services/scoringEngine');
const Match = require('../models/Match');

// POST /api/scoring/:matchId/ball - Record a ball
exports.recordBall = async (req, res) => {
    try {
        const match = await ScoringEngine.recordBall(req.params.matchId, req.body);

        // Emit via socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`match-${req.params.matchId}`).emit('ball-scored', {
                matchId: req.params.matchId,
                ball: req.body,
                innings: match.innings[match.currentInnings - 1],
            });
            io.to(`match-${req.params.matchId}`).emit('score-update', match);
        }

        // If match completed, update tournament and player stats
        if (match.status === 'completed') {
            await ScoringEngine.updateTournamentPoints(match._id);
            await ScoringEngine.updatePlayerCareerStats(match._id);
            if (io) {
                io.to(`match-${req.params.matchId}`).emit('match-completed', match);
            }
        }

        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/scoring/:matchId/undo - Undo last ball
exports.undoLastBall = async (req, res) => {
    try {
        const match = await ScoringEngine.undoLastBall(req.params.matchId);
        const io = req.app.get('io');
        if (io) {
            io.to(`match-${req.params.matchId}`).emit('score-update', match);
        }
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/scoring/:matchId/second-innings - Start second innings
exports.startSecondInnings = async (req, res) => {
    try {
        const match = await ScoringEngine.startSecondInnings(req.params.matchId, req.body);
        const io = req.app.get('io');
        if (io) {
            io.to(`match-${req.params.matchId}`).emit('innings-change', match);
            io.to(`match-${req.params.matchId}`).emit('score-update', match);
        }
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/scoring/:matchId/end-innings - Force end innings
exports.endInnings = async (req, res) => {
    try {
        const match = await Match.findById(req.params.matchId);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        const innings = match.innings[match.currentInnings - 1];
        innings.isCompleted = true;
        innings.isDeclared = true;
        await match.save();
        const io = req.app.get('io');
        if (io) {
            io.to(`match-${req.params.matchId}`).emit('innings-change', match);
        }
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
