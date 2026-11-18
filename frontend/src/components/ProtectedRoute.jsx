import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Mendapatkan URL dashboard utama sesuai dengan role akun.
 */
export function getDashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'fasil') return '/fasil/dashboard';
  if (role === 'penghuni') return '/penghuni/dashboard';
  return '/login';
}

/**
 * Tampilan indikator saat sesi autentikasi sedang diverifikasi.
 */
export function SessionLoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text-primary)',
      gap: '16px',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--color-surface-l2)',
        borderTop: '3px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'asramaSpin 0.8s linear infinite'
      }} />
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', letterSpacing: '0.02em' }}>
        Memeriksa sesi login...
      </div>
      <style>{`
        @keyframes asramaSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * ProtectedRoute: Membatasi akses halaman berdasarkan status login dan role.
 * - Jika sesi sedang diverifikasi (loading), tampilkan SessionLoadingScreen.
 * - Jika belum login, arahkan ke /login.
 * - Jika role tidak sesuai, arahkan ke dashboard role yang bersangkutan.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SessionLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children ? children : <Outlet />;
}

/**
 * PublicRoute: Hanya dapat diakses saat belum login (misal /login).
 * Jika pengguna sudah login, langsung diarahkan ke dashboard role miliknya.
 */
export function PublicRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <SessionLoadingScreen />;
  }

  if (user) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children ? children : <Outlet />;
}
