import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { FileText, Clock, ExternalLink, X, Download, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function StatusIzin() {
  const [daftarIzin, setDaftarIzin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  const loadData = () => {
    setLoading(true);
    api.getMyIzins()
      .then((res) => {
        if (res && res.data) {
          setDaftarIzin(res.data);
        } else {
          setDaftarIzin([]);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat daftar izin:', err);
        setDaftarIzin([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const isPdfFile = (filePath) => {
    if (!filePath) return false;
    return filePath.toLowerCase().endsWith('.pdf');
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Status Izin Saya</h1>
        <p className="text-body">Pantau status persetujuan permohonan izin dari Fasilitator Asrama</p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card hoverable={false} style={{ padding: '36px', textAlign: 'center' }}>
          <Clock size={28} color="var(--color-primary)" style={{ margin: '0 auto 12px', animation: 'spin 1.5s linear infinite' }} />
          <p className="text-body" style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>
            Memuat data status izin Anda...
          </p>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </Card>
      )}

      {/* Empty State */}
      {!loading && daftarIzin.length === 0 && (
        <Card hoverable={false} style={{ padding: '40px 24px', textAlign: 'center' }}>
          <FileText size={44} color="var(--color-neutral)" style={{ margin: '0 auto 12px', opacity: 0.7 }} />
          <h3 className="text-card-title" style={{ marginBottom: '6px' }}>Belum Ada Pengajuan Izin</h3>
          <p className="text-body" style={{ maxWidth: '440px', margin: '0 auto 20px' }}>
            Anda belum memiliki riwayat pengajuan izin. Klik menu <strong>Ajukan Izin</strong> pada sidebar jika Anda berhalangan hadir.
          </p>
        </Card>
      )}

      {/* List Kartu Izin Real dari Akun Pengguna */}
      {!loading && daftarIzin.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {daftarIzin.map((item) => {
            const rawStart = item.tanggal_mulai ? (typeof item.tanggal_mulai === 'string' ? item.tanggal_mulai.substring(0, 10) : item.tanggal_mulai) : '-';
            const rawEnd = item.tanggal_selesai ? (typeof item.tanggal_selesai === 'string' ? item.tanggal_selesai.substring(0, 10) : item.tanggal_selesai) : '-';
            const jenisLabel = item.jenis_izin ? item.jenis_izin.replace('_', ' ') : 'Izin';

            return (
              <Card key={item.id} hoverable={false} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 className="text-card-title" style={{ fontSize: '18px', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                        {jenisLabel}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: item.sesi === 'malam' ? 'rgba(245, 155, 35, 0.15)' : item.sesi === 'subuh' ? 'rgba(29, 185, 84, 0.15)' : 'var(--color-surface-l2)',
                        color: item.sesi === 'malam' ? 'var(--color-warning)' : item.sesi === 'subuh' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontWeight: '700',
                        border: '1px solid var(--color-border)'
                      }}>
                        {item.sesi === 'malam' ? 'Sesi Malam Saja' : item.sesi === 'subuh' ? 'Sesi Subuh Saja' : 'Semua Sesi'}
                      </span>
                    </div>
                    <span className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '2px', display: 'block' }}>
                      Periode: <strong>{rawStart}</strong> s/d <strong>{rawEnd}</strong>
                    </span>
                  </div>
                  <Badge variant={item.status === 'disetujui' ? 'success' : item.status === 'ditolak' ? 'error' : 'warning'}>
                    {item.status === 'pending' ? 'Menunggu Konfirmasi' : item.status}
                  </Badge>
                </div>

                <p className="text-body-white" style={{ marginBottom: '16px', fontSize: '14px', lineHeight: 1.6 }}>
                  "{item.keterangan}"
                </p>

                {item.catatan_fasil && (
                  <div style={{
                    backgroundColor: 'var(--color-surface-l2)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${item.status === 'disetujui' ? 'var(--color-primary)' : 'var(--color-error)'}`,
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                      Catatan dari Fasilitator:
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                      {item.catatan_fasil}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-neutral)' }}>
                    <FileText size={16} />
                    <span>Lampiran: <strong style={{ color: 'var(--color-text-primary)' }}>{item.bukti_file ? item.bukti_file.split('/').pop() : 'Berkas Terlampir'}</strong></span>
                  </div>
                  {item.bukti_file && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={ExternalLink}
                      onClick={() => setPreviewFile(item.bukti_file)}
                    >
                      Buka Berkas
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Pratinjau Berkas Lampiran */}
      {previewFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 300,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            {/* Header Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-primary)" />
                <h3 className="text-card-title" style={{ margin: 0, fontSize: '15px' }}>
                  Pratinjau Berkas Lampiran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Isi Konten Pratinjau Berkas */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-surface-l2)'
            }}>
              {isImageFile(previewFile) ? (
                <img
                  src={getFileUrl(previewFile)}
                  alt="Bukti Izin"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '62vh',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : isPdfFile(previewFile) ? (
                <iframe
                  src={getFileUrl(previewFile)}
                  title="Pratinjau PDF"
                  style={{
                    width: '100%',
                    height: '62vh',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <FileText size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                  <p className="text-body" style={{ color: 'var(--color-text-primary)', fontWeight: '600' }}>
                    {previewFile.split('/').pop()}
                  </p>
                  <p className="text-small" style={{ marginTop: '4px' }}>
                    Klik tombol di bawah untuk membuka atau mengunduh berkas ini.
                  </p>
                </div>
              )}

              {/* Fallback jika gambar gagal dimuat */}
              <div style={{ display: 'none', textAlign: 'center', padding: '32px' }}>
                <AlertCircle size={36} color="var(--color-warning)" style={{ margin: '0 auto 8px' }} />
                <p className="text-body">Berkas: {previewFile.split('/').pop()}</p>
              </div>
            </div>

            {/* Footer Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface-l1)'
            }}>
              <span className="text-small" style={{ color: 'var(--color-neutral)' }}>
                {previewFile.split('/').pop()}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={getFileUrl(previewFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="sm" variant="secondary" icon={Download}>
                    Buka di Tab Baru
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
    </div>
  );
}
