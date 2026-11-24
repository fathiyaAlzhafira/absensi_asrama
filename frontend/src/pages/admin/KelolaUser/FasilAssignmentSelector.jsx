import React from 'react';

export default function FasilAssignmentSelector({
  selectedGedungId,
  selectedLantai,
  buildingOptions,
  availableFloors,
  onGedungSelect,
  onLantaiSelect,
  selectStyle
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(29, 185, 84, 0.05)',
        border: '1px solid rgba(29, 185, 84, 0.25)'
      }}
    >
      <div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--color-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          Penempatan Gedung &amp; Lantai Binaan (Fasilitator)
        </span>
        <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--color-neutral)' }}>
          Tentukan gedung asrama dan lantai yang berada di bawah bimbingan fasilitator.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Gedung Asrama Binaan
        </label>
        <select
          value={selectedGedungId}
          onChange={(e) => onGedungSelect(e.target.value)}
          style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)' }}
        >
          <option value="">Belum Ditugaskan</option>
          {buildingOptions.map((g) => (
            <option key={g.id} value={g.id}>{g.nama}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Lantai Binaan
        </label>
        <select
          value={selectedLantai}
          onChange={(e) => onLantaiSelect(e.target.value)}
          disabled={!selectedGedungId}
          style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)', opacity: selectedGedungId ? 1 : 0.6 }}
        >
          <option value="">Semua Lantai (Seluruh Gedung)</option>
          {availableFloors.map((fl) => (
            <option key={fl} value={fl}>Lantai {fl}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
