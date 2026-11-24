import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  UserRound,
  ChevronDown,
  Sun,
  LockKeyhole,
  CircleHelp,
  LogOut
} from 'lucide-react';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="topbar-header" style={{
      minHeight: '64px',
      backgroundColor: 'var(--color-surface-l1)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 20px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      gap: '12px',
      flexWrap: 'nowrap',
      overflow: 'visible'
    }}>
      {/* Sisi Kiri: Tombol Toggle Menu Mobile */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Buka menu"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sisi Kanan: Akun Pengguna (Sama persis dengan Penghuni) */}
      <div className="resident-profile-menu" ref={menuRef}>
        <button
          type="button"
          className="resident-profile-link"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="topbar-profile-dropdown"
          aria-label={`Menu profil ${user?.nama || 'Pengguna'}`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="resident-avatar">
            {user?.foto_profil ? (
              <img
                src={user.foto_profil.startsWith('http') ? user.foto_profil : user.foto_profil}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <UserRound size={17} />
            )}
          </span>
          <span className="resident-profile-name">{user?.nama || 'Pengguna'}</span>
          <ChevronDown className="resident-profile-chevron" size={16} />
        </button>

        {menuOpen && (
          <nav id="topbar-profile-dropdown" className="resident-profile-dropdown" role="menu" aria-label="Menu profil">
            <Link to="/profil#lihat-profil" className="resident-profile-menu-item" role="menuitem" onClick={closeMenu}>
              <UserRound size={17} />
              <span>Lihat profil</span>
            </Link>
            <Link to="/profil#tampilan" className="resident-profile-menu-item" role="menuitem" onClick={closeMenu}>
              <Sun size={17} />
              <span>Atur tampilan</span>
            </Link>
            <Link to="/profil#kata-sandi" className="resident-profile-menu-item" role="menuitem" onClick={closeMenu}>
              <LockKeyhole size={17} />
              <span>Ubah kata sandi</span>
            </Link>
            <Link to="/profil#bantuan" className="resident-profile-menu-item" role="menuitem" onClick={closeMenu}>
              <CircleHelp size={17} />
              <span>Bantuan</span>
            </Link>
            <button type="button" className="resident-profile-menu-item danger" role="menuitem" onClick={handleLogout}>
              <LogOut size={17} />
              <span>Keluar</span>
            </button>
          </nav>
        )}
      </div>

      <style>{`
        .mobile-menu-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          color: var(--color-text-primary);
          background: var(--color-surface-l2);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: inline-flex;
          }
        }

        @media (max-width: 520px) {
          .topbar-header {
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </header>
  );
}
