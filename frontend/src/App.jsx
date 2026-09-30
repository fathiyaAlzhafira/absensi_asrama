import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';

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
  const { role } = useAuth();
  if (role === 'fasil') return <Navigate to="/fasil/dashboard" replace />;
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/penghuni/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            {/* Public / Auth */}
            <Route path="/login" element={<Login />} />

            {/* Main App Layout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/profil" element={<Profile />} />

              {/* Routes Penghuni */}
              <Route path="/penghuni/dashboard" element={<DashboardPenghuni />} />
              <Route path="/penghuni/presensi" element={<Presensi />} />
              <Route path="/penghuni/riwayat" element={<RiwayatPresensi />} />
              <Route path="/penghuni/izin" element={<StatusIzin />} />
              <Route path="/penghuni/izin/tambah" element={<PengajuanIzin />} />

              {/* Routes Fasil */}
              <Route path="/fasil/dashboard" element={<DashboardFasil />} />
              <Route path="/fasil/presensi" element={<MonitoringPresensi />} />
              <Route path="/fasil/izin" element={<VerifikasiIzin />} />
              <Route path="/fasil/penghuni" element={<DataPenghuni />} />
              <Route path="/fasil/laporan" element={<LaporanPresensi />} />

              {/* Routes Admin */}
              <Route path="/admin/dashboard" element={<DashboardAdmin />} />
              <Route path="/admin/users" element={<KelolaUser />} />
              <Route path="/admin/gedungs" element={<KelolaGedung />} />
              <Route path="/admin/kamars" element={<KelolaKamar />} />
              <Route path="/admin/pengaturan" element={<PengaturanPresensi />} />
              <Route path="/admin/laporan" element={<LaporanGlobal />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}
