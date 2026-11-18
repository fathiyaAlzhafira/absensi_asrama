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
    window.dispatchEvent(new CustomEvent('asrama-auth-changed', { detail: user }));
  }, [user]);

  // Sinkronkan data profil terbaru (gedung, kamar, kontak) dari backend saat aplikasi dibuka atau saat akun berganti
  useEffect(() => {
    const token = user?.token || localStorage.getItem('asrama_token');
    if (!token) return undefined;
    let active = true;
    api.getProfile()
      .then((res) => {
        if (!active || res?.status !== 'success' || !res.data) return;
        setUser((prev) => {
          if (!prev) return { ...res.data, token };
          const next = {
            ...prev,
            ...res.data,
            kamar: res.data.nomor_kamar ?? null
          };
          const unchanged =
            prev.nama === next.nama &&
            prev.email === next.email &&
            prev.nim === next.nim &&
            prev.no_hp === next.no_hp &&
            prev.asal === next.asal &&
            prev.kamar_id === next.kamar_id &&
            prev.nomor_kamar === next.nomor_kamar &&
            prev.kamar === next.kamar &&
            prev.gedung === next.gedung;
          return unchanged ? prev : next;
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, user?.token]);

  // Fungsi Login riil ke Backend CakePHP
  const login = async (credentials) => {
    setLoading(true);
    try {
      const response = await api.login(credentials);
      if (response && response.status === 'success' && response.data) {
        const userData = response.data;
        if (userData.token) {
          localStorage.setItem('asrama_token', userData.token);
        }
        setUser(userData);
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
