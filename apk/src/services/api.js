import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

// Create headers with auth token
const getHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
    };
};

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let logoutCallback = null;

export const registerLogoutCallback = (cb) => {
    logoutCallback = cb;
};

// Response interceptor to handle errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            if (logoutCallback) logoutCallback();
            return Promise.reject(new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'));
        }
        const message = error.response?.data?.error || error.message || 'Lỗi kết nối server';
        return Promise.reject(new Error(message));
    }
);

export const authService = {
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        if (response.accessToken) {
            await AsyncStorage.setItem('userToken', response.accessToken);
            await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        }
        return response;
    },
    register: async (data) => {
        const response = await api.post('/auth/register', data);
        if (response.accessToken) {
            await AsyncStorage.setItem('userToken', response.accessToken);
            await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        }
        return response;
    },
    logout: async () => {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
    },
    getMe: () => api.get('/auth/me'),
};

export const posService = {
    getProducts: (params) => api.get('/pos/products', { params }),
    getProductByBarcode: (barcode) => api.get(`/pos/products/${barcode}`),
    createProduct: (data) => api.post('/pos/products', data),
    updateProduct: (id, data) => api.put(`/pos/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/pos/products/${id}`),
    lookupGlobalBarcode: (barcode) => api.get(`/pos/products/lookup/${barcode}`),
    createOrder: (orderData) => api.post('/pos/orders', orderData),
    getOrders: (params) => api.get('/pos/orders', { params }),
    deleteOrder: (id) => api.delete(`/pos/orders/${id}`),
    searchCustomers: (query) => api.get('/pos/customers', { params: { query } }),
    createCustomer: (data) => api.post('/pos/customers', data),
    getDashboard: (period) => api.get('/pos/dashboard', { params: { period } }),
    getReport: (params) => api.get('/pos/reports', { params }),
    // Store
    getStore: () => api.get('/pos/store'),
    updateStore: (data) => api.put('/pos/store', data),
    // Logs
    getLogs: (params) => api.get('/pos/logs', { params }),
    // Users (Staff)
    getUsers: () => api.get('/pos/users'),
    createStoreUser: (data) => api.post('/pos/users', data),
    updateStoreUser: (id, data) => api.put(`/pos/users/${id}`, data),
    deleteStoreUser: (id) => api.delete(`/pos/users/${id}`),
    // Support Tickets
    getMyTickets: () => api.get('/pos/tickets'),
    createTicket: (data) => api.post('/pos/tickets', data),
    getTicketDetail: (id) => api.get(`/pos/tickets/${id}`),
    addTicketMessage: (id, content) => api.post(`/pos/tickets/${id}/messages`, { content }),
};

export default api;
