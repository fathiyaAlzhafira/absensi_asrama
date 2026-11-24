import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { api } from '../../services/api';
import {
  Eye,
  Search,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Camera,
  RefreshCw,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';

// Mengambil tanggal hari ini dalam format YYYY-MM-DD
const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const statusConfig = {
  hadir: { label: 'Hadir', variant: 'success' },
  terlambat: { label: 'Terlambat', variant: 'warning' },
  izin: { label: 'Izin', variant: 'default' },
  alpa: { label: 'Alpa', variant: 'error' }
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
  fontSize: '13px'
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  zIndex: 1000,
  backdropFilter: 'blur(3px)'
};

export default function MonitoringPresensi() {
  const [dataPresensi, setDataPresensi] = useState([]);
  const [gedungInfo, setGedungInfo] = useState(null);
  const [daftarKamarServer, setDaftarKamarServer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [tanggal, setTanggal] = useState(getToday());
  const [sesi, setSesi] = useState('Semua');
  const [filterKamar, setFilterKamar] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [pencarian, setPencarian] = useState('');

  // Modal
  const [selectedData, setSelectedData] = useState(null);
  const [modalType, setModalType] = useState(''); // 'detail' | 'lokasi'
  const [fotoError, setFotoError] = useState(false);

  // Mengambil data presensi dari API
  const fetchMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (tanggal) params.tanggal = tanggal;
      if (sesi !== 'Semua') params.sesi = sesi;
      if (filterKamar !== 'Semua') params.kamar = filterKamar;
      if (filterStatus !== 'Semua') params.status = filterStatus;
      if (pencarian.trim()) params.search = pencarian.trim();

      const res = await api.getPresensiMonitoring(params);
      if (res && res.status === 'success') {
        const payload = res.data || {};
        setDataPresensi(payload.data || []);
        if (payload.gedung) {
          setGedungInfo(payload.gedung);
        }
        if (Array.isArray(payload.kamars) && payload.kamars.length > 0) {
          setDaftarKamarServer(payload.kamars.map((k) => k.nomor_kamar));
        }
      } else {
        throw new Error(res?.message || 'Gagal memuat data monitoring presensi.');
      }
    } catch (err) {
      console.error('Fetch monitoring presensi error:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data presensi.');
    } finally {
      setLoading(false);
    }
  }, [tanggal, sesi, filterKamar, filterStatus, pencarian]);

  // Efek memuat data saat filter berubah
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  // Daftar kamar unik (gabungan server & data yang sedang ditampilkan)
  const daftarKamar = useMemo(() => {
    const kamarsFromData = dataPresensi.map((item) => item.kamar).filter(Boolean);
    const combined = [...new Set([...daftarKamarServer, ...kamarsFromData])].filter(
      (k) => k !== '-'
    );
    return combined.sort();
  }, [daftarKamarServer, dataPresensi]);

  // Statistik dihitung dari data presensi yang sedang ditampilkan
  const totalHadir = useMemo(
    () => dataPresensi.filter((item) => item.status === 'hadir').length,
    [dataPresensi]
  );
  const totalTerlambat = useMemo(
    () => dataPresensi.filter((item) => item.status === 'terlambat').length,
    [dataPresensi]
  );
  const totalIzin = useMemo(
    () => dataPresensi.filter((item) => item.status === 'izin').length,
    [dataPresensi]
  );
  const totalAlpa = useMemo(
    () => dataPresensi.filter((item) => item.status === 'alpa').length,
    [dataPresensi]
  );

  const openModal = (type, item) => {
    setSelectedData(item);
    setModalType(type);
    setFotoError(false);
  };

  const closeModal = () => {
    setSelectedData(null);
    setModalType('');
    setFotoError(false);
  };

  // Reset seluruh filter ke kondisi default (hari ini, semua)
  const handleResetFilter = () => {
    setTanggal(getToday());
    setSesi('Semua');
    setFilterKamar('Semua');
    setFilterStatus('Semua');
    setPencarian('');
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.alpa;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div>
      {/* Header Halaman */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1 className="text-page-title">Monitoring Presensi Penghuni</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>
            Pantau seluruh catatan kehadiran mahasiswa di gedung binaan Anda secara real-time
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

        <Button
          variant="secondary"
          size="md"
          icon={RefreshCw}
          onClick={fetchMonitoringData}
          disabled={loading}
        >
          {loading ? 'Memperbarui...' : 'Segarkan Data'}
        </Button>
      </div>

      {/* Pesan Kesalahan / Error State */}
      {error && (
        <Card
          style={{
            borderLeft: '4px solid var(--color-error)',
            marginBottom: '24px',
            backgroundColor: 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--color-error)" />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--color-error)' }}>Gagal Memuat Data</strong>
              <p className="text-body" style={{ fontSize: '13px', marginTop: '2px' }}>
                {error}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchMonitoringData}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Card */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}
        >
          <div>
            <label className="text-label">Tanggal Presensi</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
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
              <option value="Subuh">Subuh (04.00-06.00)</option>
              <option value="Malam">Malam (18.00-20.30)</option>
            </select>
          </div>

          <div>
            <label className="text-label">Pilih Kamar</label>
            <select
              value={filterKamar}
              onChange={(e) => setFilterKamar(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              <option value="Semua">Semua Kamar</option>
              {daftarKamar.map((kamar) => (
                <option key={kamar} value={kamar}>
                  Kamar {kamar}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-label">Pilih Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ ...inputStyle, marginTop: '6px' }}
            >
              <option value="Semua">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="terlambat">Terlambat</option>
              <option value="izin">Izin</option>
              <option value="alpa">Alpa</option>
            </select>
          </div>

          <div>
            <label className="text-label">Pencarian Mahasiswa</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  color: 'var(--color-neutral)'
                }}
              />
              <input
                type="text"
                placeholder="Nama atau NIM..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div>
            <Button
              variant="secondary"
              size="md"
              onClick={handleResetFilter}
              style={{ width: '100%', height: '42px' }}
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Kartu Statistik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">TOTAL DATA</span>
            <Users color="var(--color-primary)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '8px' }}>
            {loading ? '...' : dataPresensi.length}
          </div>
          <span className="text-small">Catatan presensi sesuai filter</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">HADIR</span>
            <CheckCircle color="var(--color-success)" size={20} />
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: '800',
              color: 'var(--color-success)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : totalHadir}
          </div>
          <span className="text-small">Tepat waktu</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">TERLAMBAT</span>
            <Clock color="var(--color-warning)" size={20} />
          </div>
          <div
            style={{
              fontSize: '30px',
              fontWeight: '800',
              color: 'var(--color-warning)',
              marginTop: '8px'
            }}
          >
            {loading ? '...' : totalTerlambat}
          </div>
          <span className="text-small">Melewati batas waktu</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">IZIN / ALPA</span>
            <AlertTriangle color="var(--color-error)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '8px' }}>
            {loading ? '...' : `${totalIzin} / ${totalAlpa}`}
          </div>
          <span className="text-small">Izin / Tidak hadir</span>
        </Card>
      </div>

      {/* Tabel Catatan Presensi */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div
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
            <h2 className="text-section-title">Daftar Catatan Presensi</h2>
            <p className="text-small">
              {loading
                ? 'Sedang menyinkronkan data...'
                : `${dataPresensi.length} data ditemukan`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant="neutral">
              {sesi === 'Semua' ? 'Semua Sesi' : `Sesi ${sesi}`}
            </Badge>
            {tanggal && (
              <Badge variant="neutral">
                {tanggal}
              </Badge>
            )}
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
                <th style={{ padding: '16px' }}>Mahasiswa</th>
                <th style={{ padding: '16px' }}>Kamar</th>
                <th style={{ padding: '16px' }}>Sesi</th>
                <th style={{ padding: '16px' }}>Tanggal</th>
                <th style={{ padding: '16px' }}>Waktu Absen</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Bukti & Lokasi</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
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
                    <p>Memuat data presensi...</p>
                  </td>
                </tr>
              ) : dataPresensi.length > 0 ? (
                dataPresensi.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {row.nama}
                      </strong>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-neutral)',
                          marginTop: '2px'
                        }}
                      >
                        NIM: {row.nim}
                      </div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <Badge variant="neutral" size="sm">
                        {row.kamar || '-'}
                      </Badge>
                    </td>

                    <td style={{ padding: '16px', fontWeight: '500' }}>
                      {row.sesi}
                    </td>

                    <td style={{ padding: '16px', color: 'var(--color-text-primary)' }}>
                      {row.tanggal}
                    </td>

                    <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>
                      {row.waktu}
                    </td>

                    <td style={{ padding: '16px' }}>
                      {getStatusBadge(row.status)}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        {row.foto ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Eye}
                            onClick={() => openModal('detail', row)}
                          >
                            Foto
                          </Button>
                        ) : null}

                        {row.latLong && row.latLong !== '-' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={MapPin}
                            onClick={() => openModal('lokasi', row)}
                          >
                            GPS
                          </Button>
                        ) : null}

                        {!row.foto && (!row.latLong || row.latLong === '-') && (
                          <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                            -
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Eye}
                        onClick={() => openModal('detail', row)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: '50px 20px',
                      textAlign: 'center',
                      color: 'var(--color-neutral)'
                    }}
                  >
                    <Search size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                    <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                      Tidak ada catatan presensi yang ditemukan
                    </p>
                    <span className="text-small">
                      Coba ubah tanggal, sesi, kamar, atau kata kunci pencarian Anda.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL DETAIL LENGKAP & FOTO */}
      {modalType === 'detail' && selectedData && (
        <div style={modalOverlay} onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--color-surface-l1, #ffffff)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '20px'
              }}
            >
              <div>
                <h2 className="text-section-title">Detail Catatan Presensi</h2>
                <p className="text-small">Informasi lengkap kehadiran mahasiswa</p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  padding: '4px'
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Ringkasan Profil Mahasiswa */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-l2)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '13px'
              }}
            >
              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  Nama Mahasiswa
                </span>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {selectedData.nama}
                </p>
              </div>

              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  NIM
                </span>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {selectedData.nim}
                </p>
              </div>

              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  Kamar & Gedung
                </span>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Kamar {selectedData.kamar} • {selectedData.gedung || '-'}
                </p>
              </div>

              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  Status Presensi
                </span>
                <div style={{ marginTop: '4px' }}>
                  {getStatusBadge(selectedData.status)}
                </div>
              </div>

              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  Sesi Presensi
                </span>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {selectedData.sesi}
                </p>
              </div>

              <div>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  Waktu & Tanggal
                </span>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  {selectedData.tanggal} ({selectedData.waktu})
                </p>
              </div>
            </div>

            {/* Foto Selfie */}
            <h3 className="text-card-title" style={{ marginBottom: '12px' }}>
              <Camera size={17} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Foto Selfie Presensi
            </h3>

            {selectedData.foto && !fotoError ? (
              <img
                src={selectedData.foto}
                alt="Foto selfie presensi mahasiswa"
                onError={() => setFotoError(true)}
                style={{
                  width: '100%',
                  maxHeight: '320px',
                  objectFit: 'contain',
                  backgroundColor: 'var(--color-surface-l2)',
                  borderRadius: '10px'
                }}
              />
            ) : (
              <div
                style={{
                  padding: '35px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface-l2)',
                  borderRadius: '10px'
                }}
              >
                <Camera size={36} color="var(--color-neutral)" />
                <p className="text-body" style={{ marginTop: '10px' }}>
                  Foto selfie tidak tersedia atau belum diunggah.
                </p>
              </div>
            )}

            {/* Koordinat GPS & Lokasi */}
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <strong className="text-body">
                  <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Koordinat Lokasi GPS
                </strong>
                {selectedData.latLong && selectedData.latLong !== '-' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setModalType('lokasi');
                    }}
                  >
                    Buka Peta Besar
                  </Button>
                )}
              </div>
              <p
                className="text-small"
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-surface-l2)',
                  borderRadius: '6px'
                }}
              >
                {selectedData.latLong || 'Koordinat lokasi tidak tercatat'}
              </p>
            </div>

            {/* Catatan / Keterangan */}
            {selectedData.catatan && (
              <div style={{ marginTop: '16px' }}>
                <strong className="text-body">Catatan Mahasiswa:</strong>
                <p
                  className="text-small"
                  style={{
                    marginTop: '6px',
                    padding: '10px',
                    backgroundColor: 'var(--color-surface-l2)',
                    borderRadius: '6px',
                    fontStyle: 'italic'
                  }}
                >
                  "{selectedData.catatan}"
                </p>
              </div>
            )}

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <Button variant="secondary" onClick={closeModal}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PETA LOKASI GPS */}
      {modalType === 'lokasi' && selectedData && (
        <div style={modalOverlay} onClick={closeModal}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: 'var(--color-surface-l1, #ffffff)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '18px'
              }}
            >
              <div>
                <h2 className="text-section-title">Peta Lokasi Presensi GPS</h2>
                <p className="text-small">
                  {selectedData.nama} • Kamar {selectedData.kamar}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--color-surface-l2)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MapPin size={18} color="var(--color-primary)" />
              <strong className="text-body">{selectedData.latLong}</strong>
            </div>

            {selectedData.latLong && selectedData.latLong !== '-' ? (
              <iframe
                title="Peta lokasi presensi"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: '10px' }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(selectedData.latLong)}&output=embed`}
              />
            ) : (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface-l2)',
                  borderRadius: '10px'
                }}
              >
                <p>Koordinat GPS tidak tersedia untuk catatan presensi ini.</p>
              </div>
            )}

            <div
              style={{
                marginTop: '18px',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Button
                variant="ghost"
                onClick={() => setModalType('detail')}
              >
                Kembali ke Detail Foto
              </Button>
              <Button variant="secondary" onClick={closeModal}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
