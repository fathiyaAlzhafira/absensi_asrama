import React, { useEffect, useState } from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Clock, ExternalLink, FileText, X, Download, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

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

const statusVariant = (status) => {
  if (status === 'disetujui') return 'success';
  if (status === 'ditolak') return 'error';
  return 'warning';
};

const statusLabel = (status) => ({
  pending: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak'
}[status] || 'Menunggu');

const sesiLabel = (sesi) => {
  if (sesi === 'malam') return 'Sesi Malam';
  if (sesi === 'subuh') return 'Sesi Subuh';
  return 'Semua Sesi';
};

const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  if (filePath.startsWith('/')) return filePath;
  return `/${filePath}`;
};

const isImageFile = (filePath) => {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
};

const isPdfFile = (filePath) => Boolean(filePath && filePath.toLowerCase().endsWith('.pdf'));

export default function RiwayatStatusIzin({ refreshKey = 0 }) {
  const [daftarIzin, setDaftarIzin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.getMyIzins()
      .then((response) => {
        if (!active) return;
        if (response?.status !== 'success' || !Array.isArray(response.data)) {
          throw new Error(response?.message || 'Format data riwayat izin tidak sesuai.');
        }
        setDaftarIzin(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Riwayat izin gagal dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, retryKey]);

  const jumlahDisetujui = daftarIzin.filter((item) => item.status === 'disetujui').length;
  const jumlahDitolak = daftarIzin.filter((item) => item.status === 'ditolak').length;
  const jumlahMenunggu = daftarIzin.filter((item) => !['disetujui', 'ditolak'].includes(item.status)).length;

  return (
    <section id="riwayat-izin" className="resident-permission-history">
      <Card hoverable={false} className="resident-permission-summary-card">
        <div className="status-izin-header">
          <div>
            <span className="text-label" style={{ color: 'var(--color-primary)' }}>PERIZINAN</span>
            <h2 className="text-card-title">Riwayat izin &amp; status</h2>
            <p className="text-body">Lihat pengajuan Anda dan catatan dari fasilitator.</p>
          </div>
        </div>

        <div className="status-izin-summary">
          <div className="status-summary-item">
            <span className="text-small">Total pengajuan</span>
            <strong>{daftarIzin.length}</strong>
          </div>
          <div className="status-summary-item">
            <span className="text-small">Menunggu</span>
            <strong>{jumlahMenunggu}</strong>
          </div>
          <div className="status-summary-item">
            <span className="text-small">Disetujui</span>
            <strong className="status-summary-approved">{jumlahDisetujui}</strong>
          </div>
          <div className="status-summary-item">
            <span className="text-small">Ditolak</span>
            <strong>{jumlahDitolak}</strong>
          </div>
        </div>
      </Card>

      <div className="status-izin-list" aria-live="polite">
        {loading ? (
          <Card hoverable={false} className="status-izin-empty">
            <p className="text-body">Memuat riwayat izin...</p>
          </Card>
        ) : error ? (
          <Card hoverable={false} className="status-izin-empty">
            <p className="text-body" role="alert">{error}</p>
            <Button size="md" variant="secondary" className="resident-action-button" onClick={() => setRetryKey((key) => key + 1)}>
              Coba lagi
            </Button>
          </Card>
        ) : daftarIzin.length === 0 ? (
          <Card hoverable={false} className="status-izin-empty">
            <FileText size={28} color="var(--color-neutral)" />
            <h3 className="text-card-title">Belum ada pengajuan izin</h3>
            <p className="text-body">Pengajuan yang Anda kirim akan tampil di bagian ini.</p>
          </Card>
        ) : daftarIzin.map((item) => (
          <Card key={item.id} hoverable={false} className="status-izin-card">
            <div className="status-izin-card-heading">
              <div className="status-izin-type">
                <div className="status-izin-icon"><FileText size={18} /></div>
                <div>
                  <h3 className="text-card-title status-izin-type-title">
                    {item.jenis_izin ? item.jenis_izin.replace(/_/g, ' ') : 'Izin'}
                  </h3>
                  <span className="text-small">{sesiLabel(item.sesi)}</span>
                </div>
              </div>
              <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
            </div>

            <div className="status-izin-period">
              <Clock size={15} />
              <span>
                {formatTanggal(item.tanggal_mulai)}
                {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai
                  ? ` — ${formatTanggal(item.tanggal_selesai)}`
                  : ''}
              </span>
            </div>

            <p className="text-body-white status-izin-description">
              {item.keterangan || 'Tidak ada keterangan.'}
            </p>

            {item.catatan_fasil && (
              <div className={`status-izin-note ${item.status === 'disetujui' ? 'approved' : item.status === 'ditolak' ? 'rejected' : ''}`}>
                <span>Catatan fasilitator</span>
                <p>{item.catatan_fasil}</p>
              </div>
            )}

            {item.bukti_file && (
              <div className="status-izin-attachment">
                <div className="status-izin-file">
                  <FileText size={16} />
                  <span>
                    <small>Lampiran</small>
                    <strong>{item.bukti_file.split(/[\\/]/).pop()}</strong>
                  </span>
                </div>
                <Button size="sm" variant="ghost" icon={ExternalLink} onClick={() => setPreviewFile(item.bukti_file)}>
                  Buka berkas
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {previewFile && (
        <div
          className="resident-photo-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewFile(null);
          }}
        >
          <div className="resident-photo-dialog" style={{ width: 'min(640px, 100%)' }}>
            <div className="resident-photo-header">
              <h2 className="text-card-title">Pratinjau Berkas Lampiran</h2>
              <button
                type="button"
                className="resident-camera-close"
                onClick={() => setPreviewFile(null)}
                aria-label="Tutup pratinjau"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              backgroundColor: 'var(--color-surface-l2)',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '220px'
            }}>
              {isImageFile(previewFile) ? (
                <img src={getFileUrl(previewFile)} alt="Bukti izin" />
              ) : isPdfFile(previewFile) ? (
                <iframe
                  src={getFileUrl(previewFile)}
                  title="Pratinjau PDF"
                  style={{ width: '100%', height: '58vh', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <AlertCircle size={32} color="var(--color-neutral)" style={{ margin: '0 auto 8px' }} />
                  <p className="text-body">{previewFile.split(/[\\/]/).pop()}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="text-small">{previewFile.split(/[\\/]/).pop()}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={getFileUrl(previewFile)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <Button size="sm" variant="secondary" icon={Download}>
                    Buka di tab baru
                  </Button>
                </a>
                <Button size="sm" variant="primary" onClick={() => setPreviewFile(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
