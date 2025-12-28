
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
});

console.log("MOBILE API URL used:", API_URL); // <--- DEBUG LOG

// Request Interceptor: Pasang Token dari SecureStore
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Cek 401
api.interceptors.response.use((response) => response, async (error) => {
    if (error.response && error.response.status === 401) {
        // Token kadaluarsa atau tidak valid
        await SecureStore.deleteItemAsync('user_token');
        // Kita biarkan error ini propagate biar UI bisa handle (misal redirect ke Login)
    }
    return Promise.reject(error);
});

export default api;
