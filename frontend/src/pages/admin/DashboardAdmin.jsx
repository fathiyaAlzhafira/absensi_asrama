import React, { useState, useEffect, useMemo } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  Users,
  Building,
  ShieldCheck,
  DoorOpen,
  Settings,
  Calendar,
  Filter,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function DashboardAdmin() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // Filter States
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterGedung, setFilterGedung] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('7d');

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [hoveredTrendPoint, setHoveredTrendPoint] = useState(null);

  // Akses Kontrol: Pastikan hanya Administrator yang dapat mengakses
  const isAdmin = role === 'admin';

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.getDashboardStats({
        date: filterDate,
        gedung_id: filterGedung,
        period: filterPeriod
      });

      if (res && res.status === 'success' && res.data) {
        setDashboardData(res.data);
      } else {
        throw new Error(res?.message || 'Gagal memuat data statistik dashboard.');
      }
    } catch (err) {
      console.warn('API getDashboardStats error:', err.message);
      setError(err.message || 'Koneksi ke backend bermasalah.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [filterDate, filterGedung, filterPeriod, isAdmin]);

  // Handle unauthorized access
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '640px', margin: '60px auto', textAlign: 'center' }}>
        <Card hoverable={false} style={{ padding: '40px 24px', borderTop: '4px solid var(--color-error)' }}>
          <ShieldAlert size={56} color="var(--color-error)" style={{ margin: '0 auto 16px' }} />
          <h2 className="text-page-title" style={{ fontSize: '24px', marginBottom: '12px' }}>
            Akses Terbatas Administrator
          </h2>
          <p className="text-body" style={{ marginBottom: '24px', color: 'var(--color-neutral)' }}>
            Halaman ini khusus diperuntukkan bagi Administrator Sistem Absensi Asrama Unand. Akun Anda saat ini memiliki hak akses: <strong>{role?.toUpperCase() || 'GUEST'}</strong>.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button
              variant="primary"
              onClick={() => {
                if (role === 'penghuni') navigate('/penghuni/dashboard');
                else if (role === 'fasil') navigate('/fasil/dashboard');
                else navigate('/login');
              }}
            >
              Kembali ke Dashboard Saya
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Safe data accessors
  const summary = dashboardData?.summary || {
    total_penghuni: 0,
    total_fasil: 0,
    total_gedung: 0,
    tingkat_kehadiran_persen: 0,
    tingkat_kehadiran_label: 'Rata-rata Kehadiran'
  };

  const sessionSubuh = dashboardData?.session_stats?.subuh || {
    label: 'Subuh (04.00 - 06.00 WIB)',
    status_sesi: 'selesai',
    total_target: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    alpa: 0,
    belum_presensi: 0,
    persentase_kehadiran: 0
  };

  const sessionMalam = dashboardData?.session_stats?.malam || {
    label: 'Malam (18.00 - 20.30 WIB)',
    status_sesi: 'belum_dimulai',
    total_target: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    alpa: 0,
    belum_presensi: 0,
    persentase_kehadiran: 0
  };

  const distribution = dashboardData?.distribution || {
    total_evaluated: 0,
    hadir: 0,
    terlambat: 0,
    izin: 0,
    alpa: 0,
    belum_presensi: 0,
    persentase: { hadir: 0, terlambat: 0, izin: 0, alpa: 0 }
  };

  const trend = dashboardData?.trend || [];
  const gedungsList = dashboardData?.gedungs_list || [
    { id: 'all', nama: 'Seluruh Kompleks Asrama' }
  ];

  // Hitung data SVG chart untuk tren persentase kehadiran
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 40;
  const paddingY = 30;

  const trendPoints = useMemo(() => {
    if (!trend.length) return [];
    const stepX = (chartWidth - paddingX * 2) / Math.max(trend.length - 1, 1);
    const usableHeight = chartHeight - paddingY * 2;

    return trend.map((t, idx) => {
      const x = paddingX + idx * stepX;
      const pct = Math.min(Math.max(t.persentase_kehadiran || 0, 0), 100);
      const y = chartHeight - paddingY - (pct / 100) * usableHeight;
      return { ...t, x, y, pct };
    });
  }, [trend]);

  const pathD = useMemo(() => {
    if (trendPoints.length === 0) return '';
    return trendPoints.reduce((acc, pt, idx) => {
      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [trendPoints]);

  const areaD = useMemo(() => {
    if (trendPoints.length === 0) return '';
    const firstX = trendPoints[0].x;
    const lastX = trendPoints[trendPoints.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [trendPoints, pathD]);

  // Helper session badge variant
  const getSessionBadgeVariant = (status) => {
    if (status === 'selesai') return 'neutral';
    if (status === 'berlangsung') return 'success';
    return 'default';
  };

  const getSessionBadgeLabel = (status) => {
    if (status === 'selesai') return 'Sesi Selesai';
    if (status === 'berlangsung') return 'Sedang Berlangsung';
    return 'Belum Dimulai';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Dashboard Administrator</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>
            Pemantauan real-time operasional presensi digital Asrama Universitas Andalas
          </p>
        </div>

        {/* Action & Filter Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Filter Tanggal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="var(--color-neutral)" />
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ width: '150px', height: '38px', fontSize: '13px' }}
            />
          </div>

          {/* Filter Gedung */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building size={16} color="var(--color-neutral)" />
            <select
              value={filterGedung}
              onChange={(e) => setFilterGedung(e.target.value)}
              style={{
                height: '38px',
                backgroundColor: 'var(--color-surface-l2)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                padding: '0 12px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {gedungsList.map((g) => (
                <option key={g.id} value={g.id}>{g.nama}</option>
              ))}
            </select>
          </div>

          {/* Tombol Refresh */}
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
            style={{ height: '38px' }}
          >
            {refreshing ? 'Memperbarui...' : 'Segarkan'}
          </Button>
        </div>
      </div>

      {/* Error Banner jika ada */}
      {error && (
        <div style={{
          padding: '14px 18px',
          backgroundColor: 'rgba(226, 33, 52, 0.12)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-error)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '13px' }}>{error}</span>
          </div>
          <Button size="sm" variant="danger" onClick={() => fetchDashboardData()}>Coba Lagi</Button>
        </div>
      )}

      {/* 2. Kartu Statistik Utama (A.1, A.2, A.3, A.4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {/* TOTAL PENGHUNI */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">TOTAL PENGHUNI</span>
            <Users size={20} color="var(--color-primary)" />
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--color-text-primary)',
            margin: '8px 0 4px'
          }}>
            {loading ? '...' : summary.total_penghuni}
          </div>
          <span className="text-small" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
            Aktif Terdaftar di Database
          </span>
        </Card>

        {/* TOTAL FASILITATOR */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ color: 'var(--color-warning)' }}>FASILITATOR ASRAMA</span>
            <ShieldCheck size={20} color="var(--color-warning)" />
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--color-warning)',
            margin: '8px 0 4px'
          }}>
            {loading ? '...' : summary.total_fasil}
          </div>
          <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
            Pembina & Verifikator Izin
          </span>
        </Card>

        {/* JUMLAH GEDUNG (Pemeriksaan C: jujur terhadap skema database) */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">GEDUNG ASRAMA</span>
            <Building size={20} color="var(--color-text-primary)" />
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--color-text-primary)',
            margin: '8px 0 4px'
          }}>
            {loading ? '...' : summary.total_gedung}
          </div>
          <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
            Seluruh Gedung Terdaftar *
          </span>
        </Card>

        {/* TINGKAT KEHADIRAN */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label" style={{ color: 'var(--color-primary)' }}>TINGKAT KEHADIRAN</span>
            <TrendingUp size={20} color="var(--color-primary)" />
          </div>
          <div style={{
            fontSize: '36px',
            fontWeight: '800',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--color-primary)',
            margin: '8px 0 4px'
          }}>
            {loading ? '...' : `${summary.tingkat_kehadiran_persen}%`}
          </div>
          <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
            {summary.tingkat_kehadiran_label}
          </span>
        </Card>
      </div>

      {/* Catatan Transparansi Skema Database Gedung (Sesuai Ketentuan C) */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: 'var(--color-surface-l1)',
        borderLeft: '4px solid var(--color-warning)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        color: 'var(--color-neutral)'
      }}>
        <Info size={16} color="var(--color-warning)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Catatan Audit Database Gedung:</strong> Rancangan tabel <code>gedungs</code> pada skema MySQL belum memiliki kolom penanda status aktif (misal <code>is_active</code> atau <code>status ENUM</code>). Kartu metrik di atas menampilkan seluruh gedung terdaftar tanpa fabrikasi status fiktif.
        </span>
      </div>

      {/* 3. Grafik Tren Persentase Kehadiran Seluruh Kompleks Asrama (A.4 & B) */}
      <Card hoverable={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="text-section-title" style={{ fontSize: '18px' }}>
              Tren Persentase Kehadiran Mahasiswa
            </h2>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '2px', color: 'var(--color-neutral)' }}>
              Akumulasi kehadiran sesi Subuh & Malam seluruh gedung asrama
            </p>
          </div>

          {/* Tab Filter Periode */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { key: '7d', label: '7 Hari Terakhir' },
              { key: '14d', label: '14 Hari' },
              { key: '30d', label: '30 Hari' }
            ].map((p) => {
              const active = filterPeriod === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setFilterPeriod(p.key)}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface-l2)',
                    color: active ? '#FFFFFF' : '#000000',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Interactive Trend Chart */}
        {loading ? (
          <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-neutral)' }}>
            Memuat grafik tren kehadiran...
          </div>
        ) : trendPoints.length === 0 ? (
          <div style={{ height: `${chartHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-neutral)' }}>
            Belum ada rekaman presensi pada rentang periode ini.
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: '580px', display: 'block' }}
            >
              <defs>
                <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1DB954" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#1DB954" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines Horisontal: 0%, 25%, 50%, 75%, 100% */}
              {[0, 25, 50, 75, 100].map((level) => {
                const y = chartHeight - paddingY - (level / 100) * (chartHeight - paddingY * 2);
                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="var(--color-neutral)"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {level}%
                    </text>
                  </g>
                );
              })}

              {/* Area Shading */}
              <path d={areaD} fill="url(#trendAreaGradient)" />

              {/* Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#1DB954"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {trendPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredTrendPoint?.tanggal === pt.tanggal ? 6 : 4}
                    fill={hoveredTrendPoint?.tanggal === pt.tanggal ? '#1ED760' : '#1DB954'}
                    stroke="#121212"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.2s ease' }}
                    onMouseEnter={() => setHoveredTrendPoint(pt)}
                    onMouseLeave={() => setHoveredTrendPoint(null)}
                  />
                  {/* Label Tanggal Bawah */}
                  <text
                    x={pt.x}
                    y={chartHeight - 8}
                    fill="var(--color-neutral)"
                    fontSize="11"
                    textAnchor="middle"
                    fontFamily="DM Sans, sans-serif"
                  >
                    {pt.hari} {pt.formatted_tanggal}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Popup */}
            {hoveredTrendPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '24px',
                  backgroundColor: 'var(--color-surface-l2)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '12px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  {hoveredTrendPoint.hari}, {hoveredTrendPoint.tanggal}
                </div>
                <div style={{ color: 'var(--color-primary)', fontWeight: '800', fontSize: '15px' }}>
                  {hoveredTrendPoint.persentase_kehadiran}% Kehadiran
                </div>
                <div style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
                  Total Hadir: {hoveredTrendPoint.hadir} • Terlambat: {hoveredTrendPoint.terlambat} • Izin: {hoveredTrendPoint.izin}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Statistik Kehadiran Berdasarkan Sesi Subuh & Malam (A.5 & Ketentuan C) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* SESI SUBUH */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sun size={24} color="var(--color-warning)" />
              <div>
                <h3 className="text-card-title" style={{ fontSize: '16px' }}>Sesi Subuh</h3>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  04.00 - 06.00 WIB
                </span>
              </div>
            </div>
            <Badge variant={getSessionBadgeVariant(sessionSubuh.status_sesi)} size="sm">
              {getSessionBadgeLabel(sessionSubuh.status_sesi)}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-primary)' }}>
              {sessionSubuh.persentase_kehadiran}%
            </span>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              Tingkat Kehadiran
            </span>
          </div>

          {/* Breakdown Sesi Subuh */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Hadir Tepat Waktu:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{sessionSubuh.hadir} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Terlambat:</span>
              <strong style={{ color: 'var(--color-warning)' }}>{sessionSubuh.terlambat} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Izin Disetujui:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{sessionSubuh.izin} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Alpa / Tidak Hadir:</span>
              <strong style={{ color: sessionSubuh.alpa > 0 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                {sessionSubuh.alpa} Orang
              </strong>
            </div>
            {sessionSubuh.belum_presensi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
                <span>Belum Presensi (Sesi Berjalan):</span>
                <strong>{sessionSubuh.belum_presensi} Orang</strong>
              </div>
            )}
          </div>
        </Card>

        {/* SESI MALAM */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Moon size={24} color="#8A99AD" />
              <div>
                <h3 className="text-card-title" style={{ fontSize: '16px' }}>Sesi Malam</h3>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  18.00 - 20.30 WIB
                </span>
              </div>
            </div>
            <Badge variant={getSessionBadgeVariant(sessionMalam.status_sesi)} size="sm">
              {getSessionBadgeLabel(sessionMalam.status_sesi)}
            </Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-primary)' }}>
              {sessionMalam.persentase_kehadiran}%
            </span>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              Tingkat Kehadiran
            </span>
          </div>

          {/* Breakdown Sesi Malam */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Hadir Tepat Waktu:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{sessionMalam.hadir} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Terlambat:</span>
              <strong style={{ color: 'var(--color-warning)' }}>{sessionMalam.terlambat} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Izin Disetujui:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>{sessionMalam.izin} Orang</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-neutral)' }}>Alpa / Tidak Hadir:</span>
              <strong style={{ color: sessionMalam.alpa > 0 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                {sessionMalam.alpa} Orang
              </strong>
            </div>
            {sessionMalam.belum_presensi > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
                <span>Belum Presensi (Sesi Berjalan):</span>
                <strong>{sessionMalam.belum_presensi} Orang</strong>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 5. Distribusi Status Kehadiran (A.6) */}
      <Card hoverable={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 className="text-section-title" style={{ fontSize: '18px' }}>
              Distribusi Status Kehadiran
            </h2>
            <p className="text-body" style={{ fontSize: '13px', marginTop: '2px', color: 'var(--color-neutral)' }}>
              Proporsi kehadiran pada tanggal: <strong>{filterDate}</strong> (Total: {distribution.total_evaluated} presensi terevaluasi)
            </p>
          </div>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div style={{
          width: '100%',
          height: '24px',
          backgroundColor: 'var(--color-surface-l2)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '20px'
        }}>
          {distribution.persentase.hadir > 0 && (
            <div
              title={`Hadir: ${distribution.persentase.hadir}%`}
              style={{
                width: `${distribution.persentase.hadir}%`,
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.4s ease'
              }}
            />
          )}
          {distribution.persentase.terlambat > 0 && (
            <div
              title={`Terlambat: ${distribution.persentase.terlambat}%`}
              style={{
                width: `${distribution.persentase.terlambat}%`,
                backgroundColor: 'var(--color-warning)',
                transition: 'width 0.4s ease'
              }}
            />
          )}
          {distribution.persentase.izin > 0 && (
            <div
              title={`Izin: ${distribution.persentase.izin}%`}
              style={{
                width: `${distribution.persentase.izin}%`,
                backgroundColor: '#3B82F6',
                transition: 'width 0.4s ease'
              }}
            />
          )}
          {distribution.persentase.alpa > 0 && (
            <div
              title={`Alpa: ${distribution.persentase.alpa}%`}
              style={{
                width: `${distribution.persentase.alpa}%`,
                backgroundColor: 'var(--color-error)',
                transition: 'width 0.4s ease'
              }}
            />
          )}
        </div>

        {/* Distribution Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-l2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
              <span className="text-label" style={{ color: 'var(--color-primary)' }}>HADIR</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-primary)' }}>
              {distribution.hadir}
            </div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {distribution.persentase.hadir}% dari total
            </span>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-l2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }} />
              <span className="text-label" style={{ color: 'var(--color-warning)' }}>TERLAMBAT</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-primary)' }}>
              {distribution.terlambat}
            </div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {distribution.persentase.terlambat}% dari total
            </span>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-l2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3B82F6' }} />
              <span className="text-label" style={{ color: '#3B82F6' }}>IZIN</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-primary)' }}>
              {distribution.izin}
            </div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {distribution.persentase.izin}% dari total
            </span>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--color-surface-l2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-error)' }} />
              <span className="text-label" style={{ color: 'var(--color-error)' }}>ALPA</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-primary)' }}>
              {distribution.alpa}
            </div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {distribution.persentase.alpa}% dari total
            </span>
          </div>
        </div>
      </Card>

      {/* 6. Navigasi Cepat Pengelolaan Sistem */}
      <div>
        <h2 className="text-section-title" style={{ fontSize: '18px', marginBottom: '14px' }}>
          Pusat Akses & Tata Kelola
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Link to="/admin/users" style={{ textDecoration: 'none' }}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Users size={26} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
                <h3 className="text-card-title">Kelola Pengguna</h3>
                <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Tambah, perbarui, dan atur akun penghuni maupun fasilitator.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '700', marginTop: '14px' }}>
                Buka Menu <ChevronRight size={14} />
              </div>
            </Card>
          </Link>

          <Link to="/admin/gedungs" style={{ textDecoration: 'none' }}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Building size={26} color="var(--color-warning)" style={{ marginBottom: '12px' }} />
                <h3 className="text-card-title">Kelola Gedung</h3>
                <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Atur master data gedung asrama dan penanggung jawab fasil.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-warning)', fontSize: '12px', fontWeight: '700', marginTop: '14px' }}>
                Buka Menu <ChevronRight size={14} />
              </div>
            </Card>
          </Link>

          <Link to="/admin/kamars" style={{ textDecoration: 'none' }}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <DoorOpen size={26} color="var(--color-text-primary)" style={{ marginBottom: '12px' }} />
                <h3 className="text-card-title">Kelola Kamar</h3>
                <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Atur kapasitas kamar, nomor kamar, dan plotting mahasiswa.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontSize: '12px', fontWeight: '700', marginTop: '14px' }}>
                Buka Menu <ChevronRight size={14} />
              </div>
            </Card>
          </Link>

          <Link to="/admin/pengaturan" style={{ textDecoration: 'none' }}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <Settings size={26} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
                <h3 className="text-card-title">Pengaturan Jadwal Presensi</h3>
                <p className="text-body" style={{ fontSize: '13px', marginTop: '4px' }}>
                  Konfigurasi jadwal operasional presensi sesi Subuh dan sesi Malam.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '700', marginTop: '14px' }}>
                Buka Menu <ChevronRight size={14} />
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
