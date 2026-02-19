const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('admin_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('admin_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
    }

    getUser() {
        try {
            const userStr = localStorage.getItem('admin_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    }

    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                this.clearToken();
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }

            // Check if response has content before parsing JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response (Status:', response.status, '):', text);
                throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Đã có lỗi xảy ra');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        this.setToken(data.accessToken);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.clearToken();
        }
    }

    // Dashboard
    getDashboard() {
        return this.request('/admin/dashboard');
    }

    // Stores
    getStores(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/stores?${query}`);
    }

    getStoreDetail(id) {
        return this.request(`/admin/stores/${id}`);
    }

    createStore(data) {
        return this.request('/admin/stores', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    updateStore(id, data) {
        return this.request(`/admin/stores/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    suspendStore(id, reason) {
        return this.request(`/admin/stores/${id}/suspend`, {
            method: 'PATCH',
            body: JSON.stringify({ reason }),
        });
    }

    activateStore(id) {
        return this.request(`/admin/stores/${id}/activate`, {
            method: 'PATCH',
        });
    }

    subscribeStore(id, planId, paymentMethod) {
        return this.request(`/admin/stores/${id}/subscribe`, {
            method: 'POST',
            body: JSON.stringify({ planId, paymentMethod }),
        });
    }

    extendStore(id, days) {
        return this.request(`/admin/stores/${id}/extend`, {
            method: 'PATCH',
            body: JSON.stringify({ days }),
        });
    }

    resetStorePassword(id, newPassword) {
        return this.request(`/admin/stores/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword })
        });
    }

    getStoreLoginToken(id) {
        return this.request(`/admin/stores/${id}/token`, {
            method: 'GET'
        });
    }

    // Plans
    getPlans() {
        return this.request('/admin/plans');
    }

    createPlan(data) {
        return this.request('/admin/plans', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    updatePlan(id, data) {
        return this.request(`/admin/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    deletePlan(id) {
        return this.request(`/admin/plans/${id}`, {
            method: 'DELETE',
        });
    }

    // Products
    getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/products?${query}`);
    }

    deleteProduct(id) {
        return this.request(`/admin/products/${id}`, {
            method: 'DELETE',
        });
    }

    importProducts(file) {
        const formData = new FormData();
        formData.append('file', file);

        // request method handles JSON by default, need to handle FormData
        return fetch(`${API_BASE}/admin/products/import`, {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/json'
            },
        }).then(async res => {
            if (res.status === 401) {
                this.clearToken();
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Lỗi nhập dữ liệu');
            return data;
        });
    }

    // Payments
    getPayments(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/payments?${query}`);
    }

    getStorePayments(storeId) {
        return this.request(`/admin/stores/${storeId}/payments`);
    }

    // System
    getSystemLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/system/logs?${query}`);
    }

    // Utilities
    getAnnouncements() {
        return this.request('/admin/announcements');
    }

    createAnnouncement(data) {
        return this.request('/admin/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // System Settings
    getSystemSettings() {
        return this.request('/admin/settings');
    }

    updateSystemSetting(data) {
        return this.request('/admin/settings', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Support Tickets
    getTickets() {
        return this.request('/admin/tickets');
    }

    getTicketDetail(id) {
        return this.request(`/admin/tickets/${id}`);
    }

    addTicketMessage(id, content) {
        return this.request(`/admin/tickets/${id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    updateTicketStatus(id, status) {
        return this.request(`/admin/tickets/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
}

const api = new ApiService();
export default api;
