import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; username: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { username?: string; avatar?: string }) =>
    api.patch('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
  getResignHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/users/resign-history', { params }),
  startBillingCheckout: (data: { plan?: 'pro' | 'enterprise' }) =>
    api.post('/users/billing/checkout', data),
  verifySubscription: () => api.get('/users/subscription/verify'),
};

// Certificate API
export const certificateApi = {
  list: () => api.get('/certificates'),
  listPublic: () => api.get('/certificates/public'),
  upload: (formData: FormData) =>
    api.post('/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  get: (id: string) => api.get(`/certificates/${id}`),
  update: (id: string, data: Partial<{ teamName: string; teamId: string; bundleId: string; isPublic: boolean }>) =>
    api.patch(`/certificates/${id}`, data),
  delete: (id: string) => api.delete(`/certificates/${id}`),
};

// Resign API
export const resignApi = {
  submit: (formData: FormData) =>
    api.post('/resign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: { page?: number; limit?: number }) =>
    api.get('/resign', { params }),
  get: (id: string, accessToken?: string) =>
    api.get(`/resign/${id}`, { params: accessToken ? { accessToken } : undefined }),
  download: (id: string, accessToken?: string) =>
    api.get(`/resign/download/${id}`, {
      responseType: 'blob',
      params: accessToken ? { accessToken } : undefined,
    }),
};

// Repository API
export const repositoryApi = {
  list: () => api.get('/repositories'),
  add: (data: { url: string; name: string; description?: string }) =>
    api.post('/repositories', data),
  getApps: (id: string) => api.get(`/repositories/${id}/apps`),
  delete: (id: string) => api.delete(`/repositories/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  listUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  updateUser: (id: string, data: Partial<{ isAdmin: boolean; isBanned: boolean; isSubscribed: boolean; storageQuota: number; password: string }>) =>
    api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  listCertificates: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/certificates', { params }),
  getLogs: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/logs', { params }),
};
