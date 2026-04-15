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

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => {
        const params = new URLSearchParams();
        params.append('username', credentials.email);
        params.append('password', credentials.password);
        return api.post('/auth/login', params);
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
    getAllDeals: () => api.get('/mandi/deals'),
    getHistory: () => api.get('/mandi/analytics'),
    createListing: (data) => api.post('/mandi/listing', data),
    initiateTrade: (data) => api.post('/mandi/trade', data),
    confirmTrade: (dealId) => api.post(`/mandi/trade/${dealId}/confirm`),
    updateTrade: (dealId, data) => api.put(`/mandi/trade/${dealId}`, data),
    recordPayment: (dealId, paymentMethod) => api.post(`/mandi/trade/${dealId}/payment`, { payment_method: paymentMethod }),
    completeTrade: (dealId) => api.post(`/mandi/trade/${dealId}/complete`),
};

export const graphService = {
    getGraph: () => api.get('/graph'),
};

export const pipelineService = {
    getPipelines: () => api.get('/pipelines'),
    runPipeline: (id) => api.post(`/pipelines/${id}/run`),
};

export const predictionService = {
    predictYield: (data) => api.post('/predict/yield', data),
    predictPest: (data) => api.post('/predict/pest', data),
    predictIrrigation: (data) => api.post('/predict/irrigation', data),
};

export const moatService = {
    getStats: () => api.get('/moat/stats'),
    exportDataset: () => api.get('/moat/export', { responseType: 'blob' }),
};

export const farmService = {
    // Crop Management
    getCropCycles: () => api.get('/farm/crop-cycles'),
    addCropCycle: (data) => api.post('/farm/crop-cycles', data),
    updateCropCycle: (id, data) => api.put(`/farm/crop-cycles/${id}`, data),
    deleteCropCycle: (id) => api.delete(`/farm/crop-cycles/${id}`),
    getYieldRecords: () => api.get('/farm/yield-records'),
    addYieldRecord: (data) => api.post('/farm/yield-records', data),
    getInputUsage: () => api.get('/farm/input-usage'),
    addInputUsage: (data) => api.post('/farm/input-usage', data),
    getEquipment: () => api.get('/farm/equipment'),
    addEquipment: (data) => api.post('/farm/equipment', data),
    updateEquipment: (id, data) => api.put(`/farm/equipment/${id}`, data),
    deleteEquipment: (id) => api.delete(`/farm/equipment/${id}`),
    
    // Weather
    getWeatherHistory: (limit) => api.get(`/farm/weather?limit=${limit || 30}`),
    addWeatherRecord: (data) => api.post('/farm/weather', data),
    updateWeatherRecord: (id, data) => api.put(`/farm/weather/${id}`, data),
    deleteWeatherRecord: (id) => api.delete(`/farm/weather/${id}`),
    getWeatherAlerts: () => api.get('/farm/weather/alerts'),
    addWeatherAlert: (data) => api.post('/farm/weather/alerts', data),
    
    // Finance
    getExpenses: (category) => api.get(category ? `/farm/expenses?category=${category}` : '/farm/expenses'),
    addExpense: (data) => api.post('/farm/expenses', data),
    updateExpense: (id, data) => api.put(`/farm/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/farm/expenses/${id}`),
    getTransactions: () => api.get('/farm/transactions'),
    addTransaction: (data) => api.post('/farm/transactions', data),
    updateTransaction: (id, data) => api.put(`/farm/transactions/${id}`, data),
    deleteTransaction: (id) => api.delete(`/farm/transactions/${id}`),
    getLoans: () => api.get('/farm/loans'),
    addLoan: (data) => api.post('/farm/loans', data),
    updateLoan: (id, data) => api.put(`/farm/loans/${id}`, data),
    deleteLoan: (id) => api.delete(`/farm/loans/${id}`),
    getInsurance: () => api.get('/farm/insurance'),
    addInsurance: (data) => api.post('/farm/insurance', data),
    updateInsurance: (id, data) => api.put(`/farm/insurance/${id}`, data),
    deleteInsurance: (id) => api.delete(`/farm/insurance/${id}`),
    
    // Inventory
    getSeedInventory: () => api.get('/farm/seeds'),
    addSeedInventory: (data) => api.post('/farm/seeds', data),
    updateSeedInventory: (id, data) => api.put(`/farm/seeds/${id}`, data),
    deleteSeedInventory: (id) => api.delete(`/farm/seeds/${id}`),
    getAgrochemicalStock: () => api.get('/farm/agrochemicals'),
    addAgrochemicalStock: (data) => api.post('/farm/agrochemicals', data),
    
    // Advisory
    getAdvisory: () => api.get('/farm/advisory'),
    addAdvisory: (data) => api.post('/farm/advisory', data),
    updateAdvisory: (id, data) => api.put(`/farm/advisory/${id}`, data),
    
    // Schemes
    getSchemeApplications: () => api.get('/farm/schemes'),
    addSchemeApplication: (data) => api.post('/farm/schemes', data),
    updateScheme: (id, data) => api.put(`/farm/schemes/${id}`, data),
    
    // Soil
    getSoilTests: () => api.get('/farm/soil-tests'),
    addSoilTest: (data) => api.post('/farm/soil-tests', data),
    updateSoilTest: (id, data) => api.put(`/farm/soil-tests/${id}`, data),
    deleteSoilTest: (id) => api.delete(`/farm/soil-tests/${id}`),
    getLatestSoil: () => api.get('/farm/soil-health/latest'),
    
    // Dashboard
    getDashboardSummary: () => api.get('/farm/dashboard-summary'),
    syncWeather: () => api.post('/farm/sync-weather'),
};

export default api;
