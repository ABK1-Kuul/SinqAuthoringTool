import axios from 'axios';

const client = axios.create({
  baseURL: '',
  timeout: 15000,
});

// Auto-inject token or handle errors
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Session expired, trigger redirect to login state in UI
      if (window.onSessionExpired) {
        window.onSessionExpired();
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const api = {
  login: (email, password) => client.post('/api/login', { email, password }),
  logout: () => client.post('/api/logout'),
  getCurrentUser: () => client.get('/api/user/me').catch(() => null),
  
  // Content schemas
  getSchemas: () => client.get('/api/content/schema'),
  
  // Content objects CRUD
  getContent: (type, query = {}) => client.get(`/api/content/${type}`, { params: query }),
  createContent: (type, data) => client.post(`/api/content/${type}`, data),
  updateContent: (type, id, data) => client.put(`/api/content/${id}`, data),
  deleteContent: (type, id) => client.delete(`/api/content/${id}`),

  // Course Preview
  previewCourse: (id) => client.post(`/api/preview/${id}`),
  
  // Plugins management
  getPlugins: () => client.get('/api/plugin'),
  installPlugin: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/api/plugin/install', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Tenants management (Admin)
  getTenants: () => client.get('/api/tenant'),
  createTenant: (data) => client.post('/api/tenant', data),
  
  // Users management (Admin)
  getUsers: () => client.get('/api/user'),
  createUser: (data) => client.post('/api/user', data),
  updateUser: (id, data) => client.put(`/api/user/${id}`, data),
};
