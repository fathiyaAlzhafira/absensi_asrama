import React from 'react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, AlertCircle, X, KeyRound } from 'lucide-react';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  forgotIdentity,
  setForgotIdentity,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  forgotLoading,
  forgotError,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.68)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface-l1)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(29, 185, 84, 0.14)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
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
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {forgotError && (
          <div
            style={{
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
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{forgotError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={forgotLoading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={forgotLoading}>
              {forgotLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
