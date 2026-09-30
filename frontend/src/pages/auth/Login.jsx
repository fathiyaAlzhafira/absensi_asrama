import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Building } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
        // Arahkan ke dashboard sesuai role akun riil
        if (res.user.role === 'fasil') {
          navigate('/fasil/dashboard');
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/penghuni/dashboard');
        }
      } else {
        setError(res.message || 'Login gagal. Periksa kembali Email/NIM dan password Anda.');
      }
    } catch (err) {
      setError('Terjadi kendala saat menghubungi server backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Sisi Kiri: Foto Gedung Asrama Universitas Andalas (Jernih tanpa hitam/gelap) */}
      <div style={{
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
        {/* Background Foto Asrama Unand Asli Tanpa Efek Gelap */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/assets/Asrama-Unand-e1667298324176.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} />

        {/* Top Branding (Logo Unand + Identitas Asrama) */}
        <div style={{
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
        }}>
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

        {/* Bottom Hero Description (Frosted Glass Card menjaga teks terbaca tanpa menggelapkan foto) */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '520px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(29, 185, 84, 0.15)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-pill)',
            padding: '5px 12px',
            marginBottom: '12px'
          }}>
            <Building size={14} color="#169C46" />
            <span style={{ fontSize: '12px', color: '#111827', fontWeight: '700' }}>
              Asrama Kampus Limau Manis, Padang
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: '800', lineHeight: 1.3, color: '#111827', marginBottom: '10px' }}>
            Sistem Presensi Digital Penghuni Asrama
          </h1>
          <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
            Validasi kehadiran harian sesi Subuh (04.00 - 06.00 WIB) dan sesi Malam (18.00 - 20.30 WIB) terintegrasi dengan foto wajah dan geolokasi GPS.
          </p>
        </div>
      </div>

      {/* Sisi Kanan: Form Login */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        backgroundColor: 'var(--color-background)'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Header Brand dengan Logo Universitas Andalas */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <img
                src="/assets/TB.png"
                alt="Logo Universitas Andalas"
                style={{ width: '56px', height: '56px', objectFit: 'contain' }}
              />
            </div>
            <h1 className="text-section-title" style={{ fontSize: '26px', marginBottom: '6px' }}>
              Masuk ke Akun
            </h1>
            <p className="text-body">
              Gunakan Email Kampus atau Nomor Induk Mahasiswa (NIM)
            </p>
          </div>

          {/* Alert Error jika login gagal */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(226, 33, 52, 0.15)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Email atau NIM"
              placeholder="Contoh: 2311521001 atau nama@unand.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '35px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-neutral)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </Button>
          </form>

          {/* Informasi Panduan Login Akun Database */}
          <div style={{
            marginTop: '32px',
            padding: '16px',
            backgroundColor: 'var(--color-surface-l1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
              Informasi Kredensial Database:
            </div>
            <div>• <strong>Penghuni:</strong> ahmad.fauzan@student.unand.ac.id / password123</div>
            <div>• <strong>Fasil:</strong> fasil.rizky@unand.ac.id / password123</div>
            <div>• <strong>Admin:</strong> admin@unand.ac.id / password123</div>
          </div>
        </div>
      </div>

      {/* Style responsif untuk desktop split-screen */}
      <style>{`
        @media (min-width: 900px) {
          .login-hero-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
