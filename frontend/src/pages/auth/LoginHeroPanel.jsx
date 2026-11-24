import React from 'react';
import { Building } from 'lucide-react';

export default function LoginHeroPanel() {
  return (
    <div
      style={{
        flex: '1.2',
        position: 'relative',
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px',
        overflow: 'hidden',
        minHeight: '100vh'
      }}
      className="login-hero-panel"
    >
      {/* Background Image Asrama */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/Asrama-Unand-e1667298324176.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Header Pill Unand */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          padding: '8px 18px',
          borderRadius: 'var(--radius-pill)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          alignSelf: 'flex-start'
        }}
      >
        <img
          src="/assets/TB.png"
          alt="Logo Universitas Andalas"
          style={{ width: '42px', height: '42px', objectFit: 'contain' }}
        />
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.02em', color: '#111827', margin: 0 }}>
            Universitas Andalas
          </h2>
          <span style={{ fontSize: '11px', color: '#169C46', fontWeight: '700', letterSpacing: '0.05em' }}>
            UPT Asrama Mahasiswa
          </span>
        </div>
      </div>

      {/* Description Hero Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '520px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(29, 185, 84, 0.15)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 12px',
            marginBottom: '12px'
          }}
        >
          <Building size={14} color="#169C46" />
          <span style={{ fontSize: '12px', color: '#111827', fontWeight: '700' }}>
            Asrama Kampus Limau Manis, Padang
          </span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', lineHeight: 1.3, color: '#111827', marginBottom: '10px' }}>
          Sistem Presensi Digital Penghuni Asrama
        </h1>
        <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
          Validasi kehadiran harian sesi Subuh dan sesi Malam terintegrasi dengan foto wajah dan poligon geolokasi GPS gedung asrama.
        </p>
      </div>
    </div>
  );
}
