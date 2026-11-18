import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ChevronLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const kategoriStatus = (status) => {
  const nilai = String(status || '').toLowerCase();
  if (nilai === 'izin') return 'izin';
  if (nilai === 'alpa' || nilai === 'alfa' || nilai === 'alpha') return 'alpa';
  if (nilai === 'hadir' || nilai === 'terlambat') return 'hadir';
  return 'lainnya';
};

const variantStatus = (status) => {
  const kategori = kategoriStatus(status);
  if (kategori === 'hadir') return 'success';
  if (kategori === 'izin') return 'warning';
  if (kategori === 'alpa') return 'error';
  return 'neutral';
};

const labelStatus = (status) => {
  const kategori = kategoriStatus(status);
  if (kategori === 'alpa') return 'alfa';
  if (kategori === 'izin') return 'izin';
  if (kategori === 'hadir') return 'hadir';
  return status || 'Tercatat';
};

const formatTanggal = (tanggal) => {
  if (!tanggal) return '-';
  const date = new Date(`${String(tanggal).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(tanggal);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatWaktu = (waktu) => {
  if (!waktu || waktu === '00:00:00') return '--:--';
  return String(waktu).slice(0, 5);
};

export default function RiwayatPresensi() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoLoadingId, setPhotoLoadingId] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [riwayat, setRiwayat] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [filterSesi, setFilterSesi] = useState('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (selectedPhoto && selectedPhoto.startsWith('blob:')) URL.revokeObjectURL(selectedPhoto);
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
    const sesi = String(record.sesi || '').toLowerCase();
    if (filterSesi !== 'all' && sesi !== filterSesi) return false;
    if (filterMode === 'month' && filterMonth && !tanggal.startsWith(filterMonth)) return false;
    if (filterMode === 'range' && tanggalMulai && tanggal < tanggalMulai) return false;
    if (filterMode === 'range' && tanggalSelesai && tanggal > tanggalSelesai) return false;
    return true;
  }), [riwayat, filterSesi, filterMode, filterMonth, tanggalMulai, tanggalSelesai]);

  const statistik = useMemo(() => riwayatTersaring.reduce((total, record) => {
    const kategori = kategoriStatus(record.status);
    if (kategori in total) total[kategori] += 1;
    return total;
  }, { hadir: 0, izin: 0, alpa: 0 }), [riwayatTersaring]);

  const rentangTidakValid = filterMode === 'range' && tanggalMulai && tanggalSelesai && tanggalMulai > tanggalSelesai;

  const resetFilter = () => {
    setFilterMode('all');
    setFilterSesi('all');
    setFilterMonth('');
    setTanggalMulai('');
    setTanggalSelesai('');
  };

  const openPhoto = async (row) => {
    setPhotoError('');
    const rawPath = String(row.foto_wajah || '');
    // Jika data contoh lama memiliki path langsung di webroot (uploads/...)
    if (rawPath.includes('/')) {
      setSelectedPhoto(rawPath.startsWith('/') ? rawPath : `/${rawPath}`);
      return;
    }
    setPhotoLoadingId(row.id);
    try {
      setSelectedPhoto(await api.getPresensiPhoto(row.id));
    } catch (requestError) {
      setPhotoError(requestError.message || 'Foto presensi gagal dimuat.');
    } finally {
      setPhotoLoadingId(null);
    }
  };

  return (
    <div className="resident-page resident-history-page">
      <div className="resident-permission-heading">
        <div className="resident-page-heading">
          <div className="resident-subpage-banner">
            <Link to="/penghuni/dashboard" className="resident-subpage-back" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ChevronLeft size={22} />
            </Link>
            <h1 className="resident-subpage-title">Riwayat Absensi</h1>
          </div>
        </div>
      </div>

      {/* Ringkasan Statistik & Filter dalam Card yang Seragam */}
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
            <Button size="md" variant="secondary" onClick={resetFilter} style={{ height: '42px', textTransform: 'none', letterSpacing: 0 }}>
              Reset Filter
            </Button>
          )}
        </div>
      </Card>

      {rentangTidakValid && (
        <p className="resident-history-error">Tanggal awal tidak boleh melewati tanggal akhir.</p>
      )}
      {error && <p className="resident-history-error">{error}</p>}
      {photoError && <p className="resident-history-error" role="alert">{photoError}</p>}

      {/* Tabel Desktop yang Bersih */}
      <Card hoverable={false} className="resident-history-desktop" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="resident-clean-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Sesi</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Lokasi</th>
                <th>Keterangan</th>
                <th style={{ textAlign: 'right' }}>Foto Bukti</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="resident-history-table-empty">Memuat riwayat presensi...</td>
                </tr>
              ) : !error && !rentangTidakValid && riwayatTersaring.length === 0 ? (
                <tr>
                  <td colSpan="7" className="resident-history-table-empty">Tidak ada data presensi pada periode ini.</td>
                </tr>
              ) : (
                riwayatTersaring.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                      {formatTanggal(row.tanggal)}
                    </td>
                    <td>
                      <Badge variant={row.sesi === 'subuh' ? 'neutral' : 'warning'} size="sm">
                        {row.sesi ? `Sesi ${row.sesi}` : '-'}
                      </Badge>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-primary)' }}>
                      {row.waktu && row.waktu !== '00:00:00' ? `${formatWaktu(row.waktu)} WIB` : '-'}
                    </td>
                    <td>
                      <Badge variant={variantStatus(row.status)} size="sm">
                        {labelStatus(row.status)}
                      </Badge>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                      {row.lat && row.long ? (
                        <span title={`${row.lat}, ${row.long}`}>Terverifikasi di area gedung</span>
                      ) : kategoriStatus(row.status) === 'izin' ? (
                        'Izin Disetujui'
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {row.keterangan || 'Presensi di asrama'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row.foto_wajah ? (
                        <button
                          type="button"
                          className="admin-secondary-button"
                          style={{ minHeight: '34px', padding: '5px 12px', fontSize: '12px' }}
                          disabled={photoLoadingId === row.id}
                          onClick={() => openPhoto(row)}
                        >
                          {photoLoadingId === row.id ? 'Memuat...' : 'Lihat Foto'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-neutral)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daftar Kartu Mobile yang Bersih */}
      <div className="resident-history-mobile">
        {loading ? (
          <Card hoverable={false} className="resident-history-empty-card">Memuat riwayat presensi...</Card>
        ) : !error && !rentangTidakValid && riwayatTersaring.length === 0 ? (
          <Card hoverable={false} className="resident-history-empty-card">Tidak ada data presensi pada periode ini.</Card>
        ) : (
          riwayatTersaring.map((row) => (
            <Card key={row.id} hoverable={false} className="resident-history-card">
              <div className="resident-history-card-heading">
                <div>
                  <strong>{formatTanggal(row.tanggal)}</strong>
                  <span>Sesi {row.sesi ? row.sesi.charAt(0).toUpperCase() + row.sesi.slice(1) : '-'} · {formatWaktu(row.waktu)} WIB</span>
                </div>
                <Badge variant={variantStatus(row.status)} size="sm">{labelStatus(row.status)}</Badge>
              </div>
              <div className="resident-history-card-details">
                <div>
                  <span>Lokasi</span>
                  <strong>{row.lat && row.long ? 'Terverifikasi di area gedung' : 'Tidak tersedia'}</strong>
                </div>
                <div>
                  <span>Keterangan</span>
                  <strong>{row.keterangan || 'Presensi di asrama'}</strong>
                </div>
              </div>
              {row.foto_wajah && (
                <button
                  type="button"
                  className="admin-secondary-button"
                  style={{ width: '100%' }}
                  disabled={photoLoadingId === row.id}
                  onClick={() => openPhoto(row)}
                >
                  {photoLoadingId === row.id ? 'Memuat...' : 'Lihat Foto Bukti'}
                </button>
              )}
            </Card>
          ))
        )}
      </div>

      {selectedPhoto && (
        <div
          className="resident-photo-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPhoto(null);
          }}
        >
          <div className="resident-photo-dialog">
            <div className="resident-photo-header">
              <h2 className="text-card-title">Foto Bukti Presensi</h2>
              <button
                type="button"
                className="resident-camera-close"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Tutup foto"
              >
                <X size={18} />
              </button>
            </div>
            <img src={selectedPhoto} alt="Foto selfie presensi" />
            <Button size="md" variant="secondary" onClick={() => setSelectedPhoto(null)} style={{ width: '100%', textTransform: 'none', letterSpacing: 0 }}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
