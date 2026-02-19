import axios from 'axios';

// Create axios instance with base URL (proxied by Vite)
const api = axios.create({
    baseURL: '/api', // Vite proxy will send this to http://localhost:3001
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('pos_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response.data, // Return only data part
    (error) => {
        if (error.response?.status === 401) {
            // Auto logout if token expired
            localStorage.removeItem('pos_token');
            localStorage.removeItem('pos_user');
            window.location.href = '/login';
        }
        const message = error.response?.data?.error || error.message || 'Lỗi kết nối server';
        return Promise.reject(new Error(message));
    }
);

export const authService = {
    login: async (username, password) => {
        // API endpoint: /auth/login (Backend)
        const response = await api.post('/auth/login', { username, password });
        if (response.accessToken) {
            localStorage.setItem('pos_token', response.accessToken);
            localStorage.setItem('pos_user', JSON.stringify(response.user));
        }
        return response;
    },
    logout: () => {
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.href = '/login';
    },
    register: async (data) => {
        // API endpoint: /auth/register
        const response = await api.post('/auth/register', data);
        if (response.accessToken) {
            localStorage.setItem('pos_token', response.accessToken);
            localStorage.setItem('pos_user', JSON.stringify(response.user));
        }
        return response;
    }
};

export const posService = {
    getProducts: (params) => api.get('/pos/products', { params }),
    getProductByBarcode: (barcode) => api.get(`/pos/products/${barcode}`),
    createProduct: (data) => api.post('/pos/products', data), // Need backend endpoint
    updateProduct: (id, data) => api.put(`/pos/products/${id}`, data), // Need backend endpoint
    deleteProduct: (id) => api.delete(`/pos/products/${id}`), // Need backend endpoint

    createOrder: (orderData) => api.post('/pos/orders', orderData),
    getOrders: (params) => api.get('/pos/orders', { params }),
    getOrderDetails: (id) => api.get(`/pos/orders/${id}`), // Need backend endpoint

    searchCustomers: (query) => api.get('/pos/customers', { params: { query } }),
    createCustomer: (data) => api.post('/pos/customers', data),

    getDashboard: (period) => api.get('/pos/dashboard', { params: { period } }),
    getDebtors: (params) => api.get('/pos/debts', { params }), // Need backend endpoint
    getReport: (params) => api.get('/pos/reports', { params }), // Need backend endpoint

    // Store
    getStore: () => api.get('/pos/store'),
    updateStore: (data) => api.put('/pos/store', data),

    // Logs
    getLogs: (params) => api.get('/pos/logs', { params }),

    // Tax Report Signing
    signReport: (data) => api.post('/pos/reports/sign', data),

    // Announcements
    getLatestAnnouncement: () => api.get('/pos/announcements/latest'),

    // System Settings
    getSystemSettings: () => api.get('/pos/settings'),

    // Support Tickets
    getMyTickets: () => api.get('/pos/tickets'),
    createTicket: (data) => api.post('/pos/tickets', data),
    getTicketDetail: (id) => api.get(`/pos/tickets/${id}`),
    addTicketMessage: (id, content) => api.post(`/pos/tickets/${id}/messages`, { content }),
};

export default api;
