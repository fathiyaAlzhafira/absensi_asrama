import React from 'react';

export default function SesiSelector({
  sesi,
  schedule,
  onSesiChange
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Pilihan Sesi Izin Absen <span style={{ color: 'var(--color-primary)' }}>*</span>
        </label>
        <span style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>
          Pilih sesi yang ingin diizinkan
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        <button
          type="button"
          onClick={() => onSesiChange('semua')}
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: sesi === 'semua' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: sesi === 'semua' ? 'rgba(29, 185, 84, 0.12)' : 'var(--color-surface-l2)',
            color: sesi === 'semua' ? 'var(--color-primary)' : 'var(--color-text-primary)',
            fontWeight: sesi === 'semua' ? '700' : '500',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textAlign: 'center',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span style={{ fontSize: '13px' }}>Semua Sesi</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>Subuh &amp; Malam (Seharian)</span>
        </button>

        <button
          type="button"
          onClick={() => onSesiChange('malam')}
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: sesi === 'malam' ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
            backgroundColor: sesi === 'malam' ? 'rgba(245, 155, 35, 0.12)' : 'var(--color-surface-l2)',
            color: sesi === 'malam' ? 'var(--color-warning)' : 'var(--color-text-primary)',
            fontWeight: sesi === 'malam' ? '700' : '500',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textAlign: 'center',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span style={{ fontSize: '13px' }}>Hanya Sesi Malam</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>
            {schedule.jam_malam_mulai} – {schedule.jam_malam_selesai} WIB
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSesiChange('subuh')}
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            border: sesi === 'subuh' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: sesi === 'subuh' ? 'rgba(29, 185, 84, 0.12)' : 'var(--color-surface-l2)',
            color: sesi === 'subuh' ? 'var(--color-primary)' : 'var(--color-text-primary)',
            fontWeight: sesi === 'subuh' ? '700' : '500',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            textAlign: 'center',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span style={{ fontSize: '13px' }}>Hanya Sesi Subuh</span>
          <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>
            {schedule.jam_subuh_mulai} – {schedule.jam_subuh_selesai} WIB
          </span>
        </button>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-l1)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--color-border)'
        }}
      >
        {sesi === 'malam' && (
          <span><strong>Info:</strong> Anda mengajukan izin <strong>Hanya untuk Sesi Malam</strong> pada 1 tanggal yang dipilih. Di keesokan paginya, Anda tetap dapat melakukan presensi Subuh seperti biasa.</span>
        )}
        {sesi === 'subuh' && (
          <span><strong>Info:</strong> Anda mengajukan izin <strong>Hanya untuk Sesi Subuh</strong> pada 1 tanggal yang dipilih. Pada malam harinya, Anda tetap dapat melakukan presensi Malam di asrama.</span>
        )}
        {sesi === 'semua' && (
          <span><strong>Info:</strong> Izin mencakup <strong>Seluruh Sesi</strong> (Subuh &amp; Malam) selama rentang tanggal berlangsung.</span>
        )}
      </div>
    </div>
  );
}
