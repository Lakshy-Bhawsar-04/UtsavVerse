/**
 * src/services/api.js
 * Central Axios HTTP client with automatic JWT Bearer token attachment.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  if (url.startsWith('/uploads/') && /^https?:\/\//i.test(API_BASE_URL)) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${backendOrigin}${url}`;
  }
  return url;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (
        currentPath.startsWith('/dashboard') ||
        currentPath.startsWith('/organizer') ||
        currentPath.startsWith('/admin')
      ) {
        localStorage.removeItem('eventora_token');
        localStorage.removeItem('eventora_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;