const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// GET /api/matches
exports.getMatches = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.tournament) filter.tournament = req.query.tournament;
        if (req.query.team) filter.$or = [{ teamA: req.query.team }, { teamB: req.query.team }];
        const matches = await Match.find(filter)
            .populate('teamA', 'name shortName color')
            .populate('teamB', 'name shortName color')
            .populate('tournament', 'name')
            .populate('result.winner', 'name shortName')
            .sort('-date');
        res.json({ success: true, data: matches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/matches/:id
exports.getMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('teamA', 'name shortName color players')
            .populate('teamB', 'name shortName color players')
            .populate('tournament', 'name format')
            .populate('toss.winner', 'name shortName')
            .populate('innings.battingTeam', 'name shortName color')
            .populate('innings.bowlingTeam', 'name shortName color')
            .populate('innings.batsmen.player', 'name jerseyNumber')
            .populate('innings.bowlers.player', 'name jerseyNumber')
            .populate('innings.batsmen.dismissal.bowler', 'name')
            .populate('innings.batsmen.dismissal.fielder', 'name')
            .populate('innings.currentBatsman', 'name')
            .populate('innings.currentNonStriker', 'name')
            .populate('innings.currentBowler', 'name')
            .populate('innings.partnerships.batsman1', 'name')
            .populate('innings.partnerships.batsman2', 'name')
            .populate('innings.fallOfWickets.player', 'name')
            .populate('result.winner', 'name shortName')
            .populate('result.playerOfMatch', 'name')
            .populate('playingXI.teamA', 'name role jerseyNumber')
            .populate('playingXI.teamB', 'name role jerseyNumber');
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/matches
exports.createMatch = async (req, res) => {
    try {
        req.body.createdBy = req.user._id;
        const match = await Match.create(req.body);
        // If tournament specified, add match to tournament
        if (req.body.tournament) {
            await Tournament.findByIdAndUpdate(req.body.tournament, { $push: { matches: match._id } });
        }
        res.status(201).json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/matches/:id
exports.updateMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/matches/:id
exports.deleteMatch = async (req, res) => {
    try {
        const match = await Match.findByIdAndDelete(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, message: 'Match deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/matches/:id/toss - Set toss result
exports.setToss = async (req, res) => {
    try {
        const { winner, decision } = req.body;
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        match.toss = { winner, decision };
        match.status = 'toss';
        await match.save();
        res.json({ success: true, data: match });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/matches/:id/start - Start match (begin first innings)
exports.startMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
        const { playingXI, openingBatsmen, openingBowler } = req.body;

        // Determine batting team based on toss
        let battingTeam, bowlingTeam;
        if (match.toss.decision === 'bat') {
            battingTeam = match.toss.winner;
            bowlingTeam = match.toss.winner.toString() === match.teamA.toString() ? match.teamB : match.teamA;
        } else {
            bowlingTeam = match.toss.winner;
            battingTeam = match.toss.winner.toString() === match.teamA.toString() ? match.teamB : match.teamA;
        }

        // Set playing XI
        if (playingXI) {
            match.playingXI = playingXI;
        }

        // Initialize first innings
        const firstInnings = {
            inningsNumber: 1,
            battingTeam,
            bowlingTeam,
            batsmen: [
                { player: openingBatsmen[0], battingOrder: 1 },
                { player: openingBatsmen[1], battingOrder: 2 },
            ],
            bowlers: [{ player: openingBowler }],
            partnerships: [{
                batsman1: openingBatsmen[0],
                batsman2: openingBatsmen[1],
                runs: 0, balls: 0, wicketNumber: 1,
            }],
            currentBatsman: openingBatsmen[0],
            currentNonStriker: openingBatsmen[1],
            currentBowler: openingBowler,
            overs: [{ overNumber: 1, bowler: openingBowler, balls: [] }],
        };

        match.innings = [firstInnings];
        match.currentInnings = 1;
        match.status = 'live';
        await match.save();

        const populatedMatch = await Match.findById(match._id)
            .populate('teamA', 'name shortName color')
            .populate('teamB', 'name shortName color')
            .populate('innings.batsmen.player', 'name')
            .populate('innings.bowlers.player', 'name')
            .populate('innings.currentBatsman', 'name')
            .populate('innings.currentNonStriker', 'name')
            .populate('innings.currentBowler', 'name');

        res.json({ success: true, data: populatedMatch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/matches/live - Get all live matches
exports.getLiveMatches = async (req, res) => {
    try {
        const matches = await Match.find({ status: 'live' })
            .populate('teamA', 'name shortName color')
            .populate('teamB', 'name shortName color')
            .populate('tournament', 'name');
        res.json({ success: true, data: matches });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
