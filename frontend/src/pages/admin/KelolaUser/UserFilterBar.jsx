import React from 'react';
import Input from '../../../components/common/Input';
import { Search } from 'lucide-react';

export default function UserFilterBar({
  filterRole,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalCount,
  penghuniCount,
  fasilCount
}) {
  const tabs = [
    { key: 'all', label: `Semua (${totalCount})` },
    { key: 'penghuni', label: `Penghuni (${penghuniCount})` },
    { key: 'fasil', label: `Fasilitator (${fasilCount})` }
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const isSelected = filterRole === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange(tab.key)}
              style={{
                height: '34px',
                padding: '0 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-l2)',
                color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ width: '280px' }}>
        <Input
          placeholder="Cari nama, NIM, atau email..."
          icon={Search}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
