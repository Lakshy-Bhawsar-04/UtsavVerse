/**
 * src/context/AuthContext.jsx
 * Manages JWT authentication state, current user profile, login, registration, and logout.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('UtsavVerse_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('UtsavVerse_token') || null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('UtsavVerse_token')));

  const persistSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('UtsavVerse_token', newToken);
    localStorage.setItem('UtsavVerse_user', JSON.stringify(newUser));
  };

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('UtsavVerse_token');
    localStorage.removeItem('UtsavVerse_user');
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = localStorage.getItem('UtsavVerse_token');
    if (!activeToken) {
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('UtsavVerse_user', JSON.stringify(data.user));
        return data.user;
      }
      clearSession();
      return null;
    } catch {
      clearSession();
      return null;
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    if (data.success && data.token) {
      persistSession(data.token, data.user);
    }
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    if (data.success && data.token) {
      persistSession(data.token, data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network failure on logout
    } finally {
      clearSession();
    }
  };

  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('UtsavVerse_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
