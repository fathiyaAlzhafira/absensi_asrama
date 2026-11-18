import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { api } from '../../services/api';
import {
  Users,
  Phone,
  Search,
  DoorOpen,
  UserRound,
  CalendarDays,
  X,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Building,
  ExternalLink,
} from 'lucide-react';

// ─── Konstanta ──────────────────────────────────────────────────────────────

const PRIMARY_API_BASE = 'http://localhost:8765';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-l1)',
  color: 'var(--color-text-primary)',
  fontSize: '13px',
  outline: 'none',
  height: '42px',
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  backdropFilter: 'blur(3px)',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const formatTanggal = (str) => {
  if (!str) return '-';
  const [y, m, d] = str.split('-');
  if (!y || !m || !d) return str;
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${bulan[parseInt(m, 10) - 1]} ${y}`;
};

const formatWhatsApp = (nomor) => {
  if (!nomor) return '';
  let hasil = String(nomor).replace(/\D/g, '');
  if (hasil.startsWith('0')) hasil = '62' + hasil.slice(1);
  else if (!hasil.startsWith('62')) hasil = '62' + hasil;
  return hasil;
};

const getPresensiStatusVariant = (status) => {
  switch (status) {
    case 'hadir': return 'success';
    case 'terlambat': return 'warning';
    case 'izin': return 'default';
    case 'alpa': return 'error';
    default: return 'neutral';
  }
};

const getPresensiStatusLabel = (status) => {
  const map = { hadir: 'Hadir', terlambat: 'Terlambat', izin: 'Izin', alpa: 'Alpa' };
  return map[status] || status;
};

const getIzinStatusVariant = (status) => {
  switch (status) {
    case 'disetujui': return 'success';
    case 'ditolak': return 'error';
    case 'pending': return 'warning';
    default: return 'neutral';
  }
};

const getIzinStatusLabel = (status) => {
  const map = { disetujui: 'Disetujui', ditolak: 'Ditolak', pending: 'Menunggu' };
  return map[status] || status;
};

// ─── Sub-komponen: Tab Riwayat Presensi ──────────────────────────────────────

function TabPresensi({ penghuniId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!penghuniId) return;
    setLoading(true);
    setError(null);
    api.getPenghuniPresensis(penghuniId)
      .then((res) => {
        if (res?.status === 'success') setData(res.data || []);
        else throw new Error(res?.message || 'Gagal memuat riwayat presensi.');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [penghuniId]);

  if (loading) return (
    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-neutral)' }}>
      <RefreshCw size={22} style={{ marginBottom: '8px', animation: 'spin 1.5s linear infinite' }} />
      <p className="text-small">Memuat riwayat presensi...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-error)' }}>
      <AlertCircle size={22} style={{ marginBottom: '8px' }} />
      <p className="text-small">{error}</p>
    </div>
  );

  if (data.length === 0) return (
    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--color-surface-l2)', borderRadius: '8px' }}>
      <CalendarDays size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
      <p className="text-body" style={{ color: 'var(--color-neutral)' }}>Belum terdapat riwayat presensi.</p>
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', minWidth: '400px' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)' }}>
            <th style={{ padding: '10px 12px' }}>Tanggal</th>
            <th style={{ padding: '10px 12px' }}>Sesi</th>
            <th style={{ padding: '10px 12px' }}>Waktu</th>
            <th style={{ padding: '10px 12px' }}>Status</th>
            <th style={{ padding: '10px 12px' }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '10px 12px' }}>{formatTanggal(item.tanggal)}</td>
              <td style={{ padding: '10px 12px' }}>{item.sesi}</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {item.waktu}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <Badge variant={getPresensiStatusVariant(item.status)} size="sm">
                  {getPresensiStatusLabel(item.status)}
                </Badge>
              </td>
              <td style={{ padding: '10px 12px', color: 'var(--color-neutral)', fontSize: '12px' }}>
                {item.keterangan || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-komponen: Tab Riwayat Izin ──────────────────────────────────────────

function TabIzin({ penghuniId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!penghuniId) return;
    setLoading(true);
    setError(null);
    api.getPenghuniIzins(penghuniId)
      .then((res) => {
        if (res?.status === 'success') setData(res.data || []);
        else throw new Error(res?.message || 'Gagal memuat riwayat izin.');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [penghuniId]);

  if (loading) return (
    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-neutral)' }}>
      <RefreshCw size={22} style={{ marginBottom: '8px', animation: 'spin 1.5s linear infinite' }} />
      <p className="text-small">Memuat riwayat izin...</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-error)' }}>
      <AlertCircle size={22} style={{ marginBottom: '8px' }} />
      <p className="text-small">{error}</p>
    </div>
  );

  if (data.length === 0) return (
    <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--color-surface-l2)', borderRadius: '8px' }}>
      <FileText size={28} style={{ marginBottom: '10px', opacity: 0.4 }} />
      <p className="text-body" style={{ color: 'var(--color-neutral)' }}>Belum terdapat riwayat pengajuan izin.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
      {data.map((izin) => (
        <div key={izin.id} style={{
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '8px',
          alignItems: 'start',
          fontSize: '13px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{izin.jenis_izin}</strong>
              <Badge variant={getIzinStatusVariant(izin.status)} size="sm">
                {getIzinStatusLabel(izin.status)}
              </Badge>
            </div>
            <p className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {formatTanggal(izin.tanggal_mulai)} s/d {formatTanggal(izin.tanggal_selesai)}
            </p>
            {izin.keterangan && (
              <p className="text-small" style={{ color: 'var(--color-text-primary)', marginTop: '4px', fontStyle: 'italic' }}>
                "{izin.keterangan}"
              </p>
            )}
            {izin.catatan_fasil && (
              <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '3px' }}>
                Catatan: {izin.catatan_fasil}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
              {formatTanggal(izin.created_at?.split(' ')[0])}
            </span>
            {izin.bukti_url && (
              <a
                href={izin.bukti_url.startsWith('http') ? izin.bukti_url : `${PRIMARY_API_BASE}${izin.bukti_url}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}
              >
                <ExternalLink size={12} /> Bukti
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sub-komponen: Modal Detail Penghuni ─────────────────────────────────────

function DetailModal({ penghuni, onClose }) {
  const [activeTab, setActiveTab] = useState('presensi'); // 'presensi' | 'izin'
  const waNumber = formatWhatsApp(penghuni.no_hp);

  const TAB_STYLE_ACTIVE = {
    padding: '8px 18px',
    border: 'none',
    borderBottom: '2px solid var(--color-primary)',
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '13px',
  };
  const TAB_STYLE_INACTIVE = {
    ...TAB_STYLE_ACTIVE,
    borderBottom: '2px solid transparent',
    color: 'var(--color-neutral)',
    fontWeight: '400',
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-penghuni-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 id="detail-penghuni-title" style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              Detail Penghuni
            </h2>
            <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
              Informasi biodata, riwayat presensi, dan izin mahasiswa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            style={{ border: 'none', background: 'transparent', color: 'var(--color-neutral)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Biodata */}
        <div style={{ backgroundColor: 'var(--color-surface-l2)', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            {penghuni.foto_profil ? (
              <img
                src={penghuni.foto_profil.startsWith('http') ? penghuni.foto_profil : `${PRIMARY_API_BASE}${penghuni.foto_profil}`}
                alt={penghuni.nama}
                style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserRound size={26} color="var(--color-primary)" />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{penghuni.nama}</h3>
              <p className="text-small" style={{ color: 'var(--color-neutral)' }}>{penghuni.nim}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', fontSize: '13px' }}>
            {[
              ['Email', penghuni.email],
              ['Jenis Kelamin', penghuni.jekel],
              ['Asal Daerah', penghuni.asal || '-'],
              ['No. HP', penghuni.no_hp || '-'],
              ['Nomor Kamar', penghuni.kamar ? `Kamar ${penghuni.kamar}` : '-'],
              ['Gedung', penghuni.gedung || '-'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-small" style={{ color: 'var(--color-neutral)', marginBottom: '3px' }}>{label}</p>
                <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', overflowWrap: 'anywhere' }}>{value}</p>
              </div>
            ))}
          </div>

          {waNumber && (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginTop: '14px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}
            >
              <Phone size={14} />
              Hubungi melalui WhatsApp
            </a>
          )}
        </div>

        {/* Tab Riwayat */}
        <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '16px', display: 'flex', gap: '0' }}>
          <button style={activeTab === 'presensi' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setActiveTab('presensi')}>
            <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Riwayat Presensi
          </button>
          <button style={activeTab === 'izin' ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE} onClick={() => setActiveTab('izin')}>
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            Riwayat Izin
          </button>
        </div>

        {activeTab === 'presensi' && <TabPresensi penghuniId={penghuni.id} />}
        {activeTab === 'izin' && <TabIzin penghuniId={penghuni.id} />}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Button size="md" variant="ghost" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────────────────────

export default function DataPenghuni() {
  const [penghuniList, setPenghuniList] = useState([]);
  const [gedungInfo, setGedungInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKamar, setFilterKamar] = useState('semua');
  const [filterJekel, setFilterJekel] = useState('semua');
  const [sortBy, setSortBy] = useState('nama'); // 'nama' | 'nim'

  // Modal state
  const [selectedPenghuni, setSelectedPenghuni] = useState(null);

  // ── Fetch Data ────────────────────────────────────────────────────────────

  const fetchPenghuni = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.getPenghuni(params);
      if (res?.status === 'success') {
        const data = Array.isArray(res.data) ? res.data : [];
        setPenghuniList(data);
        // Ambil info gedung dari data pertama (scope sudah ditentukan backend)
        if (data.length > 0 && data[0].gedung) {
          setGedungInfo({ nama: data[0].gedung });
        }
      } else {
        throw new Error(res?.message || 'Gagal memuat data penghuni.');
      }
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPenghuni();
  }, [fetchPenghuni]);

  // ── Filter & Sort (lokal — data sudah scope dari backend) ─────────────────

  const daftarKamar = useMemo(() => {
    const kamars = penghuniList.map((p) => p.kamar).filter(Boolean);
    return [...new Set(kamars)].sort();
  }, [penghuniList]);

  const filteredPenghuni = useMemo(() => {
    let result = [...penghuniList];

    if (filterKamar !== 'semua') {
      result = result.filter((p) => p.kamar === filterKamar);
    }

    if (filterJekel !== 'semua') {
      result = result.filter((p) => (p.jekel || '').toLowerCase() === filterJekel.toLowerCase());
    }

    result.sort((a, b) => {
      const valA = (a[sortBy] || '').toLowerCase();
      const valB = (b[sortBy] || '').toLowerCase();
      return valA.localeCompare(valB);
    });

    return result;
  }, [penghuniList, filterKamar, filterJekel, sortBy]);

  const handleResetFilter = () => {
    setSearchTerm('');
    setFilterKamar('semua');
    setFilterJekel('semua');
    setSortBy('nama');
  };

  const totalKamar = useMemo(() => new Set(penghuniList.map((p) => p.kamar).filter(Boolean)).size, [penghuniList]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="text-page-title">Data Penghuni Gedung</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>Daftar mahasiswa asrama di bawah binaan Anda.</p>
          {gedungInfo && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '4px 12px', backgroundColor: 'var(--color-surface-l2)', borderRadius: '16px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>
              <Building size={15} />
              <span>Gedung Binaan: {gedungInfo.nama}</span>
            </div>
          )}
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchPenghuni} disabled={loading}>
          {loading ? 'Memperbarui...' : 'Segarkan'}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--color-error)" />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--color-error)' }}>Gagal Memuat Data</strong>
              <p className="text-body" style={{ fontSize: '13px', marginTop: '2px' }}>{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchPenghuni}>Coba Lagi</Button>
          </div>
        </Card>
      )}

      {/* Kartu Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: 'var(--color-surface-l2)' }}>
              <Users size={22} color="var(--color-primary)" />
            </div>
            <div>
              <p className="text-small" style={{ color: 'var(--color-neutral)' }}>Total Penghuni</p>
              <h2 className="text-card-title" style={{ fontSize: '24px' }}>{loading ? '...' : penghuniList.length}</h2>
            </div>
          </div>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: 'var(--color-surface-l2)' }}>
              <DoorOpen size={22} color="var(--color-primary)" />
            </div>
            <div>
              <p className="text-small" style={{ color: 'var(--color-neutral)' }}>Jumlah Kamar</p>
              <h2 className="text-card-title" style={{ fontSize: '24px' }}>{loading ? '...' : totalKamar}</h2>
            </div>
          </div>
        </Card>

        <Card hoverable={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '11px', borderRadius: '10px', backgroundColor: 'var(--color-surface-l2)' }}>
              <UserRound size={22} color="var(--color-primary)" />
            </div>
            <div>
              <p className="text-small" style={{ color: 'var(--color-neutral)' }}>Ditampilkan</p>
              <h2 className="text-card-title" style={{ fontSize: '24px' }}>{loading ? '...' : filteredPenghuni.length}</h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Panel Filter */}
      <Card hoverable={false} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          {/* Pencarian */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Pencarian</label>
            <Search size={15} style={{ position: 'absolute', left: '12px', bottom: '13px', color: 'var(--color-neutral)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nama atau NIM..."
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
          </div>

          {/* Filter Kamar */}
          <div style={{ minWidth: '160px' }}>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Kamar</label>
            <select value={filterKamar} onChange={(e) => setFilterKamar(e.target.value)} style={inputStyle}>
              <option value="semua">Semua Kamar</option>
              {daftarKamar.map((k) => (
                <option key={k} value={k}>Kamar {k}</option>
              ))}
            </select>
          </div>

          {/* Filter Jenis Kelamin */}
          <div style={{ minWidth: '160px' }}>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Jenis Kelamin</label>
            <select value={filterJekel} onChange={(e) => setFilterJekel(e.target.value)} style={inputStyle}>
              <option value="semua">Semua</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          {/* Urutan */}
          <div style={{ minWidth: '160px' }}>
            <label className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Urutkan</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
              <option value="nama">Nama (A–Z)</option>
              <option value="nim">NIM (A–Z)</option>
            </select>
          </div>

          {/* Reset */}
          <div>
            <Button size="md" variant="ghost" onClick={handleResetFilter} style={{ height: '42px' }}>
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabel Daftar Penghuni */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-card-title">Daftar Penghuni</h3>
          <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
            {loading ? 'Memuat...' : `Menampilkan ${filteredPenghuni.length} dari ${penghuniList.length} penghuni`}
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '750px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '14px 16px' }}>#</th>
                <th style={{ padding: '14px 16px' }}>Nama Mahasiswa</th>
                <th style={{ padding: '14px 16px' }}>NIM</th>
                <th style={{ padding: '14px 16px' }}>Kamar</th>
                <th style={{ padding: '14px 16px' }}>Jenis Kelamin</th>
                <th style={{ padding: '14px 16px' }}>Asal</th>
                <th style={{ padding: '14px 16px' }}>Kontak</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    <RefreshCw size={28} style={{ marginBottom: '10px', animation: 'spin 1.5s linear infinite' }} />
                    <p>Memuat data penghuni...</p>
                  </td>
                </tr>
              ) : filteredPenghuni.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    <Search size={30} style={{ marginBottom: '10px', opacity: 0.4 }} />
                    <p className="text-body" style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>Data penghuni tidak ditemukan.</p>
                    <p className="text-small" style={{ marginTop: '4px' }}>Coba gunakan kata kunci atau filter lainnya.</p>
                  </td>
                </tr>
              ) : (
                filteredPenghuni.map((mhs, index) => (
                  <tr key={mhs.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{index + 1}</td>

                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{mhs.nama}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-neutral)', marginTop: '2px' }}>{mhs.email}</div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{mhs.nim || '-'}</td>

                    <td style={{ padding: '14px 16px' }}>
                      <Badge variant="neutral" size="sm">{mhs.kamar || '-'}</Badge>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{mhs.jekel || '-'}</td>

                    <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{mhs.asal || '-'}</td>

                    <td style={{ padding: '14px 16px' }}>
                      {mhs.no_hp ? (
                        <a
                          href={`https://wa.me/${formatWhatsApp(mhs.no_hp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Hubungi ${mhs.nama} melalui WhatsApp`}
                          style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700', textDecoration: 'none', fontSize: '12px' }}
                        >
                          <Phone size={13} />WhatsApp
                        </a>
                      ) : (
                        <span className="text-small" style={{ color: 'var(--color-neutral)' }}>-</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => setSelectedPenghuni(mhs)}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail */}
      {selectedPenghuni && (
        <DetailModal
          penghuni={selectedPenghuni}
          onClose={() => setSelectedPenghuni(null)}
        />
      )}
    </div>
  );
}
