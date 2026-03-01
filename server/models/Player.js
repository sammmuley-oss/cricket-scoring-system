const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Player name is required'], trim: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    role: { type: String, enum: ['batsman', 'bowler', 'allrounder', 'wicketkeeper'], default: 'batsman' },
    battingStyle: { type: String, enum: ['right-hand', 'left-hand'], default: 'right-hand' },
    bowlingStyle: {
        type: String,
        enum: ['right-arm-fast', 'left-arm-fast', 'right-arm-medium', 'left-arm-medium',
            'right-arm-offspin', 'left-arm-orthodox', 'right-arm-legspin', 'left-arm-chinaman', 'none'],
        default: 'none'
    },
    jerseyNumber: { type: Number },
    avatar: { type: String, default: '' },
    // Career statistics (aggregated)
    stats: {
        matches: { type: Number, default: 0 },
        batting: {
            innings: { type: Number, default: 0 },
            runs: { type: Number, default: 0 },
            ballsFaced: { type: Number, default: 0 },
            fours: { type: Number, default: 0 },
            sixes: { type: Number, default: 0 },
            highestScore: { type: Number, default: 0 },
            notOuts: { type: Number, default: 0 },
            fifties: { type: Number, default: 0 },
            hundreds: { type: Number, default: 0 },
        },
        bowling: {
            innings: { type: Number, default: 0 },
            overs: { type: Number, default: 0 },
            ballsBowled: { type: Number, default: 0 },
            runsConceded: { type: Number, default: 0 },
            wickets: { type: Number, default: 0 },
            maidens: { type: Number, default: 0 },
            bestFiguresWickets: { type: Number, default: 0 },
            bestFiguresRuns: { type: Number, default: 0 },
            fiveWickets: { type: Number, default: 0 },
        },
        fielding: {
            catches: { type: Number, default: 0 },
            runOuts: { type: Number, default: 0 },
            stumpings: { type: Number, default: 0 },
        }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual: batting average
playerSchema.virtual('battingAverage').get(function () {
    const dismissals = this.stats.batting.innings - this.stats.batting.notOuts;
    return dismissals > 0 ? (this.stats.batting.runs / dismissals).toFixed(2) : this.stats.batting.runs;
});

// Virtual: strike rate
playerSchema.virtual('battingStrikeRate').get(function () {
    return this.stats.batting.ballsFaced > 0
        ? ((this.stats.batting.runs / this.stats.batting.ballsFaced) * 100).toFixed(2) : 0;
});

// Virtual: bowling average
playerSchema.virtual('bowlingAverage').get(function () {
    return this.stats.bowling.wickets > 0
        ? (this.stats.bowling.runsConceded / this.stats.bowling.wickets).toFixed(2) : 0;
});

// Virtual: economy
playerSchema.virtual('bowlingEconomy').get(function () {
    const overs = this.stats.bowling.ballsBowled / 6;
    return overs > 0 ? (this.stats.bowling.runsConceded / overs).toFixed(2) : 0;
});

playerSchema.set('toJSON', { virtuals: true });
playerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Player', playerSchema);
