import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, Mail, AlertCircle, CheckCircle2, Building, X, KeyRound } from 'lucide-react';
import { api } from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // State Modal Lupa Kata Sandi (Tanpa Email)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentity, setForgotIdentity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      if (res.success && res.user) {
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
    } catch {
      setError('Terjadi kendala saat menghubungi server backend.');
    } finally {
      setLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotOpen(true);
    setForgotIdentity(email || '');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotIdentity.trim()) {
      setForgotError('Email atau NIM wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Konfirmasi kata sandi baru belum sama.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.resetPassword({
        email: forgotIdentity.trim(),
        password_baru: newPassword
      });
      if (res?.status === 'success') {
        setForgotOpen(false);
        setEmail(forgotIdentity.trim());
        setPassword('');
        setSuccessNotice(res.message || 'Kata sandi baru berhasil disimpan! Silakan masuk dengan kata sandi baru Anda.');
      } else {
        throw new Error(res?.message || 'Gagal mengubah kata sandi.');
      }
    } catch (err) {
      setForgotError(err.message || 'Gagal menyimpan kata sandi baru.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--color-background)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Sisi Kiri: Foto Gedung Asrama Universitas Andalas */}
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
            Validasi kehadiran harian sesi Subuh dan sesi Malam terintegrasi dengan foto wajah dan poligon geolokasi GPS gedung asrama.
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

          {successNotice && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(29, 185, 84, 0.15)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Email atau NIM"
              placeholder="Contoh: 2311521001 atau nama@unand.ac.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Input
                label="Password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={openForgotModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Lupa Kata Sandi?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
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
            <div style={{ marginTop: '6px', color: 'var(--color-neutral)', fontSize: '11px' }}>
              *Akun pengguna baru menggunakan password default: <strong>NamaAwal + NIM</strong> (contoh: <code>Ahmad2311521001</code>).
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi (Tanpa Email) */}
      {forgotOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.68)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(29, 185, 84, 0.14)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--color-text-primary)' }}>
                    Lupa Kata Sandi
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>
                    Buat kata sandi baru untuk akun Anda
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {forgotError && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 12px',
                backgroundColor: 'rgba(226, 33, 52, 0.14)',
                border: '1px solid var(--color-error)',
                borderRadius: '8px',
                color: 'var(--color-error)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{forgotError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Email atau NIM Terdaftar"
                placeholder="Contoh: 2311521001 atau nama@unand.ac.id"
                value={forgotIdentity}
                onChange={(e) => setForgotIdentity(e.target.value)}
                icon={Mail}
                required
              />

              <Input
                label="Kata Sandi Baru"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />

              <Input
                label="Konfirmasi Kata Sandi Baru"
                type="password"
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" disabled={forgotLoading}>
                  {forgotLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
