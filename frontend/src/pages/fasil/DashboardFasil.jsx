import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Calendar,
  Building,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DashboardFasil() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getFasilDashboard();
      if (res && res.status === 'success' && res.data) {
        setDashboardData(res.data);
      } else {
        throw new Error(res?.message || 'Gagal memuat data dashboard.');
      }
    } catch (err) {
      setError(
        err.message || 'Terjadi kesalahan saat menghubungkan ke server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickVerify = async (izinId, status) => {
    const statusText = status === 'disetujui' ? 'menyetujui' : 'menolak';
    const catatan = status === 'ditolak'
      ? window.prompt('Masukkan alasan penolakan izin:')
      : 'Disetujui melalui Dashboard Fasilitator.';

    if (status === 'ditolak' && (!catatan || !catatan.trim())) {
      alert('Alasan penolakan wajib diisi.');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin ${statusText} pengajuan izin ini?`)) {
      return;
    }

    setActionLoadingId(izinId);
    try {
      const res = await api.verifyIzin(izinId, status, catatan);
      if (res && res.status === 'success') {
        setActionMessage({
          text: `Izin berhasil di-${status}.`,
          type: 'success'
        });
        // Perbarui data dashboard setelah verifikasi
        fetchDashboardData();
      } else {
        throw new Error(res?.message || 'Gagal memverifikasi izin.');
      }
    } catch (err) {
      setActionMessage({
        text: err.message || 'Gagal memverifikasi izin.',
        type: 'error'
      });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
    }
  };

  const ringkasan = dashboardData?.ringkasan || {
    total_penghuni: 0,
    total_kamar: 0,
    total_hadir_hari_ini: 0,
    total_belum_hari_ini: 0,
    total_izin_hari_ini: 0,
    persentase_kehadiran: 0,
    total_izin_pending: 0
  };

  const subuh = dashboardData?.subuh || {
    hadir: 0,
    terlambat: 0,
    izin: 0,
    belum_presensi: 0,
    persentase: 0
  };

  const malam = dashboardData?.malam || {
    hadir: 0,
    terlambat: 0,
    izin: 0,
    belum_presensi: 0,
    persentase: 0
  };

  const gedungInfo = dashboardData?.gedung || {
    nama: user?.gedung || 'Gedung Binaan',
    total_kamar: ringkasan.total_kamar
  };

  const pendingPermits = dashboardData?.pending_permits || [];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 className="text-page-title">Dashboard Fasilitator</h1>
          <p className="text-body">
            Monitoring kehadiran penghuni:{' '}
            <strong style={{ color: 'var(--color-primary)' }}>
              {gedungInfo.nama}
            </strong>
            {dashboardData?.tanggal && (
              <span> • Tanggal: <strong>{dashboardData.tanggal}</strong></span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {dashboardData?.sesi_aktif && (
            <Badge variant="success">
              Sesi Aktif: {dashboardData.sesi_aktif.toUpperCase()}
            </Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Perbarui Data'}
          </Button>
        </div>
      </div>

      {/* Alert Notifikasi Aksi */}
      {actionMessage.text && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: actionMessage.type === 'success'
            ? 'rgba(29, 185, 84, 0.15)'
            : 'rgba(226, 33, 52, 0.15)',
          border: `1px solid ${actionMessage.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)'}`,
          color: actionMessage.type === 'success' ? 'var(--color-primary)' : 'var(--color-error)',
          fontSize: '13px'
        }}>
          {actionMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tampilan Error */}
      {error && !loading && (
        <Card style={{
          borderLeft: '4px solid var(--color-error)',
          marginBottom: '24px',
          backgroundColor: 'rgba(226, 33, 52, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle color="var(--color-error)" size={24} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--color-error)' }}>Gagal Memuat Data</strong>
              <p className="text-body" style={{ fontSize: '13px', margin: '4px 0 0' }}>
                {error}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchDashboardData}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      )}

      {/* Tampilan Loading Awal */}
      {loading && !dashboardData ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--color-surface-l2)',
            borderTop: '3px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'fasilSpin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p className="text-body">Mengambil statistik kehadiran real-time...</p>
          <style>{`
            @keyframes fasilSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Metric Cards (Real Database Data) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="text-label">TOTAL PENGHUNI</span>
                <Users size={18} color="var(--color-neutral)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>
                {ringkasan.total_penghuni}
              </div>
              <span className="text-small" style={{ color: 'var(--color-primary)' }}>
                {ringkasan.total_kamar} Kamar Terdaftar
              </span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="text-label" style={{ color: 'var(--color-primary)' }}>
                  HADIR HARI INI
                </span>
                <CheckCircle size={18} color="var(--color-primary)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-primary)', margin: '8px 0' }}>
                {ringkasan.total_hadir_hari_ini}
              </div>
              <span className="text-small">
                {ringkasan.persentase_kehadiran}% Kehadiran ({ringkasan.total_penghuni} Penghuni)
              </span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="text-label" style={{ color: 'var(--color-warning)' }}>
                  BELUM PRESENSI
                </span>
                <Clock size={18} color="var(--color-warning)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-warning)', margin: '8px 0' }}>
                {ringkasan.total_belum_hari_ini}
              </div>
              <span className="text-small">
                {ringkasan.total_izin_hari_ini > 0 ? `${ringkasan.total_izin_hari_ini} Sedang Izin Resmi` : 'Perlu dimonitor'}
              </span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="text-label" style={{ color: 'var(--color-error)' }}>
                  IZIN PENDING
                </span>
                <AlertTriangle size={18} color="var(--color-error)" />
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0' }}>
                {ringkasan.total_izin_pending}
              </div>
              <span className="text-small" style={{ color: ringkasan.total_izin_pending > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                {ringkasan.total_izin_pending > 0 ? `${ringkasan.total_izin_pending} Menunggu Verifikasi` : 'Semua izin terverifikasi'}
              </span>
            </Card>
          </div>

          {/* Visualisasi Ringkasan Kehadiran Sesi Subuh & Sesi Malam */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}>
            {/* Sesi Subuh */}
            <Card hoverable={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 className="text-card-title" style={{ fontSize: '16px' }}>Sesi Subuh</h3>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>
                    04.00 - 06.00 WIB
                  </span>
                </div>
                <Badge variant={subuh.persentase >= 80 ? 'success' : subuh.persentase >= 50 ? 'warning' : 'neutral'}>
                  {subuh.persentase}% Hadir
                </Badge>
              </div>

              {/* Progress Bar Persentase */}
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--color-surface-l2)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, subuh.persentase)}%`,
                  backgroundColor: 'var(--color-primary)',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>Hadir / Tepat Waktu</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '2px' }}>
                    {subuh.hadir}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>Belum Presensi</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-warning)', marginTop: '2px' }}>
                    {subuh.belum_presensi}
                  </div>
                </div>
              </div>
            </Card>

            {/* Sesi Malam */}
            <Card hoverable={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 className="text-card-title" style={{ fontSize: '16px' }}>Sesi Malam</h3>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>
                    18.00 - 20.30 WIB
                  </span>
                </div>
                <Badge variant={malam.persentase >= 80 ? 'success' : malam.persentase >= 50 ? 'warning' : 'neutral'}>
                  {malam.persentase}% Hadir
                </Badge>
              </div>

              {/* Progress Bar Persentase */}
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'var(--color-surface-l2)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, malam.persentase)}%`,
                  backgroundColor: 'var(--color-primary)',
                  transition: 'width 0.4s ease'
                }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>Hadir / Tepat Waktu</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '2px' }}>
                    {malam.hadir}
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-small" style={{ color: 'var(--color-text-secondary)' }}>Belum Presensi</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-warning)', marginTop: '2px' }}>
                    {malam.belum_presensi}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Section Permohonan Izin Menunggu Persetujuan (Data Nyata) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="text-section-title">
              Permohonan Izin Menunggu Verifikasi ({pendingPermits.length})
            </h2>
            <Link to="/fasil/izin">
              <Button variant="ghost" size="sm" icon={ArrowRight}>
                Buka Halaman Verifikasi
              </Button>
            </Link>
          </div>

          {pendingPermits.length === 0 ? (
            <Card hoverable={false} style={{ textAlign: 'center', padding: '36px 20px', marginBottom: '28px' }}>
              <CheckCircle size={36} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
              <h3 className="text-card-title">Semua Permohonan Izin Terverifikasi</h3>
              <p className="text-body" style={{ color: 'var(--color-neutral)', marginTop: '6px' }}>
                Tidak ada permohonan izin penghuni gedung binaan yang menunggu verifikasi saat ini.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
              {pendingPermits.map((item) => (
                <Card key={item.id} hoverable={false} style={{ padding: '18px 20px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '15px' }}>
                          {item.nama} ({item.nim})
                        </strong>
                        <Badge variant="neutral" size="sm">Kamar {item.kamar}</Badge>
                        <Badge variant="warning" size="sm">{item.jenis}</Badge>
                      </div>
                      <p className="text-body" style={{ fontSize: '13px', marginTop: '6px' }}>
                        Periode: <strong>{item.periode}</strong> • Alasan: "{item.alasan}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={X}
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleQuickVerify(item.id, 'ditolak')}
                      >
                        Tolak
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Check}
                        disabled={actionLoadingId === item.id}
                        onClick={() => handleQuickVerify(item.id, 'disetujui')}
                      >
                        Setujui
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
