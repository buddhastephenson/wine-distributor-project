import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IAuthResponse, IUser, IProduct, ISpecialOrder } from '../../shared/types';

const API_URL = '/api'; // Use relative path to leverage proxy

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error) => {
        // Handle global errors like 401 Unauthorized or 403 Forbidden
        if (error.response && error.response.status === 401) {
            // Check if we have a logout function in store and call it?
            // For now, just reject
        }
        return Promise.reject(error);
    }
);

// Request interceptor to attach User ID (Simple Auth)
api.interceptors.request.use((config) => {
    // Dynamically import store to avoid circular dependencies if any, 
    // or just access the global store we know exists.
    // We need to require it or import it at top user if possible, but let's try lazy access if needed?
    // Actually, importing useAuthStore at top level is fine in most cases.

    // We need to import useAuthStore at the top of the file first to use it here.
    // But wait, the file doesn't import it yet. I need to add the import.
    const { useAuthStore } = require('../store/useAuthStore');
    const user = useAuthStore.getState().user;

    if (user && user.id) {
        config.headers['x-user-id'] = user.id;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const authApi = {
    login: (credentials: any) => api.post<IAuthResponse>('/auth/login', credentials),
    verify: () => api.get<IAuthResponse>('/auth/verify'),
    signup: (data: any) => api.post<IAuthResponse>('/auth/signup', data),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const productApi = {
    getAll: () => api.get<IProduct[]>('/products'),
    update: (id: string, updates: Partial<IProduct>) => api.patch<{ success: boolean; product: IProduct }>(`/products/${id}`, updates),
    delete: (id: string) => api.delete<{ success: boolean }>(`/products/${id}`),
    import: (products: any[], supplier: string) => api.post<{ success: boolean; stats: any }>('/products/import', { products, supplier }),
};

export const specialOrderApi = {
    getAll: (username?: string) => api.get<ISpecialOrder[]>('/special-orders', { params: { username } }),
    create: (data: Partial<ISpecialOrder>) => api.post<{ success: boolean; order: ISpecialOrder }>('/special-orders', data),
    update: (id: string, updates: Partial<ISpecialOrder>) => api.patch<{ success: boolean; order: ISpecialOrder }>(`/special-orders/${id}`, updates),
    delete: (id: string) => api.delete<{ success: boolean }>(`/special-orders/${id}`),
    batchUpdateStatus: (updates: { id: string, status: string }[]) => api.post<{ success: boolean }>('/special-orders/batch-status', updates),
};

export const userApi = {
    getAll: () => api.get<IUser[]>('/auth/users'),
    toggleAccess: (id: string, accessRevoked: boolean) => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/access`, { accessRevoked }),
    updateRole: (id: string, type: 'admin' | 'customer', vendors?: string[]) => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/role`, { type, vendors }),
    updateUsername: (id: string, username: string) => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/username`, { username }),
    updatePassword: (id: string, password: string) => api.patch<{ success: boolean; message: string }>(`/auth/users/${id}/password`, { password }),
    delete: (id: string) => api.delete<{ success: boolean }>(`/auth/users/${id}`),
    quickCreate: (username: string) => api.post<{ success: boolean; user: IUser }>('/auth/users/quick-create', { username }),
};

export const storageApi = {
    updateFormulas: (formulas: any) => api.post<{ success: boolean }>('/storage/wine-formulas', { value: JSON.stringify(formulas) }),
};

export default api;
