/**
 * src/services/api.js
 * Central Axios HTTP client with automatic JWT Bearer token attachment.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('UtsavVerse_token');
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
        localStorage.removeItem('UtsavVerse_token');
        localStorage.removeItem('UtsavVerse_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
