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

  // State Modal Lupa Kata Sandi
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = input email, 2 = email muncul & buat password baru
  const [forgotEmail, setForgotEmail] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);
  const [resetCode, setResetCode] = useState('');
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
    setForgotStep(1);
    setForgotEmail(email.includes('@') ? email : '');
    setEmailPreview(null);
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Masukkan alamat email kampus Anda terlebih dahulu.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.forgotPassword({ email: forgotEmail.trim() });
      if (res?.status === 'success' && res.data) {
        setEmailPreview(res.data);
        setResetCode(res.data.reset_code || '');
        setForgotStep(2);
      } else {
        throw new Error(res?.message || 'Gagal mengirim email pemulihan.');
      }
    } catch (err) {
      setForgotError(err.message || 'Email tidak ditemukan dalam database.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!resetCode.trim()) {
      setForgotError('Kode verifikasi dari email wajib diisi.');
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
        email: emailPreview?.email || forgotEmail.trim(),
        reset_code: resetCode.trim(),
        password_baru: newPassword
      });
      if (res?.status === 'success') {
        setForgotOpen(false);
        setEmail(emailPreview?.email || forgotEmail.trim());
        setPassword('');
        setSuccessNotice(res.message || 'Kata sandi baru berhasil disimpan! Silakan masuk dengan kata sandi baru Anda.');
      } else {
        throw new Error(res?.message || 'Gagal mereset kata sandi.');
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
              *Akun penghuni baru menggunakan password default: <strong>NamaGedung + NIM</strong> (contoh: <code>RPX2311521001</code>).
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lupa Kata Sandi via Email */}
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
            maxWidth: '480px',
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
                    {forgotStep === 1 ? 'Langkah 1: Verifikasi Email Akun' : 'Langkah 2: Buat Kata Sandi Baru'}
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

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetEmail} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Masukkan alamat <strong>Email Kampus</strong> atau <strong>NIM</strong> Anda yang terdaftar. Sistem akan mengirimkan pesan email berisi kode verifikasi untuk membuat kata sandi baru.
                </p>
                <Input
                  label="Email Kampus / NIM Terdaftar"
                  placeholder="Contoh: ahmad.fauzan@student.unand.ac.id"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  icon={Mail}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" disabled={forgotLoading}>
                    {forgotLoading ? 'Mengirim Email...' : 'Kirim Email Reset'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Kotak Masuk Email yang Muncul Otomatis */}
                {emailPreview && (
                  <div style={{
                    backgroundColor: 'var(--color-surface-l2)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '12px',
                    lineHeight: 1.55
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', fontSize: '11px' }}>
                      <Mail size={14} />
                      <span>Pesan Email Masuk</span>
                    </div>
                    <div style={{ color: 'var(--color-neutral)', fontSize: '11px', marginBottom: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      <div><strong>Dari:</strong> {emailPreview.email_from}</div>
                      <div><strong>Kepada:</strong> {emailPreview.email} ({emailPreview.nama})</div>
                      <div><strong>Subjek:</strong> {emailPreview.email_subject}</div>
                    </div>
                    <div style={{ color: 'var(--color-text-primary)' }}>
                      Halo <strong>{emailPreview.nama}</strong>, gunakan kode verifikasi berikut untuk mengatur ulang kata sandi akun Portal Absensi Asrama Anda:
                    </div>
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-l1)',
                      border: '1px dashed var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>Kode Verifikasi (15 menit):</span>
                      <strong style={{ fontSize: '18px', letterSpacing: '0.15em', color: 'var(--color-primary)', fontFamily: 'var(--font-code)' }}>
                        {emailPreview.reset_code}
                      </strong>
                    </div>
                  </div>
                )}

                <Input
                  label="Kode Verifikasi dari Email"
                  type="text"
                  inputMode="numeric"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan 6 digit kode"
                />

                <Input
                  label="Kata Sandi Baru"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                />

                <Input
                  label="Konfirmasi Kata Sandi Baru"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '4px' }}>
                  <Button type="button" variant="ghost" onClick={() => setForgotStep(1)} disabled={forgotLoading}>
                    Ganti Email
                  </Button>
                  <Button type="submit" variant="primary" disabled={forgotLoading}>
                    {forgotLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                  </Button>
                </div>
              </form>
            )}
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
