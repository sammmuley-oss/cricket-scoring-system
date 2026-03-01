import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Add auth token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle response errors
API.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    login: (data) => API.post('/auth/login', data),
    register: (data) => API.post('/auth/register', data),
    getMe: () => API.get('/auth/me'),
};

// Teams
export const teamsAPI = {
    getAll: () => API.get('/teams'),
    getById: (id) => API.get(`/teams/${id}`),
    create: (data) => API.post('/teams', data),
    update: (id, data) => API.put(`/teams/${id}`, data),
    delete: (id) => API.delete(`/teams/${id}`),
    addPlayer: (id, playerId) => API.post(`/teams/${id}/players`, { playerId }),
};

// Players
export const playersAPI = {
    getAll: (params) => API.get('/players', { params }),
    getById: (id) => API.get(`/players/${id}`),
    create: (data) => API.post('/players', data),
    update: (id, data) => API.put(`/players/${id}`, data),
    delete: (id) => API.delete(`/players/${id}`),
};

// Tournaments
export const tournamentsAPI = {
    getAll: (params) => API.get('/tournaments', { params }),
    getById: (id) => API.get(`/tournaments/${id}`),
    create: (data) => API.post('/tournaments', data),
    update: (id, data) => API.put(`/tournaments/${id}`, data),
    delete: (id) => API.delete(`/tournaments/${id}`),
    addTeam: (id, teamId) => API.post(`/tournaments/${id}/teams`, { teamId }),
    getPointsTable: (id) => API.get(`/tournaments/${id}/points-table`),
};

// Matches
export const matchesAPI = {
    getAll: (params) => API.get('/matches', { params }),
    getById: (id) => API.get(`/matches/${id}`),
    create: (data) => API.post('/matches', data),
    update: (id, data) => API.put(`/matches/${id}`, data),
    delete: (id) => API.delete(`/matches/${id}`),
    setToss: (id, data) => API.post(`/matches/${id}/toss`, data),
    start: (id, data) => API.post(`/matches/${id}/start`, data),
    getLive: () => API.get('/matches/live'),
};

// Scoring
export const scoringAPI = {
    recordBall: (matchId, data) => API.post(`/scoring/${matchId}/ball`, data),
    undoLastBall: (matchId) => API.post(`/scoring/${matchId}/undo`),
    startSecondInnings: (matchId, data) => API.post(`/scoring/${matchId}/second-innings`, data),
    endInnings: (matchId) => API.post(`/scoring/${matchId}/end-innings`),
};

export default API;
