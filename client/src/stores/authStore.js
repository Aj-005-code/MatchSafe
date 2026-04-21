import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isAuthenticated: !!localStorage.getItem('token'),

    login: ({ token, refreshToken, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        set({ token, refreshToken, user, isAuthenticated: true });
    },

    updateToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false });
    },

    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
    },
}));

export default useAuthStore;
