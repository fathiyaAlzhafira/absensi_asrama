import React from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';

export default function RiwayatFilterCard({
  statistik,
  filterSesi,
  setFilterSesi,
  filterMode,
  setFilterMode,
  filterMonth,
  setFilterMonth,
  tanggalMulai,
  setTanggalMulai,
  tanggalSelesai,
  setTanggalSelesai,
  onResetFilter
}) {
  return (
    <Card hoverable={false} className="resident-permission-summary-card">
      <div className="status-izin-header">
        <div>
          <span className="text-label" style={{ color: 'var(--color-primary)' }}>RINGKASAN KEHADIRAN</span>
          <h2 className="text-card-title">Statistik &amp; Filter Riwayat</h2>
          <p className="text-body">Rekap kehadiran presensi Subuh dan Malam Anda di asrama.</p>
        </div>
      </div>

      <div className="status-izin-summary" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="status-summary-item">
          <span className="text-small">Hadir</span>
          <strong className="status-summary-approved">{statistik.hadir}</strong>
        </div>
        <div className="status-summary-item">
          <span className="text-small">Izin</span>
          <strong style={{ color: 'var(--color-warning)' }}>{statistik.izin}</strong>
        </div>
        <div className="status-summary-item">
          <span className="text-small">Alfa</span>
          <strong style={{ color: 'var(--color-error)' }}>{statistik.alpa}</strong>
        </div>
      </div>

      <div className="resident-history-filter-bar">
        <label className="resident-filter-mode">
          <span>Sesi Absensi</span>
          <select value={filterSesi} onChange={(e) => setFilterSesi(e.target.value)}>
            <option value="all">Semua sesi (Subuh &amp; Malam)</option>
            <option value="subuh">Sesi Subuh</option>
            <option value="malam">Sesi Malam</option>
          </select>
        </label>

        <label className="resident-filter-mode">
          <span>Periode</span>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
            <option value="all">Semua periode</option>
            <option value="month">Berdasarkan bulan</option>
            <option value="range">Rentang tanggal</option>
          </select>
        </label>

        {filterMode === 'month' && (
          <Input
            type="month"
            label="Pilih bulan"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        )}

        {filterMode === 'range' && (
          <>
            <Input
              type="date"
              label="Dari tanggal"
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
            />
            <Input
              type="date"
              label="Sampai tanggal"
              value={tanggalSelesai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
            />
          </>
        )}

        {(filterMode !== 'all' || filterSesi !== 'all') && (
          <Button
            size="md"
            variant="secondary"
            onClick={onResetFilter}
            style={{ height: '42px', textTransform: 'none', letterSpacing: 0 }}
          >
            Reset Filter
          </Button>
        )}
      </div>
    </Card>
  );
}
