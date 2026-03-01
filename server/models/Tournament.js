const mongoose = require('mongoose');

const pointsEntrySchema = new mongoose.Schema({
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    noResult: { type: Number, default: 0 },
    runsScored: { type: Number, default: 0 },
    oversPlayed: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    oversFaced: { type: Number, default: 0 },
    nrr: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Tournament name is required'], trim: true },
    format: { type: String, enum: ['T20', 'ODI', 'Test', 'Custom'], default: 'T20' },
    oversPerInning: { type: Number, default: 20 },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Match' }],
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    venue: { type: String, default: '' },
    description: { type: String, default: '' },
    pointsTable: [pointsEntrySchema],
    pointsPerWin: { type: Number, default: 2 },
    pointsPerTie: { type: Number, default: 1 },
    pointsPerNoResult: { type: Number, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
