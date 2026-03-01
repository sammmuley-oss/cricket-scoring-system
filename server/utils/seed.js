/**
 * Database seed script - Creates sample data for development
 * Run: node utils/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');
const Tournament = require('../models/Tournament');

const connectDB = require('../config/db');

const seedData = async () => {
    try {
        await connectDB();
        console.log('🗑️  Clearing existing data...');
        await Promise.all([User.deleteMany(), Team.deleteMany(), Player.deleteMany(), Tournament.deleteMany()]);

        // Create users
        console.log('👤 Creating users...');
        const admin = await User.create({ name: 'Admin User', email: 'admin@cricket.com', password: 'password123', role: 'admin' });
        const coordinator = await User.create({ name: 'Match Coordinator', email: 'coordinator@cricket.com', password: 'password123', role: 'coordinator' });
        const scorer = await User.create({ name: 'Match Scorer', email: 'scorer@cricket.com', password: 'password123', role: 'scorer' });
        await User.create({ name: 'Viewer User', email: 'viewer@cricket.com', password: 'password123', role: 'viewer' });

        // Create teams
        console.log('🏏 Creating teams...');
        const teamAPlayers = [
            { name: 'Rohit Sharma', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'right-arm-offspin', jerseyNumber: 45 },
            { name: 'Shubman Gill', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'right-arm-medium', jerseyNumber: 77 },
            { name: 'Virat Kohli', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'right-arm-medium', jerseyNumber: 18 },
            { name: 'KL Rahul', role: 'wicketkeeper', battingStyle: 'right-hand', bowlingStyle: 'none', jerseyNumber: 1 },
            { name: 'Hardik Pandya', role: 'allrounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', jerseyNumber: 33 },
            { name: 'Ravindra Jadeja', role: 'allrounder', battingStyle: 'left-hand', bowlingStyle: 'left-arm-orthodox', jerseyNumber: 8 },
            { name: 'Jasprit Bumrah', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', jerseyNumber: 93 },
            { name: 'Mohammed Shami', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', jerseyNumber: 11 },
            { name: 'Ravichandran Ashwin', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'right-arm-offspin', jerseyNumber: 99 },
            { name: 'Kuldeep Yadav', role: 'bowler', battingStyle: 'left-hand', bowlingStyle: 'left-arm-chinaman', jerseyNumber: 23 },
            { name: 'Suryakumar Yadav', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'none', jerseyNumber: 63 },
        ];

        const teamBPlayers = [
            { name: 'Pat Cummins', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'right-arm-fast', jerseyNumber: 30 },
            { name: 'David Warner', role: 'batsman', battingStyle: 'left-hand', bowlingStyle: 'right-arm-legspin', jerseyNumber: 31 },
            { name: 'Steve Smith', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'right-arm-legspin', jerseyNumber: 49 },
            { name: 'Marnus Labuschagne', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'right-arm-legspin', jerseyNumber: 71 },
            { name: 'Glenn Maxwell', role: 'allrounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-offspin', jerseyNumber: 32 },
            { name: 'Mitchell Starc', role: 'bowler', battingStyle: 'left-hand', bowlingStyle: 'left-arm-fast', jerseyNumber: 56 },
            { name: 'Josh Hazlewood', role: 'bowler', battingStyle: 'left-hand', bowlingStyle: 'right-arm-fast', jerseyNumber: 38 },
            { name: 'Adam Zampa', role: 'bowler', battingStyle: 'right-hand', bowlingStyle: 'right-arm-legspin', jerseyNumber: 63 },
            { name: 'Alex Carey', role: 'wicketkeeper', battingStyle: 'left-hand', bowlingStyle: 'none', jerseyNumber: 5 },
            { name: 'Travis Head', role: 'batsman', battingStyle: 'left-hand', bowlingStyle: 'right-arm-offspin', jerseyNumber: 14 },
            { name: 'Marcus Stoinis', role: 'allrounder', battingStyle: 'right-hand', bowlingStyle: 'right-arm-medium', jerseyNumber: 17 },
        ];

        const playersA = await Player.insertMany(teamAPlayers.map(p => ({ ...p, createdBy: admin._id })));
        const playersB = await Player.insertMany(teamBPlayers.map(p => ({ ...p, createdBy: admin._id })));

        const teamA = await Team.create({
            name: 'India', shortName: 'IND', color: '#0066b2',
            players: playersA.map(p => p._id), captain: playersA[0]._id,
            coach: 'Rahul Dravid', homeGround: 'Wankhede Stadium', createdBy: admin._id,
        });
        const teamB = await Team.create({
            name: 'Australia', shortName: 'AUS', color: '#ffcd00',
            players: playersB.map(p => p._id), captain: playersB[0]._id,
            coach: 'Andrew McDonald', homeGround: 'Melbourne Cricket Ground', createdBy: admin._id,
        });

        // Update players with team reference
        await Player.updateMany({ _id: { $in: playersA.map(p => p._id) } }, { team: teamA._id });
        await Player.updateMany({ _id: { $in: playersB.map(p => p._id) } }, { team: teamB._id });

        // Create tournament
        console.log('🏆 Creating tournament...');
        const tournament = await Tournament.create({
            name: 'Champions Trophy 2026', format: 'ODI', oversPerInning: 50,
            teams: [teamA._id, teamB._id], startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'ongoing', venue: 'Multiple Venues',
            description: 'ICC Champions Trophy 2026',
            pointsTable: [
                { team: teamA._id, played: 0, won: 0, lost: 0, points: 0, nrr: 0 },
                { team: teamB._id, played: 0, won: 0, lost: 0, points: 0, nrr: 0 },
            ],
            createdBy: admin._id,
        });

        console.log('✅ Seed data created successfully!');
        console.log('\n📋 Login credentials:');
        console.log('  Admin:       admin@cricket.com / password123');
        console.log('  Coordinator: coordinator@cricket.com / password123');
        console.log('  Scorer:      scorer@cricket.com / password123');
        console.log('  Viewer:      viewer@cricket.com / password123');
        console.log(`\n🏏 Teams: ${teamA.name} (${playersA.length} players), ${teamB.name} (${playersB.length} players)`);
        console.log(`🏆 Tournament: ${tournament.name}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
};

seedData();
