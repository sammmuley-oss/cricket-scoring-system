const mongoose = require('mongoose');

// Ball-level schema
const ballSchema = new mongoose.Schema({
    ballNumber: { type: Number, required: true },
    batsman: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    runs: { type: Number, default: 0 },        // Runs scored by batsman
    extras: {
        type: { type: String, enum: ['none', 'wide', 'noBall', 'bye', 'legBye', 'penalty'], default: 'none' },
        runs: { type: Number, default: 0 },
    },
    totalRuns: { type: Number, default: 0 },     // Total runs from this delivery
    isWicket: { type: Boolean, default: false },
    wicket: {
        type: { type: String, enum: ['bowled', 'caught', 'lbw', 'runOut', 'stumped', 'hitWicket', 'retired', 'retiredHurt', 'obstructing', ''] },
        batsman: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        fielder: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        bowlerCredit: { type: Boolean, default: true },
    },
    isLegal: { type: Boolean, default: true },    // false for wide/noball
    commentary: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });

// Over-level schema
const overSchema = new mongoose.Schema({
    overNumber: { type: Number, required: true },
    bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    balls: [ballSchema],
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    isMaiden: { type: Boolean, default: false },
}, { _id: true });

// Batting entry per batsman in an innings
const batsmanInningsSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    dismissal: {
        type: { type: String, default: 'not out' },
        bowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        fielder: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    },
    isOut: { type: Boolean, default: false },
    battingOrder: { type: Number, default: 0 },
}, { _id: true });

// Bowling entry per bowler in an innings
const bowlerInningsSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    overs: { type: Number, default: 0 },             // completed overs
    ballsBowled: { type: Number, default: 0 },        // legal balls
    maidens: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    dots: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
}, { _id: true });

// Partnership schema
const partnershipSchema = new mongoose.Schema({
    batsman1: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    batsman2: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    wicketNumber: { type: Number },
}, { _id: true });

// Fall of wicket
const fallOfWicketSchema = new mongoose.Schema({
    wicketNumber: { type: Number },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    score: { type: Number },
    overs: { type: String },
}, { _id: false });

// Innings schema
const inningsSchema = new mongoose.Schema({
    inningsNumber: { type: Number, required: true },
    battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    bowlingTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    totalRuns: { type: Number, default: 0 },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },       // e.g., 15.3 = 15 overs 3 balls
    totalBalls: { type: Number, default: 0 },        // legal balls bowled
    extras: {
        total: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noBalls: { type: Number, default: 0 },
        byes: { type: Number, default: 0 },
        legByes: { type: Number, default: 0 },
        penalty: { type: Number, default: 0 },
    },
    currentRunRate: { type: Number, default: 0 },
    requiredRunRate: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    overs: [overSchema],
    batsmen: [batsmanInningsSchema],
    bowlers: [bowlerInningsSchema],
    partnerships: [partnershipSchema],
    fallOfWickets: [fallOfWicketSchema],
    currentBatsman: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    currentNonStriker: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    currentBowler: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    isCompleted: { type: Boolean, default: false },
    isDeclared: { type: Boolean, default: false },
}, { _id: true });

// Match schema (top level)
const matchSchema = new mongoose.Schema({
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    matchNumber: { type: Number },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    venue: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    oversPerInning: { type: Number, default: 20 },
    format: { type: String, enum: ['T20', 'ODI', 'Test', 'Custom'], default: 'T20' },
    status: { type: String, enum: ['upcoming', 'toss', 'live', 'completed', 'abandoned'], default: 'upcoming' },
    toss: {
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        decision: { type: String, enum: ['bat', 'bowl', ''] },
    },
    innings: [inningsSchema],
    currentInnings: { type: Number, default: 0 },
    result: {
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        resultText: { type: String, default: '' },
        winMargin: { type: Number },
        winType: { type: String, enum: ['runs', 'wickets', 'tie', 'noResult', ''] },
        playerOfMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    },
    // Playing XI for each team
    playingXI: {
        teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
        teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    },
    scorers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
