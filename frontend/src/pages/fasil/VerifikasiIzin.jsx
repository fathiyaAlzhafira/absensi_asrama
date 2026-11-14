import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Check, X, FileText, Download, MessageSquare, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function VerifikasiIzin() {
  const [permohonan, setPermohonan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [modalAction, setModalAction] = useState(null); // { id, type: 'disetujui' | 'ditolak' }
  const [catatanFasil, setCatatanFasil] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPending = () => {
    setLoading(true);
    api.getPendingIzins()
      .then((res) => {
        if (res && res.data) {
          setPermohonan(res.data);
        } else {
          setPermohonan([]);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat izin pending:', err);
        setPermohonan([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleOpenActionModal = (id, type) => {
    setModalAction({ id, type });
    setCatatanFasil(type === 'disetujui' ? 'Disetujui.' : 'Alasan penolakan: ');
  };

  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setActionLoading(true);
    try {
      await api.verifyIzin(modalAction.id, modalAction.type, catatanFasil);
      setModalAction(null);
      loadPending();
    } catch (err) {
      alert(err.message || 'Gagal memproses verifikasi izin.');
    } finally {
      setActionLoading(false);
    }
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

  const isPdfFile = (filePath) => {
    if (!filePath) return false;
    return filePath.toLowerCase().endsWith('.pdf');
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Verifikasi Pengajuan Izin</h1>
        <p className="text-body">Tinjau berkas bukti lampiran dan berikan keputusan verifikasi bagi penghuni asrama</p>
      </div>

      {/* Loading State */}
      {loading && (
        <Card hoverable={false} style={{ padding: '36px', textAlign: 'center' }}>
          <Clock size={28} color="var(--color-primary)" style={{ margin: '0 auto 12px', animation: 'spin 1.5s linear infinite' }} />
          <p className="text-body" style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
            Memuat permohonan izin yang menunggu verifikasi...
          </p>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </Card>
      )}

      {/* Empty State */}
      {!loading && permohonan.length === 0 && (
        <Card hoverable={false} style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Check size={44} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
          <h3 className="text-card-title" style={{ marginBottom: '6px' }}>Tidak Ada Permohonan Tertunda</h3>
          <p className="text-body" style={{ maxWidth: '440px', margin: '0 auto' }}>
            Semua permohonan izin penghuni asrama telah selesai ditinjau dan diverifikasi.
          </p>
        </Card>
      )}

      {/* List Izin Pending Real dari Database */}
      {!loading && permohonan.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {permohonan.map((item) => {
            const rawStart = item.tanggal_mulai ? (typeof item.tanggal_mulai === 'string' ? item.tanggal_mulai.substring(0, 10) : item.tanggal_mulai) : '-';
            const rawEnd = item.tanggal_selesai ? (typeof item.tanggal_selesai === 'string' ? item.tanggal_selesai.substring(0, 10) : item.tanggal_selesai) : '-';
            const jenisLabel = item.jenis_izin ? item.jenis_izin.replace('_', ' ') : 'Izin';
            const userName = item.user ? item.user.nama : (item.nama || 'Mahasiswa');
            const userNim = item.user ? item.user.nim : (item.nim || '-');
            const userKamar = (item.user && item.user.kamar) ? item.user.kamar.nomor_kamar : (item.kamar || '-');

            return (
              <Card key={item.id} hoverable={false} style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 className="text-card-title" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>
                        {userName}
                      </h3>
                      {userNim && <Badge variant="neutral">NIM: {userNim}</Badge>}
                      {userKamar && <Badge variant="neutral">Kamar {userKamar}</Badge>}
                      <Badge variant="warning">{jenisLabel}</Badge>
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
                    <div className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
                      Periode Izin: <strong style={{ color: 'var(--color-text-primary)' }}>{rawStart} s/d {rawEnd}</strong>
                    </div>
                  </div>
                  <Badge variant="warning">Menunggu Konfirmasi</Badge>
                </div>

                <div style={{
                  backgroundColor: 'var(--color-surface-l2)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '18px'
                }}>
                  <span className="text-label" style={{ color: 'var(--color-neutral)' }}>Alasan Pengajuan:</span>
                  <p className="text-body-white" style={{ marginTop: '4px', lineHeight: 1.5 }}>
                    "{item.keterangan || item.alasan}"
                  </p>
                </div>

                {/* Lampiran Bukti File & Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={20} color="var(--color-primary)" />
                    <span className="text-body-white" style={{ fontSize: '13px' }}>
                      Berkas Bukti: <strong>{(item.bukti_file || item.file || 'sample_bukti.pdf').split('/').pop()}</strong>
                    </span>
                    {(item.bukti_file || item.file) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={ExternalLink}
                        onClick={() => setPreviewFile(item.bukti_file || item.file)}
                      >
                        Lihat Berkas
                      </Button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                      size="md"
                      variant="danger"
                      icon={X}
                      onClick={() => handleOpenActionModal(item.id, 'ditolak')}
                    >
                      Tolak Izin
                    </Button>
                    <Button
                      size="md"
                      variant="primary"
                      icon={Check}
                      onClick={() => handleOpenActionModal(item.id, 'disetujui')}
                    >
                      Setujui Izin
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Popup Verifikasi Catatan Fasil */}
      {modalAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 400,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <h3 className="text-section-title" style={{ marginBottom: '12px', fontSize: '18px' }}>
              {modalAction.type === 'disetujui' ? 'Setujui Permohonan Izin' : 'Tolak Permohonan Izin'}
            </h3>
            <p className="text-body" style={{ marginBottom: '16px', fontSize: '13px' }}>
              Berikan catatan atau instruksi bimbingan kepada mahasiswa terkait status izin ini:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Catatan Fasilitator
              </label>
              <textarea
                rows="4"
                value={catatanFasil}
                onChange={(e) => setCatatanFasil(e.target.value)}
                placeholder="Tuliskan catatan arahan bagi mahasiswa..."
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-surface-l2)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="ghost"
                onClick={() => setModalAction(null)}
                disabled={actionLoading}
              >
                Batal
              </Button>
              <Button
                variant={modalAction.type === 'disetujui' ? 'primary' : 'danger'}
                onClick={handleConfirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Menyimpan...' : (modalAction.type === 'disetujui' ? 'Konfirmasi Setujui' : 'Konfirmasi Tolak')}
              </Button>
            </div>
          </div>
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
          zIndex: 500,
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
            overflow: 'hidden'
          }}>
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
                  Pratinjau Berkas Bukti Mahasiswa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

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
                    borderRadius: 'var(--radius-sm)'
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
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: '1px solid var(--color-border)'
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
