import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Users, CheckCircle, Clock, AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardFasil() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Dashboard Fasilitator</h1>
        <p className="text-body">Monitoring kehadiran penghuni: <strong>{user?.gedung || 'Asrama Putra Gedung A'}</strong></p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card>
          <span className="text-label">TOTAL PENGHUNI</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>120</div>
          <span className="text-small" style={{ color: 'var(--color-primary)' }}>30 Kamar Aktif</span>
        </Card>

        <Card>
          <span className="text-label" style={{ color: 'var(--color-primary)' }}>HADIR SUBUH HARI INI</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)', margin: '8px 0' }}>112</div>
          <span className="text-small">93.3% Kehadiran Subuh</span>
        </Card>

        <Card>
          <span className="text-label" style={{ color: 'var(--color-warning)' }}>HADIR MALAM HARI INI</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-warning)', margin: '8px 0' }}>98</div>
          <span className="text-small">Sesi berlangsung s/d 20:30 WIB</span>
        </Card>

        <Card>
          <span className="text-label" style={{ color: 'var(--color-error)' }}>IZIN / PERMOHONAN</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>4</div>
          <span className="text-small" style={{ color: 'var(--color-warning)' }}>2 Perlu Verifikasi</span>
        </Card>
      </div>

      {/* Task Assignment Box */}
      <Card style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '28px' }}>
        <span className="text-label" style={{ color: 'var(--color-warning)' }}>
           PANDUAN PENGERJAAN KELOMPOK • DASHBOARD FASIL
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/fasil/DashboardFasil.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Tampilkan ringkasan data kehadiran harian secara real-time dari tabel <code>presensis</code> untuk gedung yang dibina oleh fasil yang sedang login. Tampilkan tabel cepat permohonan izin yang butuh persetujuan.
        </p>
      </Card>

      {/* Section Permohonan Izin Menunggu Persetujuan */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="text-section-title">Permohonan Izin Menunggu Verifikasi</h2>
        <Link to="/fasil/izin">
          <Button variant="ghost" size="sm" icon={ArrowRight}>
            Lihat Semua Izin
          </Button>
        </Link>
      </div>

      <Card hoverable={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>Budi Santoso (2311521002)</strong>
              <Badge variant="neutral" size="sm">Kamar A-101</Badge>
              <Badge variant="warning" size="sm">Sakit</Badge>
            </div>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>
              Periode: 24-09-2026 s/d 25-09-2026 • Lampiran: <strong>surat_sakit.jpg</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="danger" icon={X}>Tolak</Button>
            <Button size="sm" variant="primary" icon={Check}>Setujui</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
