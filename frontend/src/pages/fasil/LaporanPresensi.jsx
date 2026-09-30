import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FileText, Download, Printer, Filter } from 'lucide-react';

export default function LaporanPresensi() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Rekap & Laporan Presensi</h1>
          <p className="text-body">Ekspor rekapitulasi presensi kehadiran penghuni gedung binaan</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" size="md" icon={Printer}>Cetak</Button>
          <Button variant="primary" size="md" icon={Download}>Ekspor Excel / PDF</Button>
        </div>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-warning)' }}>
           PANDUAN PENGERJAAN KELOMPOK • LAPORAN PRESENSI (FASIL)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/fasil/LaporanPresensi.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Buat fungsi filter rentang tanggal (misal 1 minggu atau 1 bulan) lalu hitung persentase kehadiran per mahasiswa (% Hadir, % Izin, % Alpa). Tambahkan library seperti <code>xlsx</code> atau <code>jspdf</code> jika ingin fitur ekspor langsung dari frontend.
        </p>
      </Card>

      {/* Filter Parameters */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Input type="date" label="Dari Tanggal" defaultValue="2026-09-01" />
          <Input type="date" label="Sampai Tanggal" defaultValue="2026-09-30" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="text-label">Pilih Kamar</label>
            <select style={{ height: '42px', backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', padding: '0 12px' }}>
              <option value="all">Semua Kamar</option>
              <option value="A-101">Kamar A-101</option>
              <option value="A-102">Kamar A-102</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button variant="primary" size="md" icon={Filter} style={{ width: '100%' }}>
              Terapkan Filter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
