import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Download, Printer, Filter, BarChart } from 'lucide-react';

export default function LaporanGlobal() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Laporan Global Seluruh Asrama</h1>
          <p className="text-body">Rekapitulasi statistik kehadiran penghuni seluruh gedung asrama Unand</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" size="md" icon={Printer}>Cetak</Button>
          <Button variant="primary" size="md" icon={Download}>Ekspor Format Excel</Button>
        </div>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-error)' }}>
           PANDUAN PENGERJAAN KELOMPOK • LAPORAN GLOBAL (ADMIN)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/admin/LaporanGlobal.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sediakan filter tanggal, filter gedung (Gedung A, Gedung B, dll), dan tabel agregat total persentase kehadiran, izin, dan alpa mahasiswa. Sediakan tombol cetak atau ekspor CSV/Excel.
        </p>
      </Card>

      {/* Filter Parameters */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Input type="date" label="Dari Tanggal" defaultValue="2026-09-01" />
          <Input type="date" label="Sampai Tanggal" defaultValue="2026-09-30" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="text-label">Pilih Gedung</label>
            <select style={{ height: '42px', backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', padding: '0 12px' }}>
              <option value="all">Semua Gedung Asrama</option>
              <option value="1">Asrama Putra Gedung A</option>
              <option value="2">Asrama Putri Gedung B</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" size="md" icon={Filter} style={{ width: '100%' }}>
              Tampilkan Laporan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
