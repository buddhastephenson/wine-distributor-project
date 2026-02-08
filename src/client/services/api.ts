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

export const authApi = {
    login: (credentials: any) => api.post<IAuthResponse>('/auth/login', credentials),
    signup: (data: any) => api.post<IAuthResponse>('/auth/signup', data),
    forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

export const productApi = {
    getAll: () => api.get<IProduct[]>('/products'),
    update: (id: string, updates: Partial<IProduct>) => api.patch<{ success: boolean; product: IProduct }>(`/products/${id}`, updates),
    delete: (id: string) => api.delete<{ success: boolean }>(`/products/${id}`),
};

export const specialOrderApi = {
    getAll: (username?: string) => api.get<ISpecialOrder[]>('/special-orders', { params: { username } }),
    create: (data: Partial<ISpecialOrder>) => api.post<{ success: boolean; order: ISpecialOrder }>('/special-orders', data),
    update: (id: string, updates: Partial<ISpecialOrder>) => api.patch<{ success: boolean; order: ISpecialOrder }>(`/special-orders/${id}`, updates),
    delete: (id: string) => api.delete<{ success: boolean }>(`/special-orders/${id}`),
};

export const userApi = {
    getAll: () => api.get<IUser[]>('/auth/users'),
    toggleAccess: (id: string, accessRevoked: boolean) => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/access`, { accessRevoked }),
    updateRole: (id: string, type: 'admin' | 'customer') => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/role`, { type }),
    updateUsername: (id: string, username: string) => api.patch<{ success: boolean; user: IUser }>(`/auth/users/${id}/username`, { username }),
    updatePassword: (id: string, password: string) => api.patch<{ success: boolean; message: string }>(`/auth/users/${id}/password`, { password }),
    delete: (id: string) => api.delete<{ success: boolean }>(`/auth/users/${id}`),
};

export default api;
