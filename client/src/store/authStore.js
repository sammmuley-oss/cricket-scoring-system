import { create } from 'zustand';
import { authAPI } from '../api';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const res = await authAPI.login({ email, password });
            const { user, token } = res.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, loading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', loading: false });
            return false;
        }
    },

    register: async (name, email, password, role) => {
        set({ loading: true, error: null });
        try {
            const res = await authAPI.register({ name, email, password, role });
            const { user, token } = res.data.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, loading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Registration failed', loading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
    },

    clearError: () => set({ error: null }),

    hasRole: (roles) => {
        const state = useAuthStore.getState();
        return state.user && roles.includes(state.user.role);
    },
}));

export default useAuthStore;
