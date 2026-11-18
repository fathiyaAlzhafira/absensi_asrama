import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('asrama_auth_user');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }

    return null;
  });

  // Loading true sampai sesi awal selesai diverifikasi.
  const [loading, setLoading] = useState(true);

  /**
   * Sinkronisasi informasi pengguna ke localStorage.
   */
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        'asrama_auth_user',
        JSON.stringify(user)
      );
    } else {
      localStorage.removeItem('asrama_auth_user');
      localStorage.removeItem('asrama_token');
    }
    window.dispatchEvent(new CustomEvent('asrama-auth-changed', { detail: user }));
  }, [user]);

  /**
   * Verifikasi sesi ketika aplikasi pertama kali dibuka atau akun berganti.
   */
  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const token = user?.token || localStorage.getItem('asrama_token');

      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.getProfile();

        if (response?.status === 'success' && response.data) {
          if (active) {
            setUser((prev) => ({
              ...(prev || {}),
              ...response.data,
              kamar: response.data.nomor_kamar ?? null,
              token,
            }));
          }
        } else {
          throw new Error('Sesi tidak valid.');
        }
      } catch {
        if (active && !user) {
          setUser(null);
          localStorage.removeItem('asrama_token');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [user?.id, user?.token]);

  /**
   * Mendengarkan pemberitahuan token tidak valid dari api.js.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(
      'asrama:unauthorized',
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        'asrama:unauthorized',
        handleUnauthorized
      );
    };
  }, []);

  /**
   * Login ke backend.
   * Tidak mengubah global `loading` agar halaman Login tidak ter-unmount
   * oleh PublicRoute ketika kredensial salah dan pesan error tetap tampil.
   */
  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);

      if (
        response &&
        response.status === 'success' &&
        response.data &&
        response.data.token
      ) {
        const userData = response.data;

        localStorage.setItem(
          'asrama_token',
          userData.token
        );

        setUser(userData);

        return {
          success: true,
          user: userData,
        };
      }

      throw new Error(
        response?.message || 'Login gagal.'
      );
    } catch (error) {
      return {
        success: false,
        message:
          error.message ||
          'Email/NIM atau password salah. Periksa kembali keduanya.',
      };
    }
  };

  /**
   * Logout dari backend dan frontend.
   */
  const logout = async () => {
    try {
      if (localStorage.getItem('asrama_token')) {
        await api.logout();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);

      localStorage.removeItem('asrama_auth_user');
      localStorage.removeItem('asrama_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'guest',
        login,
        logout,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
