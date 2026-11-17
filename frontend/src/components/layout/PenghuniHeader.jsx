import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  CircleHelp,
  LogOut,
  LockKeyhole,
  Sun,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PenghuniHeader() {
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
    <header className="resident-header">
      <div className="resident-header-inner">
        <Link to="/penghuni/dashboard" className="resident-brand">
          <img src="/assets/TB.png" alt="" />
          <span>
            <strong>ASRAMA UNAND</strong>
            <small>Portal Absensi</small>
          </span>
        </Link>

        <div className="resident-profile-menu" ref={menuRef}>
          <button
            type="button"
            className="resident-profile-link"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="resident-profile-dropdown"
            aria-label={`Menu profil ${user?.nama || 'Penghuni'}`}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="resident-avatar"><UserRound size={17} /></span>
            <span className="resident-profile-name">{user?.nama || 'Penghuni'}</span>
            <ChevronDown className="resident-profile-chevron" size={16} />
          </button>

          {menuOpen && (
            <nav id="resident-profile-dropdown" className="resident-profile-dropdown" role="menu" aria-label="Menu profil">
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
      </div>
    </header>
  );
}
