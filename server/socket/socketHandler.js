/**
 * Socket.io event handlers for real-time match updates
 */
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Join a match room for live updates
        socket.on('join-match', (matchId) => {
            socket.join(`match-${matchId}`);
            console.log(`Client ${socket.id} joined match: ${matchId}`);
        });

        // Leave a match room
        socket.on('leave-match', (matchId) => {
            socket.leave(`match-${matchId}`);
            console.log(`Client ${socket.id} left match: ${matchId}`);
        });

        // Join tournament room
        socket.on('join-tournament', (tournamentId) => {
            socket.join(`tournament-${tournamentId}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

module.exports = setupSocketHandlers;
