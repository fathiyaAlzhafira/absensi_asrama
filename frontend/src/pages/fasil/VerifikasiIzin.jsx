import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { api } from '../../services/api';
import {
  Check,
  X,
  FileText,
  ExternalLink,
  MessageSquare,
  CalendarDays,
  UserRound,
  AlertCircle,
  Search,
  RefreshCw,
  Eye,
  Building,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Image
} from 'lucide-react';

// ─── Konstanta ──────────────────────────────────────────────────────────────

const PRIMARY_API_BASE = 'http://localhost:8765';

const JENIS_IZIN_OPTIONS = [
  'Semua',
  'Sakit',
  'Pulang Kampung',
  'Urusan Keluarga',
  'Kegiatan Akademik',
  'Lainnya',
];

const STATUS_OPTIONS = ['Semua', 'pending', 'disetujui', 'ditolak'];

const statusConfig = {
  pending: { label: 'Menunggu Verifikasi', variant: 'warning', icon: Clock },
  disetujui: { label: 'Disetujui', variant: 'success', icon: CheckCircle },
  ditolak: { label: 'Ditolak', variant: 'error', icon: XCircle },
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
  boxSizing: 'border-box',
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
  backdropFilter: 'blur(3px)',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTanggal = (str) => {
  if (!str) return '-';
  const [y, m, d] = str.split('-');
  if (!y || !m || !d) return str;
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${bulan[parseInt(m, 10) - 1]} ${y}`;
};

const getFileType = (ext) => {
  if (!ext) return 'unknown';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

const buildFileUrl = (buktiUrl) => {
  if (!buktiUrl) return null;
  if (buktiUrl.startsWith('http')) return buktiUrl;
  return `${PRIMARY_API_BASE}${buktiUrl}`;
};

// ─── Komponen Badge Status ───────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Komponen Modal Detail ───────────────────────────────────────────────────

function DetailModal({ izin, onClose, onApprove, onReject }) {
  const fileType = getFileType(izin.bukti_ext);
  const fileUrl = buildFileUrl(izin.bukti_url);
  const isPending = izin.status === 'pending';

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              Detail Pengajuan Izin
            </h2>
            <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
              ID Pengajuan: #{izin.id}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: '18px' }}>
          <StatusBadge status={izin.status} />
        </div>

        {/* Identitas Penghuni */}
        <div style={{
          backgroundColor: 'var(--color-surface-l2)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '18px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '13px',
        }}>
          <div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Nama Mahasiswa</span>
            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '2px' }}>{izin.nama}</p>
          </div>
          <div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>NIM</span>
            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '2px' }}>{izin.nim}</p>
          </div>
          <div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Kamar</span>
            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '2px' }}>Kamar {izin.kamar}</p>
          </div>
          <div>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Gedung</span>
            <p style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '2px' }}>{izin.gedung}</p>
          </div>
        </div>

        {/* Detail Izin */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '12px' }}>
            <div>
              <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Jenis Izin</span>
              <p style={{ fontWeight: '600', marginTop: '2px' }}>{izin.jenis_izin}</p>
            </div>
            <div>
              <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Tanggal Pengajuan</span>
              <p style={{ fontWeight: '600', marginTop: '2px' }}>{formatTanggal(izin.created_at?.split(' ')[0])}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Periode Izin</span>
              <p style={{ fontWeight: '600', marginTop: '2px' }}>
                {formatTanggal(izin.tanggal_mulai)} s/d {formatTanggal(izin.tanggal_selesai)}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-l2)', borderRadius: '8px', padding: '14px' }}>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Alasan / Keterangan</span>
            <p className="text-body" style={{ marginTop: '6px', lineHeight: '1.6', fontStyle: 'italic' }}>
              "{izin.keterangan}"
            </p>
          </div>
        </div>

        {/* Lampiran Bukti */}
        <div style={{ marginBottom: '18px' }}>
          <strong className="text-body" style={{ display: 'block', marginBottom: '10px' }}>
            <FileText size={15} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Lampiran Bukti
          </strong>

          {fileUrl ? (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
              {fileType === 'image' ? (
                <img
                  src={fileUrl}
                  alt="Bukti izin"
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', backgroundColor: 'var(--color-surface-l2)', display: 'block' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div style={{ display: fileType === 'image' ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '12px', backgroundColor: 'var(--color-surface-l2)' }}>
                {fileType === 'pdf' ? <FileText size={36} color="var(--color-error)" /> : <FileText size={36} color="var(--color-neutral)" />}
                <span className="text-small">{izin.bukti_file}</span>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                  {fileType === 'pdf' ? 'Dokumen PDF' : fileType === 'image' ? 'Gambar' : 'Berkas'}
                </span>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}
                >
                  <ExternalLink size={14} />
                  Buka Berkas
                </a>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--color-surface-l2)', borderRadius: '8px', color: 'var(--color-neutral)' }}>
              <FileText size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
              <p className="text-small">Tidak ada lampiran yang diunggah.</p>
            </div>
          )}
        </div>

        {/* Catatan Verifikasi (jika sudah diproses) */}
        {izin.catatan_fasil && (
          <div style={{ marginBottom: '18px', padding: '14px', backgroundColor: 'var(--color-surface-l2)', borderRadius: '8px' }}>
            <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Catatan Fasilitator:</span>
            <p className="text-body" style={{ marginTop: '6px', fontStyle: 'italic' }}>"{izin.catatan_fasil}"</p>
          </div>
        )}

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          {isPending ? (
            <>
              <Button variant="ghost" onClick={onClose}>Batal</Button>
              <Button variant="danger" icon={X} onClick={() => onReject(izin)}>Tolak</Button>
              <Button variant="primary" icon={Check} onClick={() => onApprove(izin)}>Setujui</Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onClose}>Tutup</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Modal Verifikasi ────────────────────────────────────────────────

function VerifikasiModal({ izin, actionType, onClose, onConfirm, loading }) {
  const [catatan, setCatatan] = useState('');
  const [err, setErr] = useState('');

  const isApprove = actionType === 'approve';

  const handleSubmit = () => {
    if (!isApprove && !catatan.trim()) {
      setErr('Alasan penolakan wajib diisi sebelum melanjutkan.');
      return;
    }
    onConfirm(catatan.trim());
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          padding: '24px',
          boxShadow: '0 20px 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>
              {isApprove ? '✅ Setujui Pengajuan Izin' : '❌ Tolak Pengajuan Izin'}
            </h3>
            <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
              Periksa kembali sebelum memberikan keputusan.
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-neutral)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Ringkasan */}
        <div style={{ padding: '13px', borderRadius: '8px', backgroundColor: 'var(--color-surface-l2)', marginBottom: '18px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <UserRound size={15} />
            <strong style={{ color: 'var(--color-text-primary)' }}>{izin.nama}</strong>
          </div>
          <p className="text-small" style={{ color: 'var(--color-neutral)' }}>NIM: {izin.nim} • Kamar: {izin.kamar}</p>
          <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '3px' }}>
            Jenis: {izin.jenis_izin} • Periode: {formatTanggal(izin.tanggal_mulai)} s/d {formatTanggal(izin.tanggal_selesai)}
          </p>
        </div>

        {/* Kolom catatan */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
            {isApprove ? 'Catatan untuk Penghuni (Opsional)' : 'Alasan Penolakan *'}
          </label>
          <div style={{ position: 'relative' }}>
            <MessageSquare size={15} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--color-neutral)' }} />
            <textarea
              rows={4}
              value={catatan}
              onChange={(e) => { setCatatan(e.target.value); if (err) setErr(''); }}
              placeholder={isApprove ? 'Tuliskan pesan tambahan untuk penghuni...' : 'Tuliskan alasan penolakan secara jelas...'}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: 'var(--color-surface-l2)',
                color: 'var(--color-text-primary)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${err ? 'var(--color-error)' : 'var(--color-border)'}`,
                padding: '11px 12px 11px 36px',
                fontSize: '13px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
          {err && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-error)', fontSize: '12px', marginTop: '6px' }}>
              <AlertCircle size={13} />{err}
            </p>
          )}
          {!isApprove && (
            <p className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '5px' }}>
              Alasan penolakan akan disampaikan kepada penghuni.
            </p>
          )}
        </div>

        {/* Tombol Aksi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Batal</Button>
          <Button
            variant={isApprove ? 'primary' : 'danger'}
            icon={isApprove ? Check : X}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Memproses...' : isApprove ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Utama ────────────────────────────────────────────────────────────

export default function VerifikasiIzin() {
  // Data
  const [daftarIzin, setDaftarIzin] = useState([]);
  const [gedungInfo, setGedungInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [pencarian, setPencarian] = useState('');

  // Modal state
  const [detailIzin, setDetailIzin] = useState(null);       // null | izin object
  const [verifikasiIzin, setVerifikasiIzin] = useState(null); // null | izin object
  const [actionType, setActionType] = useState('');           // 'approve' | 'reject'
  const [verifying, setVerifying] = useState(false);

  // Notifikasi
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Fetch data ──────────────────────────────────────────────────────────────

  const fetchIzins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (filterStatus !== 'Semua') params.status = filterStatus;
      if (filterJenis !== 'Semua') params.jenis_izin = filterJenis;
      if (filterTanggal) params.tanggal = filterTanggal;
      if (pencarian.trim()) params.search = pencarian.trim();

      const res = await api.getIzins(params);
      if (res?.status === 'success') {
        const payload = res.data || {};
        setDaftarIzin(payload.data || []);
        if (payload.gedung) setGedungInfo(payload.gedung);
      } else {
        throw new Error(res?.message || 'Gagal memuat data izin.');
      }
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterJenis, filterTanggal, pencarian]);

  useEffect(() => {
    fetchIzins();
  }, [fetchIzins]);

  // ── Statistik ───────────────────────────────────────────────────────────────

  const totalPending = useMemo(() => daftarIzin.filter((i) => i.status === 'pending').length, [daftarIzin]);
  const totalDisetujui = useMemo(() => daftarIzin.filter((i) => i.status === 'disetujui').length, [daftarIzin]);
  const totalDitolak = useMemo(() => daftarIzin.filter((i) => i.status === 'ditolak').length, [daftarIzin]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleResetFilter = () => {
    setFilterStatus('Semua');
    setFilterJenis('Semua');
    setFilterTanggal('');
    setPencarian('');
  };

  const openDetail = (izin) => setDetailIzin(izin);
  const closeDetail = () => setDetailIzin(null);

  const openVerifikasi = (izin, type) => {
    setDetailIzin(null); // tutup detail dulu
    setVerifikasiIzin(izin);
    setActionType(type);
    setErrorMsg('');
  };

  const closeVerifikasi = () => {
    setVerifikasiIzin(null);
    setActionType('');
  };

  const handleConfirmVerifikasi = async (catatan) => {
    if (!verifikasiIzin) return;

    setVerifying(true);
    setErrorMsg('');
    try {
      const statusKirim = actionType === 'approve' ? 'disetujui' : 'ditolak';
      await api.verifyIzin(verifikasiIzin.id, statusKirim, catatan);

      setSuccessMsg(
        actionType === 'approve'
          ? `Pengajuan izin ${verifikasiIzin.nama} berhasil disetujui.`
          : `Pengajuan izin ${verifikasiIzin.nama} berhasil ditolak.`
      );
      closeVerifikasi();
      fetchIzins(); // refresh daftar
    } catch (e) {
      setErrorMsg(e.message || 'Gagal memverifikasi izin. Silakan coba lagi.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="text-page-title">Verifikasi Pengajuan Izin</h1>
          <p className="text-body" style={{ marginTop: '4px' }}>
            Tinjau pengajuan izin penghuni dan berikan persetujuan atau penolakan.
          </p>
          {gedungInfo && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '4px 12px', backgroundColor: 'var(--color-surface-l2)', borderRadius: '16px', fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>
              <Building size={15} />
              <span>Gedung Binaan: {gedungInfo.nama}</span>
            </div>
          )}
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchIzins} disabled={loading}>
          {loading ? 'Memperbarui...' : 'Segarkan'}
        </Button>
      </div>

      {/* Notifikasi Sukses */}
      {successMsg && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', marginBottom: '20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.3)', color: 'var(--color-text-primary)' }}>
          <Check size={18} color="var(--color-success)" />
          <span className="text-body" style={{ flex: 1 }}>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} style={{ border: 'none', background: 'transparent', color: 'var(--color-neutral)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Notifikasi Error */}
      {errorMsg && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', marginBottom: '20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(226,33,52,0.08)', border: '1px solid rgba(226,33,52,0.3)', color: 'var(--color-error)' }}>
          <AlertCircle size={18} />
          <span className="text-body" style={{ flex: 1 }}>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg('')} style={{ border: 'none', background: 'transparent', color: 'var(--color-neutral)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Error State (fetch) */}
      {error && (
        <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--color-error)" />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--color-error)' }}>Gagal Memuat Data</strong>
              <p className="text-body" style={{ fontSize: '13px', marginTop: '2px' }}>{error}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={fetchIzins}>Coba Lagi</Button>
          </div>
        </Card>
      )}

      {/* Kartu Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">PENDING</span>
            <Clock color="var(--color-warning)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-warning)', marginTop: '8px' }}>{loading ? '...' : totalPending}</div>
          <span className="text-small">Menunggu verifikasi</span>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">DISETUJUI</span>
            <CheckCircle color="var(--color-success)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-success)', marginTop: '8px' }}>{loading ? '...' : totalDisetujui}</div>
          <span className="text-small">Izin disetujui</span>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">DITOLAK</span>
            <XCircle color="var(--color-error)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-error)', marginTop: '8px' }}>{loading ? '...' : totalDitolak}</div>
          <span className="text-small">Izin ditolak</span>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-label">TOTAL</span>
            <Filter color="var(--color-primary)" size={20} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', marginTop: '8px' }}>{loading ? '...' : daftarIzin.length}</div>
          <span className="text-small">Sesuai filter</span>
        </Card>
      </div>

      {/* Panel Filter */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div>
            <label className="text-label">Status Pengajuan</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'Semua' ? 'Semua Status' : statusConfig[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label">Jenis Izin</label>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }}>
              {JENIS_IZIN_OPTIONS.map((j) => (
                <option key={j} value={j}>{j === 'Semua' ? 'Semua Jenis' : j}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-label">Tanggal Pengajuan</label>
            <input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} style={{ ...inputStyle, marginTop: '6px' }} />
          </div>
          <div>
            <label className="text-label">Pencarian Mahasiswa</label>
            <div style={{ position: 'relative', marginTop: '6px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--color-neutral)' }} />
              <input type="text" placeholder="Nama atau NIM..." value={pencarian} onChange={(e) => setPencarian(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
            </div>
          </div>
          <div>
            <Button variant="secondary" size="md" onClick={handleResetFilter} style={{ width: '100%', height: '42px' }}>
              Reset Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Daftar Pengajuan */}
      {loading ? (
        <Card hoverable={false} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--color-neutral)' }}>
          <RefreshCw size={32} style={{ marginBottom: '10px', animation: 'spin 1.5s linear infinite' }} />
          <p>Memuat data pengajuan izin...</p>
        </Card>
      ) : daftarIzin.length === 0 ? (
        <Card hoverable={false} style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Check size={36} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
          <h3 className="text-card-title">Tidak Ada Pengajuan Ditemukan</h3>
          <p className="text-body" style={{ color: 'var(--color-neutral)', marginTop: '6px' }}>
            {filterStatus !== 'Semua' || filterJenis !== 'Semua' || filterTanggal || pencarian
              ? 'Tidak ada pengajuan yang cocok dengan filter yang dipilih.'
              : 'Tidak ada permohonan izin yang masuk saat ini.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {daftarIzin.map((item) => (
            <Card key={item.id} hoverable={false} style={{ padding: '20px' }}>
              {/* Header Kartu */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 className="text-card-title" style={{ fontSize: '17px', color: 'var(--color-text-primary)' }}>
                      {item.nama}
                    </h3>
                    <Badge variant="neutral">NIM: {item.nim}</Badge>
                    <Badge variant="neutral">Kamar {item.kamar}</Badge>
                    <Badge variant="warning">{item.jenis_izin}</Badge>
                  </div>
                  <div className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDays size={13} />
                    Periode: <strong style={{ color: 'var(--color-text-primary)' }}>{formatTanggal(item.tanggal_mulai)} s/d {formatTanggal(item.tanggal_selesai)}</strong>
                    <span style={{ marginLeft: '8px' }}>• Diajukan: {formatTanggal(item.created_at?.split(' ')[0])}</span>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {/* Alasan */}
              <div style={{ backgroundColor: 'var(--color-surface-l2)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                <span className="text-label" style={{ color: 'var(--color-neutral)' }}>Alasan Pengajuan</span>
                <p className="text-body" style={{ marginTop: '5px', lineHeight: '1.6' }}>
                  "{item.keterangan}"
                </p>
              </div>

              {/* Lampiran & Aksi */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.bukti_url ? (
                    <>
                      {getFileType(item.bukti_ext) === 'image'
                        ? <Image size={18} color="var(--color-primary)" />
                        : <FileText size={18} color="var(--color-primary)" />
                      }
                      <div>
                        <p className="text-body" style={{ fontSize: '12px', fontWeight: '600' }}>
                          {String(item.bukti_file).split('/').pop()}
                        </p>
                        <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                          {getFileType(item.bukti_ext) === 'pdf' ? 'Dokumen PDF' : 'Gambar'}
                        </span>
                      </div>
                      <a href={buildFileUrl(item.bukti_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                        <ExternalLink size={13} /> Buka
                      </a>
                    </>
                  ) : (
                    <span className="text-small" style={{ color: 'var(--color-neutral)' }}>Tidak ada lampiran</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" icon={Eye} onClick={() => openDetail(item)}>
                    Detail
                  </Button>
                  {item.status === 'pending' && (
                    <>
                      <Button size="sm" variant="danger" icon={X} onClick={() => openVerifikasi(item, 'reject')}>
                        Tolak
                      </Button>
                      <Button size="sm" variant="primary" icon={Check} onClick={() => openVerifikasi(item, 'approve')}>
                        Setujui
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Detail */}
      {detailIzin && (
        <DetailModal
          izin={detailIzin}
          onClose={closeDetail}
          onApprove={(izin) => openVerifikasi(izin, 'approve')}
          onReject={(izin) => openVerifikasi(izin, 'reject')}
        />
      )}

      {/* Modal Verifikasi */}
      {verifikasiIzin && (
        <VerifikasiModal
          izin={verifikasiIzin}
          actionType={actionType}
          onClose={closeVerifikasi}
          onConfirm={handleConfirmVerifikasi}
          loading={verifying}
        />
      )}
    </div>
  );
}
