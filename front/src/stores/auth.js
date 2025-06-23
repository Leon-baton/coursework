import { defineStore } from 'pinia';
import router from '../router';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || null,
        user: JSON.parse(localStorage.getItem('user')) || null,
        isAuthenticated: !!localStorage.getItem('accessToken'),
    }),
    actions: {
        async login(loginIdentifier, password) {
            try {
                const response = await api.post('/auth/login', { login: loginIdentifier, password });
                this.accessToken = response.data.accessToken;
                this.isAuthenticated = true;

                localStorage.setItem('accessToken', this.accessToken);
                localStorage.setItem('user', JSON.stringify(this.user));

                console.log('Logged in successfully, token:', this.accessToken);
            } catch (error) {
                this.logout();
                console.error('Login failed:', error.response?.data?.message || error.message);
                throw new Error(error.response?.data?.message || 'Неверные данные для входа');
            }
        },
        async refreshToken() {
            try {
                console.log('Attempting to refresh token...');
                const response = await api.post('/auth/refresh');
                this.accessToken = response.data.accessToken;
                localStorage.setItem('accessToken', this.accessToken);
                this.isAuthenticated = true;
                console.log('Token refreshed successfully!');
            } catch (error) {
                console.error('Refresh token failed:', error.response?.data?.message || error.message);
                this.logout();
                throw error;
            }
        },
        logout() {
            this.accessToken = null;
            this.user = null;
            this.isAuthenticated = false;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            console.log('Logged out.');
            router.push('/login');
        },
    },
});
