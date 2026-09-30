import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, MapPin, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar() {
  const { user } = useAuth();

  return (
    <header style={{
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
      flexWrap: 'nowrap'
    }}>
      {/* Sisi Kiri: Info Sesi Presensi & Lokasi */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: 0,
        flexShrink: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          backgroundColor: 'var(--color-surface-l2)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          whiteSpace: 'nowrap',
          flexShrink: 1
        }}>
          <Clock size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <span className="sesi-full-text">
            Sesi: <strong style={{ color: 'var(--color-text-primary)' }}>Subuh (04.00-06.00)</strong> & <strong style={{ color: 'var(--color-text-primary)' }}>Malam (18.00-20.30)</strong>
          </span>
          <span className="sesi-compact-text">
            <strong style={{ color: 'var(--color-text-primary)' }}>Subuh & Malam</strong>
          </span>
        </div>

        <div className="hide-on-tablet" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--color-neutral)',
          whiteSpace: 'nowrap'
        }}>
          <MapPin size={13} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <span>Asrama Unand Limau Manis</span>
        </div>
      </div>

      {/* Sisi Kanan: Akun Pengguna (Avatar-only ketika layar kecil agar tidak menimpa Sesi) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Link
          to="/profil"
          title={`Profil: ${user?.nama || 'Pengguna'}`}
          className="topbar-profile-chip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--color-surface-l2)',
            border: '1px solid var(--color-border)',
            transition: 'all var(--transition-fast)',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            flexShrink: 0
          }}>
            <UserIcon size={16} />
          </div>
          <div className="topbar-user-text" style={{ display: 'flex', flexDirection: 'column', maxWidth: '140px', overflow: 'hidden' }}>
            <span style={{
              fontSize: '13px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.nama || 'Pengguna'}
            </span>
            <span style={{
              fontSize: '10px',
              color: 'var(--color-neutral)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.nim ? `NIM: ${user.nim}` : (user?.role || 'Asrama')}
            </span>
          </div>
        </Link>
      </div>

      <style>{`
        .topbar-profile-chip {
          padding: 5px 12px;
        }
        .sesi-compact-text {
          display: none;
        }
        .sesi-full-text {
          display: inline;
        }

        @media (max-width: 768px) {
          .hide-on-tablet {
            display: none !important;
          }
          .sesi-full-text {
            display: none !important;
          }
          .sesi-compact-text {
            display: inline !important;
          }
          .topbar-user-text {
            display: none !important;
          }
          .topbar-profile-chip {
            padding: 4px !important;
            border-radius: 50% !important;
          }
        }
      `}</style>
    </header>
  );
}
