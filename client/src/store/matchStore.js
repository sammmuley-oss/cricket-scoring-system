import { create } from 'zustand';
import { matchesAPI, scoringAPI } from '../api';
import { io } from 'socket.io-client';

let socket = null;

const useMatchStore = create((set, get) => ({
    currentMatch: null,
    matches: [],
    liveMatches: [],
    loading: false,
    error: null,

    // Fetch all matches
    fetchMatches: async (params) => {
        set({ loading: true });
        try {
            const res = await matchesAPI.getAll(params);
            set({ matches: res.data.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Fetch single match
    fetchMatch: async (id) => {
        set({ loading: true });
        try {
            const res = await matchesAPI.getById(id);
            set({ currentMatch: res.data.data, loading: false });
            return res.data.data;
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Fetch live matches
    fetchLiveMatches: async () => {
        try {
            const res = await matchesAPI.getLive();
            set({ liveMatches: res.data.data });
        } catch (error) {
            console.error('Failed to fetch live matches:', error);
        }
    },

    // Record a ball
    recordBall: async (matchId, ballData) => {
        try {
            const res = await scoringAPI.recordBall(matchId, ballData);
            set({ currentMatch: res.data.data });
            return res.data.data;
        } catch (error) {
            set({ error: error.response?.data?.message || error.message });
            throw error;
        }
    },

    // Undo last ball
    undoLastBall: async (matchId) => {
        try {
            const res = await scoringAPI.undoLastBall(matchId);
            set({ currentMatch: res.data.data });
        } catch (error) {
            set({ error: error.message });
        }
    },

    // Start second innings
    startSecondInnings: async (matchId, data) => {
        try {
            const res = await scoringAPI.startSecondInnings(matchId, data);
            set({ currentMatch: res.data.data });
        } catch (error) {
            set({ error: error.message });
        }
    },

    // Connect to live match via Socket.io
    connectToMatch: (matchId) => {
        if (socket) socket.disconnect();
        socket = io(window.location.origin, { transports: ['websocket', 'polling'] });

        socket.on('connect', () => {
            console.log('Socket connected');
            socket.emit('join-match', matchId);
        });

        socket.on('score-update', (match) => {
            set({ currentMatch: match });
        });

        socket.on('ball-scored', (data) => {
            // Additional handling for ball animations etc.
            console.log('Ball scored:', data);
        });

        socket.on('match-completed', (match) => {
            set({ currentMatch: match });
        });

        socket.on('innings-change', (match) => {
            set({ currentMatch: match });
        });
    },

    // Disconnect from live match
    disconnectFromMatch: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    clearMatch: () => set({ currentMatch: null }),
    clearError: () => set({ error: null }),
}));

export default useMatchStore;
