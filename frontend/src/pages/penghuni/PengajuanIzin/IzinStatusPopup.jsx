import React from 'react';
import Button from '../../../components/common/Button';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function IzinStatusPopup({ popup, onClose }) {
  if (!popup) return null;

  const isSuccess = popup.type === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'popupFadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface-l1)',
          border: isSuccess ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid rgba(226, 33, 52, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <button
          type="button"
          onClick={() => onClose(isSuccess)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-neutral)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: isSuccess ? 'rgba(29, 185, 84, 0.15)' : 'rgba(226, 33, 52, 0.15)',
            border: isSuccess ? '2px solid var(--color-primary)' : '2px solid var(--color-error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          {isSuccess ? (
            <CheckCircle2 size={36} color="var(--color-primary)" />
          ) : (
            <AlertCircle size={36} color="var(--color-error)" />
          )}
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            margin: '0 0 8px 0'
          }}
        >
          {popup.title}
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 20px 0',
            lineHeight: 1.5
          }}
        >
          {popup.message}
        </p>

        {isSuccess && popup.details && (
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--color-surface-l2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'left',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Kategori Izin:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{popup.details.kategori}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Sesi:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{popup.details.sesi}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Tanggal:</span>
              <strong style={{ color: 'var(--color-primary)' }}>{popup.details.tanggal}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Berkas Bukti:</span>
              <span
                style={{
                  color: 'var(--color-text-primary)',
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {popup.details.berkas}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
          {isSuccess ? (
            <Button
              variant="primary"
              size="md"
              style={{ width: '100%' }}
              onClick={() => onClose(true)}
            >
              Lihat Status Izin Saya
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              style={{ width: '100%' }}
              onClick={() => onClose(false)}
            >
              Tutup &amp; Periksa Kembali
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
