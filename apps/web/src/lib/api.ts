
import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
});

// Request Interceptor: Pasang Token
api.interceptors.request.use((config) => {
    const session = localStorage.getItem('admin_session');
    if (session) {
        const { access_token } = JSON.parse(session);
        if (access_token) {
            config.headers.Authorization = `Bearer ${access_token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Cek 401 (Unauthorized)
api.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        // Kalau token expired atau gak valid, tendang ke login
        // localStorage.removeItem('admin_session'); // Optional: Hapus sesi
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default api;
