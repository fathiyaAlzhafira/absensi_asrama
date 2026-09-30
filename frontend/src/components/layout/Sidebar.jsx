import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import {
  Home,
  Camera,
  History,
  FileText,
  CheckSquare,
  Users,
  Building,
  Settings,
  LogOut,
  UserCheck,
  DoorOpen,
  ChevronLeft,
  Menu
} from 'lucide-react';
import Badge from '../common/Badge';

export default function Sidebar() {
  const { user, role, logout } = useAuth();
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  // Menu Penghuni
  const penghuniMenu = [
    { label: 'Dashboard', path: '/penghuni/dashboard', icon: Home },
    { label: 'Presensi Kamera & GPS', path: '/penghuni/presensi', icon: Camera },
    { label: 'Riwayat Presensi', path: '/penghuni/riwayat', icon: History },
    { label: 'Ajukan Izin', path: '/penghuni/izin/tambah', icon: FileText },
    { label: 'Status Izin Saya', path: '/penghuni/izin', icon: CheckSquare },
  ];

  // Menu Fasilitator (Fasil)
  const fasilMenu = [
    { label: 'Dashboard Fasil', path: '/fasil/dashboard', icon: Home },
    { label: 'Monitoring Presensi', path: '/fasil/presensi', icon: UserCheck },
    { label: 'Verifikasi Izin', path: '/fasil/izin', icon: CheckSquare },
    { label: 'Data Penghuni Gedung', path: '/fasil/penghuni', icon: Users },
    { label: 'Laporan Gedung', path: '/fasil/laporan', icon: FileText },
  ];

  // Menu Admin
  const adminMenu = [
    { label: 'Dashboard Admin', path: '/admin/dashboard', icon: Home },
    { label: 'Kelola Pengguna', path: '/admin/users', icon: Users },
    { label: 'Kelola Gedung', path: '/admin/gedungs', icon: Building },
    { label: 'Kelola Kamar', path: '/admin/kamars', icon: DoorOpen },
    { label: 'Pengaturan Presensi', path: '/admin/pengaturan', icon: Settings },
    { label: 'Laporan Global', path: '/admin/laporan', icon: FileText },
  ];

  let currentMenu = [];
  if (role === 'penghuni') currentMenu = penghuniMenu;
  else if (role === 'fasil') currentMenu = fasilMenu;
  else if (role === 'admin') currentMenu = adminMenu;
  else currentMenu = penghuniMenu;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      style={{
        width: isOpen ? '240px' : '72px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isOpen ? '24px 16px' : '20px 10px',
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
    >
      <div>
        {/* Header Bagian Atas: Toggle & Brand */}
        {isOpen ? (
          /* Tampilan Saat Sidebar TERBUKA */
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/assets/TB.png"
                alt="Logo Universitas Andalas"
                style={{
                  width: '38px',
                  height: '38px',
                  minWidth: '38px',
                  minHeight: '38px',
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
              <div style={{ overflow: 'hidden' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                  ASRAMA UNAND
                </h2>
                <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: '700', letterSpacing: '0.05em' }}>
                  GREEN DECK
                </span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              title="Tutup Sidebar"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-neutral)',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all var(--transition-fast)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          /* Tampilan Saat Sidebar DITUTUP */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '24px',
            width: '100%'
          }}>
            <button
              onClick={toggleSidebar}
              title="Buka Sidebar"
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-neutral)',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Menu size={18} />
            </button>

            <img
              src="/assets/TB.png"
              alt="Logo Universitas Andalas"
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                minHeight: '38px',
                objectFit: 'contain',
                flexShrink: 0
              }}
            />
          </div>
        )}

        {/* User Info Card (Kata 'ROLE' dihilangkan) */}
        {isOpen && user && (
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user.nama}
            </div>
            <Badge variant={role === 'admin' ? 'error' : role === 'fasil' ? 'warning' : 'success'} size="sm">
              {role}
            </Badge>
          </div>
        )}

        {/* Navigation Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {isOpen && (
            <span style={{
              fontSize: '11px',
              color: 'var(--color-neutral)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: '700',
              paddingLeft: '8px',
              marginBottom: '4px'
            }}>
              Menu
            </span>
          )}
          {currentMenu.map((item, idx) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={idx}
                to={item.path}
                title={!isOpen ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  gap: '12px',
                  padding: isOpen ? '10px 14px' : '12px 0',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-neutral)',
                  backgroundColor: isActive ? 'var(--color-surface-l2)' : 'transparent',
                  borderLeft: isOpen && isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  transition: 'all var(--transition-fast)'
                })}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {isOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Tombol Keluar (Logout) di Bagian Bawah Sidebar */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          title={!isOpen ? 'Keluar' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isOpen ? 'flex-start' : 'center',
            gap: '10px',
            width: '100%',
            padding: isOpen ? '10px 12px' : '10px 0',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-neutral)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-error)';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-neutral)';
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {isOpen && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
