const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Team name is required'], trim: true, unique: true },
    shortName: { type: String, required: true, trim: true, maxlength: 5, uppercase: true },
    logo: { type: String, default: '' },
    color: { type: String, default: '#1e40af' },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    coach: { type: String, default: '' },
    homeGround: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
