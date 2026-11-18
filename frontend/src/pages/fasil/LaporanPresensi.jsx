import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { api } from '../../services/api';
import {
  FileText,
  Printer,
  Filter,
  RefreshCw,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Search,
  AlertCircle,
  Percent
} from 'lucide-react';

// Mengambil tanggal hari ini format YYYY-MM-DD
const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mengambil tanggal awal bulan berjalan format YYYY-MM-DD
const getFirstDayOfMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

// Format tanggal tampilan Indonesia (contoh: 18 Nov 2026)
const formatTanggalIndo = (str) => {
  if (!str) return '-';
  const parts = str.split('-');
  if (parts.length !== 3) return str;
  const [y, m, d] = parts;
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(d, 10)} ${bulan[parseInt(m, 10) - 1]} ${y}`;
};

const statusConfig = {
  hadir: { label: 'Hadir', variant: 'success' },
  terlambat: { label: 'Terlambat', variant: 'warning' },
  izin: { label: 'Izin', variant: 'default' },
  alpa: { label: 'Alpa / Tidak Hadir', variant: 'error' }
};

const inputStyle = {
  width: '100%',
  height: '42px',
  padding: '0 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--color-surface-l2)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  fontSize: '13px',
  boxSizing: 'border-box'
};

export default function LaporanPresensi() {
  const [laporanData, setLaporanData] = useState([]);
  const [ringkasan, setRingkasan] = useState({
    total_presensi: 0,
    jumlah_hadir: 0,
    jumlah_terlambat: 0,
    total_hadir: 0,
    jumlah_izin: 0,
    jumlah_tidak_hadir: 0,
    persentase_kehadiran: 0.0
  });
  const [gedungInfo, setGedungInfo] = useState(null);
  const [daftarKamarServer, setDaftarKamarServer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State Filter
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [sesi, setSesi] = useState('Semua');
  const [kamar, setKamar] = useState('Semua');
  const [pencarian, setPencarian] = useState('');

  // Mengambil data laporan dari API
  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (sesi !== 'Semua') params.sesi = sesi;
      if (kamar !== 'Semua') params.kamar = kamar;
      if (pencarian.trim()) params.search = pencarian.trim();

      const res = await api.getLaporanPresensi(params);
      if (res && res.status === 'success') {
        const payload = res.data || {};
        setLaporanData(payload.data || []);
        if (payload.ringkasan) {
          setRingkasan(payload.ringkasan);
        }
        if (payload.gedung) {
          setGedungInfo(payload.gedung);
        }
        if (Array.isArray(payload.kamars) && payload.kamars.length > 0) {
          setDaftarKamarServer(payload.kamars.map((k) => k.nomor_kamar));
        }
      } else {
        throw new Error(res?.message || 'Gagal memuat data laporan presensi.');
      }
    } catch (err) {
      console.error('Fetch laporan presensi error:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, sesi, kamar, pencarian]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // Daftar kamar unik
  const daftarKamar = useMemo(() => {
    const kamarsFromData = laporanData.map((item) => item.kamar).filter(Boolean);
    const combined = [...new Set([...daftarKamarServer, ...kamarsFromData])].filter(
      (k) => k !== '-'
    );
    return combined.sort();
  }, [daftarKamarServer, laporanData]);

  // Reset filter
  const handleResetFilter = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getToday());
    setSesi('Semua');
    setKamar('Semua');
    setPencarian('');
  };

  // Cetak laporan menggunakan window.print()
  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.alpa;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  return (
    <div>
      {/* CSS Khusus Print */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print,
          aside,
          header,
          nav,
          .green-deck-badge {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11pt !important;
            color: #000000 !important;
          }
          th, td {
            border: 1px solid #333333 !important;
            padding: 6px 8px !important;
            color: #000000 !important;
          }
          th {
            background-color: #f2f2f2 !important;
          }
          .card-stat-print {
            border: 1px solid #666666 !important;
            padding: 8px !important;
            color: #000000 !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* KOP RESMI KHUSUS CETAK */}
      <div className="print-only" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
          UNIVERSITAS ANDALAS
        </h2>
        <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 4px 0' }}>
          REKAPITULASI LAPORAN PRESENSI MAHASISWA ASRAMA
        </h3>
        <p style={{ fontSize: '11pt', margin: '0 0 2px 0' }}>
          Gedung: <strong>{gedungInfo ? gedungInfo.nama : 'Gedung Binaan'}</strong> | Sesi: <strong>{sesi}</strong> | Kamar: <strong>{kamar}</strong>
        </p>
        <p style={{ fontSize: '10pt', margin: '0 0 10px 0', color: '#555' }}>
          Periode: {formatTanggalIndo(startDate)} s/d {formatTanggalIndo(endDate)} | Dicetak pada: {new Date().toLocaleString('id-ID')}
        </p>
        <hr style={{ borderTop: '2px solid #000', margin: '10px 0 16px 0' }} />

        {/* Ringkasan Statistik untuk Cetak */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px', textAlign: 'center' }}>
          <div className="card-stat-print">
            <div style={{ fontSize: '9pt' }}>Total Presensi</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{ringkasan.total_presensi}</div>
          </div>
          <div className="card-stat-print">
            <div style={{ fontSize: '9pt' }}>Hadir Tepat Waktu</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{ringkasan.jumlah_hadir}</div>
          </div>
          <div className="card-stat-print">
            <div style={{ fontSize: '9pt' }}>Terlambat</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{ringkasan.jumlah_terlambat}</div>
          </div>
          <div className="card-stat-print">
            <div style={{ fontSize: '9pt' }}>Izin</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{ringkasan.jumlah_izin}</div>
          </div>
          <div className="card-stat-print">
            <div style={{ fontSize: '9pt' }}>Kehadiran (%)</div>
            <div style={{ fontSize: '12pt', fontWeight: 'bold' }}>{ringkasan.persentase_kehadiran}%</div>
          </div>
        </div>
      </div>

      {/* Header Halaman (Hanya Tampil di Layar) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Rekap & Laporan Presensi</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>
            Rekapitulasi catatan presensi kehadiran penghuni gedung binaan Anda
          </p>
          {gedungInfo && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                padding: '4px 12px',
                backgroundColor: 'var(--color-surface-l2)',
                borderRadius: '16px',
                fontSize: '13px',
                color: 'var(--color-primary)',
                fontWeight: '600'
              }}
            >
              <Building size={16} />
              <span>Gedung Binaan: {gedungInfo.nama}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchLaporan}
            disabled={loading}
          >
            {loading ? 'Memperbarui...' : 'Segarkan'}
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Printer}
            onClick={handlePrint}
            disabled={loading || laporanData.length === 0}
          >
            Cetak Laporan
          </Button>
        </div>
      </div>

      {/* Pesan Kesalahan / Error State */}
      {error && (
        <Card
          className="no-print"
          style={{
            borderLeft: '4px solid var(--color-error)',
            marginBottom: '24px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--color-error)" />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--color-error)' }}>Gagal Memuat Laporan</strong>
              <p className="text-body" style={{ fontSize: '13px', marginTop: '2px' }}>
                {error}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchLaporan}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Parameters (no-print) */}
      <Card hoverable={false} className="no-print" style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label className="text-label">Dari Tanggal</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-label">Sampai Tanggal</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-label">Pilih Sesi</label>
            <select
              value={sesi}
              onChange={(e) => setSesi(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              <option value="Semua">Semua Sesi</option>
              <option value="Subuh">Subuh</option>
              <option value="Malam">Malam</option>
            </select>
          </div>

          <div>
            <label className="text-label">Pilih Kamar</label>
            <select
              value={kamar}
              onChange={(e) => setKamar(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              <option value="Semua">Semua Kamar</option>
              {daftarKamar.map((k) => (
                <option key={k} value={k}>
                  Kamar {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-label">Cari Mahasiswa</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '13px',
                  color: 'var(--color-neutral)'
                }}
              />
              <input
                type="text"
                placeholder="Nama atau NIM..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="primary"
              size="md"
              icon={Filter}
              onClick={fetchLaporan}
              disabled={loading}
              style={{ flex: 1, height: '42px' }}
            >
              Filter
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleResetFilter}
              style={{ height: '42px' }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Ringkasan Statistik Laporan (no-print) */}
      <div
        className="no-print"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">TOTAL PRESENSI</span>
            <Users color="var(--color-primary)" size={20} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '8px' }}>
            {loading ? '...' : ringkasan.total_presensi}
          </div>
          <span className="text-small">Rekap catatan kehadiran</span>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">HADIR</span>
            <CheckCircle color="var(--color-success)" size={20} />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--color-success)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : ringkasan.jumlah_hadir}
          </div>
          <span className="text-small">
            +{ringkasan.jumlah_terlambat} Terlambat
          </span>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">IZIN</span>
            <Clock color="var(--color-warning)" size={20} />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--color-warning)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : ringkasan.jumlah_izin}
          </div>
          <span className="text-small">Izin resmi disetujui</span>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">TIDAK HADIR (ALPA)</span>
            <AlertTriangle color="var(--color-error)" size={20} />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--color-error)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : ringkasan.jumlah_tidak_hadir}
          </div>
          <span className="text-small">Tanpa keterangan</span>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">PERSENTASE</span>
            <Percent color="var(--color-primary)" size={20} />
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: 'var(--color-primary)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : `${ringkasan.persentase_kehadiran}%`}
          </div>
          <span className="text-small">Tingkat kehadiran</span>
        </Card>
      </div>

      {/* Tabel Laporan Presensi */}
      <Card hoverable={false} className="print-container" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          className="no-print"
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <h2 className="text-section-title">Data Rekapitulasi Presensi</h2>
            <p className="text-small">
              Periode: {formatTanggalIndo(startDate)} s/d {formatTanggalIndo(endDate)} ({laporanData.length} data)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant="neutral">
              Sesi: {sesi}
            </Badge>
            <Badge variant="neutral">
              Kamar: {kamar}
            </Badge>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-surface-l2)',
                  color: 'var(--color-neutral)',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <th style={{ padding: '14px 16px', width: '48px' }}>No</th>
                <th style={{ padding: '14px 16px' }}>Mahasiswa</th>
                <th style={{ padding: '14px 16px' }}>NIM</th>
                <th style={{ padding: '14px 16px' }}>Kamar</th>
                <th style={{ padding: '14px 16px' }}>Tanggal</th>
                <th style={{ padding: '14px 16px' }}>Sesi</th>
                <th style={{ padding: '14px 16px' }}>Jam Absen</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Keterangan</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: '50px 20px',
                      textAlign: 'center',
                      color: 'var(--color-neutral)'
                    }}
                  >
                    <RefreshCw
                      size={28}
                      className="spin"
                      style={{
                        marginBottom: '10px',
                        animation: 'spin 1.5s linear infinite'
                      }}
                    />
                    <p>Memuat data rekapitulasi presensi...</p>
                  </td>
                </tr>
              ) : laporanData.length > 0 ? (
                laporanData.map((row, index) => (
                  <tr
                    key={row.id || index}
                    style={{
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>
                      {index + 1}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {row.nama}
                      </strong>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>
                      {row.nim}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant="neutral" size="sm">
                        {row.kamar || '-'}
                      </Badge>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {row.tanggal}
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>
                      {row.sesi}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>
                      {row.waktu}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)', fontSize: '12px' }}>
                      {row.keterangan || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    style={{
                      padding: '50px 20px',
                      textAlign: 'center',
                      color: 'var(--color-neutral)'
                    }}
                  >
                    <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Tidak ada catatan presensi dalam rentang periode yang dipilih
                    </p>
                    <span className="text-small">
                      Silakan sesuaikan tanggal mulai, tanggal akhir, sesi, atau filter kamar.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Kolom Tanda Tangan Khusus Cetak */}
      <div className="print-only" style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'center', minWidth: '220px' }}>
          <p style={{ margin: '0 0 60px 0', fontSize: '11pt' }}>
            Padang, {formatTanggalIndo(getToday())}<br />
            Fasilitator Gedung,
          </p>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '11pt' }}>
            ( .................................................. )
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '10pt', color: '#555' }}>
            NIP / ID Fasilitator
          </p>
        </div>
      </div>
    </div>
  );
}
