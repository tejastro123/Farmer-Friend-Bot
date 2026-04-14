import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => {
        const formData = new FormData();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);
        return api.post('/auth/login', formData);
    },
    getMe: () => api.get('/auth/me'),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const chatService = {
    sendMessage: (chatData) => api.post('/chat', chatData),
    getSessions: () => api.get('/sessions'),
    getSessionMessages: (sessionId) => api.get(`/sessions/${sessionId}/messages`),
    renameSession: (sessionId, title) => api.patch(`/sessions/${sessionId}`, { title }),
    deleteSession: (sessionId) => api.delete(`/sessions/${sessionId}`),
    submitFeedback: (messageId, feedback) => api.post(`/message/${messageId}/feedback`, feedback),
};

export const ingestService = {
    ingest: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/ingest', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getMetadata: () => api.get('/ingest/metadata'), // Assuming backend supports metadata
};

export const mandiService = {
    getSummary: (lat, lon) => {
        const params = {};
        if (lat) params.lat = lat;
        if (lon) params.lon = lon;
        return api.get('/mandi/summary', { params });
    },
    getDeal: (id) => api.get(`/mandi/deal/${id}`),
    getHistory: () => api.get('/mandi/analytics'),
};

export default api;
