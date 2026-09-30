import React from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Users, Building, ShieldCheck, DoorOpen, Settings, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardAdmin() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Dashboard Administrator</h1>
        <p className="text-body">Pusat kendali operasional Sistem Absensi Asrama Universitas Andalas</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <Card>
          <span className="text-label">TOTAL PENGHUNI</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>480</div>
          <span className="text-small" style={{ color: 'var(--color-primary)' }}>Aktif Terdaftar</span>
        </Card>

        <Card>
          <span className="text-label" style={{ color: 'var(--color-warning)' }}>FASILITATOR (FASIL)</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-warning)', margin: '8px 0' }}>12</div>
          <span className="text-small">Membina 4 Gedung</span>
        </Card>

        <Card>
          <span className="text-label">GEDUNG ASRAMA</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>4</div>
          <span className="text-small">120 Kamar Tersedia</span>
        </Card>

        <Card>
          <span className="text-label" style={{ color: 'var(--color-primary)' }}>TINGKAT KEHADIRAN</span>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)', margin: '8px 0' }}>94.8%</div>
          <span className="text-small">Rata-rata Minggu Ini</span>
        </Card>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '28px' }}>
        <span className="text-label" style={{ color: 'var(--color-error)' }}>
           PANDUAN PENGERJAAN KELOMPOK • DASHBOARD ADMIN
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/admin/DashboardAdmin.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Tampilkan grafik atau ringkasan metrik real-time kehadiran seluruh gedung asrama. Sediakan tombol navigasi cepat ke manajemen user, kamar, dan pengaturan jam presensi.
        </p>
      </Card>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <Link to="/admin/users">
          <Card>
            <Users size={28} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 className="text-card-title">Kelola Penghuni & Fasil</h3>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>Tambah data mahasiswa baru atau akun fasilitator asrama.</p>
          </Card>
        </Link>

        <Link to="/admin/gedungs">
          <Card>
            <Building size={28} color="var(--color-warning)" style={{ marginBottom: '12px' }} />
            <h3 className="text-card-title">Kelola Gedung Asrama</h3>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>Atur data gedung, titik koordinat GPS, dan fasil penanggung jawab.</p>
          </Card>
        </Link>

        <Link to="/admin/kamars">
          <Card>
            <DoorOpen size={28} color="#FFFFFF" style={{ marginBottom: '12px' }} />
            <h3 className="text-card-title">Kelola Data Kamar</h3>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>Nomor kamar, lantai, kapasitas, dan plotting mahasiswa.</p>
          </Card>
        </Link>

        <Link to="/admin/pengaturan">
          <Card>
            <Settings size={28} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
            <h3 className="text-card-title">Pengaturan Jam & Radius</h3>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>Konfigurasi jam sesi Subuh, Malam, dan batas meter GPS.</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
