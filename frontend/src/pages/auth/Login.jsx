import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import LoginHeroPanel from './LoginHeroPanel';
import ForgotPasswordModal from './ForgotPasswordModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // State Modal Lupa Kata Sandi
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
    setFieldError('');
    setSuccessNotice('');

    const cleanEmail = (email || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Email/NIM dan kata sandi wajib diisi.');
      setFieldError('Wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const res = await login({ email: cleanEmail, password: cleanPassword });
      if (res.success && res.user) {
        if (res.user.role === 'fasil') {
          navigate('/fasil/dashboard');
        } else if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/penghuni/dashboard');
        }
      } else {
        const msg = res.message || 'Email/NIM atau password salah. Periksa kembali Email/NIM dan password Anda.';
        setError(msg);
        setFieldError('Email/NIM atau password tidak sesuai.');
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text-primary)'
      }}
    >
      {/* Sisi Kiri: Foto Hero Asrama Universitas Andalas */}
      <LoginHeroPanel />

      {/* Sisi Kanan: Form Login */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          backgroundColor: 'var(--color-background)'
        }}
      >
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
            <div
              style={{
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
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div
              style={{
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
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Input
              label="Email atau NIM"
              placeholder="Contoh: 2311521001 atau nama@unand.ac.id"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError('');
                if (error) setError('');
              }}
              error={fieldError}
              icon={Mail}
              required
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Input
                label="Password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldError) setFieldError('');
                  if (error) setError('');
                }}
                error={fieldError}
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
          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: 'var(--color-surface-l1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.6
            }}
          >
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

      {/* Modal Lupa Kata Sandi */}
      <ForgotPasswordModal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        forgotIdentity={forgotIdentity}
        setForgotIdentity={setForgotIdentity}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmNewPassword={confirmNewPassword}
        setConfirmNewPassword={setConfirmNewPassword}
        forgotLoading={forgotLoading}
        forgotError={forgotError}
        onSubmit={handleResetPasswordSubmit}
      />

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
