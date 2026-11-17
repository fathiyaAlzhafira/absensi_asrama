import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { CalendarDays, ChevronLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const kategoriStatus = (status) => {
  const nilai = String(status || '').toLowerCase();
  if (nilai === 'izin') return 'izin';
  if (nilai === 'alpa' || nilai === 'alfa' || nilai === 'alpha') return 'alpa';
  if (nilai === 'terlambat') return 'terlambat';
  if (nilai === 'hadir') return 'hadir';
  return 'lainnya';
};

const variantStatus = (status) => {
  const kategori = kategoriStatus(status);
  if (kategori === 'hadir') return 'success';
  if (kategori === 'izin' || kategori === 'terlambat') return 'warning';
  if (kategori === 'alpa') return 'error';
  return 'neutral';
};

export default function RiwayatPresensi() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [riwayat, setRiwayat] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (selectedPhoto) URL.revokeObjectURL(selectedPhoto);
  }, [selectedPhoto]);

  useEffect(() => {
    let active = true;
    api.getMyPresensi()
      .then((res) => {
        if (!active) return;
        if (Array.isArray(res?.data)) {
          setRiwayat(res.data);
        } else {
          setError('Format data riwayat tidak sesuai.');
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Riwayat presensi gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const riwayatTersaring = useMemo(() => riwayat.filter((record) => {
    const tanggal = String(record.tanggal || '').slice(0, 10);
    if (filterMode === 'month' && filterMonth && !tanggal.startsWith(filterMonth)) return false;
    if (filterMode === 'range' && tanggalMulai && tanggal < tanggalMulai) return false;
    if (filterMode === 'range' && tanggalSelesai && tanggal > tanggalSelesai) return false;
    return true;
  }), [riwayat, filterMode, filterMonth, tanggalMulai, tanggalSelesai]);

  const statistik = useMemo(() => riwayatTersaring.reduce((total, record) => {
    const kategori = kategoriStatus(record.status);
    if (kategori in total) total[kategori] += 1;
    return total;
  }, { hadir: 0, izin: 0, alpa: 0, terlambat: 0 }), [riwayatTersaring]);

  const rentangTidakValid = filterMode === 'range' && tanggalMulai && tanggalSelesai && tanggalMulai > tanggalSelesai;

  const resetFilter = () => {
    setFilterMode('all');
    setFilterMonth('');
    setTanggalMulai('');
    setTanggalSelesai('');
  };

  const openPhoto = async (id) => {
    setPhotoError('');
    setPhotoLoading(true);
    try {
      setSelectedPhoto(await api.getPresensiPhoto(id));
    } catch (requestError) {
      setPhotoError(requestError.message || 'Foto presensi gagal dimuat.');
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <div className="resident-page resident-history-page">
      <div className="resident-page-heading" style={{ marginBottom: '20px' }}>
        <div className="resident-subpage-banner">
          <Link to="/penghuni/dashboard" className="resident-subpage-back" aria-label="Kembali ke beranda" title="Kembali ke beranda">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="resident-subpage-title">Riwayat Absensi</h1>
        </div>
        <p className="text-body resident-subpage-description">Ringkasan dan detail kehadiran Anda di asrama.</p>
      </div>

      <div className="resident-history-stats">
        <Card hoverable={false} className="resident-history-stat">
          <span className="resident-history-stat-icon hadir"><CalendarDays size={18} /></span>
          <span className="resident-history-stat-label">Hadir</span>
          <strong>{statistik.hadir}</strong>
        </Card>
        <Card hoverable={false} className="resident-history-stat">
          <span className="resident-history-stat-icon izin"><CalendarDays size={18} /></span>
          <span className="resident-history-stat-label">Izin</span>
          <strong>{statistik.izin}</strong>
        </Card>
        <Card hoverable={false} className="resident-history-stat">
          <span className="resident-history-stat-icon alpa"><CalendarDays size={18} /></span>
          <span className="resident-history-stat-label">Alfa</span>
          <strong>{statistik.alpa}</strong>
        </Card>
        <Card hoverable={false} className="resident-history-stat">
          <span className="resident-history-stat-icon terlambat"><CalendarDays size={18} /></span>
          <span className="resident-history-stat-label">Terlambat</span>
          <strong>{statistik.terlambat}</strong>
        </Card>
      </div>

      <Card hoverable={false} className="resident-history-filter-card">
        <div className="resident-history-filter-heading">
          <div className="resident-dashboard-section-icon"><Filter size={18} /></div>
          <div>
            <h2 className="text-card-title">Filter riwayat</h2>
            <p className="text-small">Pilih periode atau rentang tanggal.</p>
          </div>
        </div>
        <div className="resident-history-filter-controls">
          <label className="resident-filter-mode">
            <span>Jenis filter</span>
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
          <Button size="md" variant="secondary" className="resident-action-button" onClick={resetFilter}>
            Reset
          </Button>
        </div>
      </Card>

      {rentangTidakValid && (
        <p className="resident-history-error">Tanggal awal tidak boleh melewati tanggal akhir.</p>
      )}
      {error && <p className="resident-history-error">{error}</p>}

      <Card hoverable={false} className="resident-history-desktop" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Tanggal</th>
                <th style={{ padding: '16px' }}>Sesi</th>
                <th style={{ padding: '16px' }}>Waktu Absen</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Koordinat GPS</th>
                <th style={{ padding: '16px' }}>Keterangan</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Foto Selfie</th>
              </tr>
            </thead>
            <tbody>
              {riwayatTersaring.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{row.tanggal}</td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={row.sesi === 'subuh' ? 'default' : 'warning'} size="sm">{row.sesi?.toUpperCase() || '-'}</Badge>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>
                    {row.waktu && row.waktu !== '00:00:00' ? row.waktu : '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={variantStatus(row.status)}>{row.status || 'Tidak diketahui'}</Badge>
                  </td>
                  <td style={{ padding: '16px', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--color-neutral)' }}>
                    {row.lat && row.long ? `${row.lat}, ${row.long}` : '-'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{row.keterangan || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {row.foto_wajah ? (
                      <Button size="md" variant="ghost" className="resident-action-button" disabled={photoLoading} onClick={() => openPhoto(row.id)}>
                        {photoLoading ? 'Memuat...' : 'Lihat Foto'}
                      </Button>
                    ) : <span style={{ color: 'var(--color-neutral)' }}>-</span>}
                  </td>
                </tr>
              ))}
              {!loading && !error && !rentangTidakValid && riwayatTersaring.length === 0 && (
                <tr><td colSpan="7" className="resident-history-table-empty">Tidak ada data pada periode ini.</td></tr>
              )}
              {loading && <tr><td colSpan="7" className="resident-history-table-empty">Memuat riwayat...</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="resident-history-mobile">
        {riwayatTersaring.map((row) => (
          <Card key={row.id} hoverable={false} className="resident-history-card">
            <div className="resident-history-card-heading">
              <div>
                <strong>{row.tanggal}</strong>
                <span>{row.waktu && row.waktu !== '00:00:00' ? row.waktu : 'Tidak ada waktu'}</span>
              </div>
              <Badge variant={row.sesi === 'subuh' ? 'default' : 'warning'} size="sm">{row.sesi?.toUpperCase() || '-'}</Badge>
            </div>
            <div className="resident-history-card-details">
              <div><span>Status</span><Badge variant={variantStatus(row.status)}>{row.status || 'Tidak diketahui'}</Badge></div>
              <div><span>Lokasi</span><strong>{row.lat && row.long ? `${row.lat}, ${row.long}` : 'Tidak tersedia'}</strong></div>
              <div><span>Keterangan</span><strong>{row.keterangan || '-'}</strong></div>
            </div>
            {row.foto_wajah && (
              <Button size="md" variant="secondary" className="resident-action-button" disabled={photoLoading} onClick={() => openPhoto(row.id)}>
                {photoLoading ? 'Memuat...' : 'Lihat Foto'}
              </Button>
            )}
          </Card>
        ))}
        {!loading && !error && !rentangTidakValid && riwayatTersaring.length === 0 && (
          <Card hoverable={false} className="resident-history-empty-card">Tidak ada data pada periode ini.</Card>
        )}
        {loading && <Card hoverable={false} className="resident-history-empty-card">Memuat riwayat...</Card>}
      </div>

      {selectedPhoto && (
        <div className="resident-photo-modal">
          <div className="resident-photo-dialog">
            <div className="resident-photo-header">
              <h2 className="text-card-title">Foto Selfie Presensi</h2>
            </div>
            <img src={selectedPhoto} alt="Foto selfie presensi" />
            <Button size="md" variant="secondary" className="resident-action-button" onClick={() => setSelectedPhoto(null)}>Tutup</Button>
          </div>
        </div>
      )}
      {photoError && <p className="resident-dashboard-error" role="alert">{photoError}</p>}
    </div>
  );
}
