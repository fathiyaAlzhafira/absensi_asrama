import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('asrama_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('asrama_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('asrama_auth_user');
      localStorage.removeItem('asrama_token');
    }
  }, [user]);

  // Fungsi Login riil ke Backend CakePHP
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.login(credentials);
      if (response && response.status === 'success' && response.data) {
        const userData = response.data;
        setUser(userData);
        if (userData.token) {
          localStorage.setItem('asrama_token', userData.token);
        }
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Login gagal.');
      }
    } catch (error) {
      return { success: false, message: error.message || 'Koneksi gagal atau kredensial salah.' };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Logout
  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      setUser(null);
      localStorage.removeItem('asrama_auth_user');
      localStorage.removeItem('asrama_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || 'guest', login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
