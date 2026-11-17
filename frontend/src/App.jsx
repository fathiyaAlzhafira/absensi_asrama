import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';

// Protected Route Guard
import ProtectedRoute, {
  PublicRoute,
  SessionLoadingScreen,
  getDashboardPath,
} from './components/ProtectedRoute';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Profile from './pages/auth/Profile';

// Penghuni Pages
import DashboardPenghuni from './pages/penghuni/DashboardPenghuni';
import Presensi from './pages/penghuni/Presensi';
import RiwayatPresensi from './pages/penghuni/RiwayatPresensi';
import PengajuanIzin from './pages/penghuni/PengajuanIzin';
import StatusIzin from './pages/penghuni/StatusIzin';

// Fasil Pages
import DashboardFasil from './pages/fasil/DashboardFasil';
import MonitoringPresensi from './pages/fasil/MonitoringPresensi';
import VerifikasiIzin from './pages/fasil/VerifikasiIzin';
import DataPenghuni from './pages/fasil/DataPenghuni';
import LaporanPresensi from './pages/fasil/LaporanPresensi';

// Admin Pages
import DashboardAdmin from './pages/admin/DashboardAdmin';
import KelolaUser from './pages/admin/KelolaUser';
import KelolaGedung from './pages/admin/KelolaGedung';
import KelolaKamar from './pages/admin/KelolaKamar';
import PengaturanPresensi from './pages/admin/PengaturanPresensi';
import LaporanGlobal from './pages/admin/LaporanGlobal';

// Helper component for Root Redirect
function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <SessionLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPath(role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Public / Auth (Hanya jika belum login) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Root URL Redirect ke dashboard sesuai role atau login */}
            <Route path="/" element={<RootRedirect />} />

            {/* Main App Layout - Dilindungi ProtectedRoute (Harus sudah login) */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Profil dapat diakses oleh semua role yang sudah login */}
              <Route path="/profil" element={<Profile />} />

              {/* Routes Khusus Penghuni */}
              <Route element={<ProtectedRoute allowedRoles={['penghuni']} />}>
                <Route path="/penghuni/dashboard" element={<DashboardPenghuni />} />
                <Route path="/penghuni/presensi" element={<Presensi />} />
                <Route path="/penghuni/riwayat" element={<RiwayatPresensi />} />
                <Route path="/penghuni/izin" element={<StatusIzin />} />
                <Route path="/penghuni/izin/tambah" element={<PengajuanIzin />} />
              </Route>

              {/* Routes Khusus Fasilitator (Fasil) */}
              <Route element={<ProtectedRoute allowedRoles={['fasil']} />}>
                <Route path="/fasil/dashboard" element={<DashboardFasil />} />
                <Route path="/fasil/presensi" element={<MonitoringPresensi />} />
                <Route path="/fasil/izin" element={<VerifikasiIzin />} />
                <Route path="/fasil/penghuni" element={<DataPenghuni />} />
                <Route path="/fasil/laporan" element={<LaporanPresensi />} />
              </Route>

              {/* Routes Khusus Admin */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<DashboardAdmin />} />
                <Route path="/admin/users" element={<KelolaUser />} />
                <Route path="/admin/gedungs" element={<KelolaGedung />} />
                <Route path="/admin/kamars" element={<KelolaKamar />} />
                <Route path="/admin/pengaturan" element={<PengaturanPresensi />} />
                <Route path="/admin/laporan" element={<LaporanGlobal />} />
              </Route>
            </Route>

            {/* Catch-all redirect ke root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}
