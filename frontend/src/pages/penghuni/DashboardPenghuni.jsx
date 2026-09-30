import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Camera, Clock, CheckCircle2, AlertCircle, Calendar, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DashboardPenghuni() {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState({
    subuh: { status: 'hadir', waktu: '05:15 WIB' },
    malam: null
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    // Ambil status presensi hari ini jika terhubung ke backend
    api.getMyPresensi().then((res) => {
      if (res && res.data && res.data.length > 0) {
        const todayDate = new Date().toISOString().split('T')[0];
        const subuhLog = res.data.find(r => r.tanggal === todayDate && r.sesi === 'subuh');
        const malamLog = res.data.find(r => r.tanggal === todayDate && r.sesi === 'malam');
        setTodayStatus({
          subuh: subuhLog ? { status: subuhLog.status, waktu: subuhLog.waktu } : null,
          malam: malamLog ? { status: malamLog.status, waktu: malamLog.waktu } : null
        });
      }
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Selamat Datang, {user?.nama || 'Penghuni Asrama'}</h1>
          <p className="text-body">
            Kamar: <strong style={{ color: 'var(--color-text-primary)' }}>{user?.nomor_kamar || user?.kamar || 'A-101'}</strong> • {user?.gedung || 'Asrama Putra Unand (Gedung A)'}
          </p>
        </div>
        <Link to="/penghuni/presensi">
          <Button variant="primary" size="lg" icon={Camera}>
            Buka Presensi Kamera
          </Button>
        </Link>
      </div>

      {/* Sesi Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Sesi Subuh */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="text-label" style={{ color: 'var(--color-primary)' }}>SESI 1 • 04.00 - 06.00 WIB</span>
            {todayStatus.subuh ? (
              <Badge variant="success">Sudah Hadir</Badge>
            ) : (
              <Badge variant="warning">Belum Presensi</Badge>
            )}
          </div>
          <h3 className="text-card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Presensi Subuh</h3>
          <p className="text-body" style={{ marginBottom: '16px' }}>
            {todayStatus.subuh 
              ? `Tercatat pukul ${todayStatus.subuh.waktu} di area Asrama Unand`
              : 'Presensi wajib dilakukan di lingkungan asrama'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontSize: '13px', fontWeight: '700' }}>
            <CheckCircle2 size={16} />
            <span>{todayStatus.subuh ? 'Terverifikasi GPS & Wajah' : 'Jadwal 04.00 - 06.00 WIB'}</span>
          </div>
        </Card>

        {/* Sesi Malam */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="text-label" style={{ color: 'var(--color-warning)' }}>SESI 2 • 18.00 - 20.30 WIB</span>
            {todayStatus.malam ? (
              <Badge variant="success">Sudah Hadir</Badge>
            ) : (
              <Badge variant="warning">Belum Presensi</Badge>
            )}
          </div>
          <h3 className="text-card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Presensi Malam</h3>
          <p className="text-body" style={{ marginBottom: '16px' }}>
            {todayStatus.malam
              ? `Tercatat pukul ${todayStatus.malam.waktu} di area Asrama Unand`
              : 'Wajib berada di lingkungan asrama sebelum jam 20.30 WIB'}
          </p>
          <Link to="/penghuni/presensi">
            <Button variant="secondary" size="sm" icon={ArrowRight}>
              Presensi Malam
            </Button>
          </Link>
        </Card>

        {/* Izin Card */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="text-label">PERIZINAN</span>
            <Badge variant="neutral">Status Izin</Badge>
          </div>
          <h3 className="text-card-title" style={{ fontSize: '18px', marginBottom: '8px' }}>Perlu Izin Keluar?</h3>
          <p className="text-body" style={{ marginBottom: '16px' }}>
            Ajukan permohonan izin jika berhalangan hadir pada sesi Subuh atau Malam.
          </p>
          <Link to="/penghuni/izin/tambah">
            <Button variant="ghost" size="sm" icon={FileText} style={{ paddingLeft: 0, color: 'var(--color-primary)' }}>
              Ajukan Izin Baru
            </Button>
          </Link>
        </Card>
      </div>

      {/* Ringkasan Kehadiran Cepat */}
      <Card hoverable={false} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 className="text-card-title">Ketentuan Presensi Asrama Unand</h3>
            <p className="text-body" style={{ fontSize: '13px' }}>Aturan resmi operasional kehadiran mahasiswa asrama</p>
          </div>
          <Link to="/penghuni/riwayat">
            <Button variant="ghost" size="sm" icon={ArrowRight}>
              Lihat Riwayat Lengkap
            </Button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Presensi Subuh (04.00 - 06.00 WIB)</div>
            <p className="text-body">Dilakukan setelah shalat Subuh. Memerlukan foto selfie wajah dan deteksi GPS aktif.</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Presensi Malam (18.00 - 20.30 WIB)</div>
            <p className="text-body">Dilakukan sebelum batas jam malam asrama berakhir. Tidak dapat absen di luar radius asrama.</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Pengajuan Izin</div>
            <p className="text-body">Wajib melampirkan berkas bukti (surat dokter, surat keterangan kampus) format JPG atau PDF.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
