import React, { useEffect, useRef, useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import RiwayatStatusIzin from '../../components/penghuni/RiwayatStatusIzin';
import { CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';

export default function PengajuanIzin() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    jenis_izin: 'pulang_kampung',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keterangan: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (location.hash !== '#riwayat-izin') return undefined;
    const timerId = window.setTimeout(() => {
      document.getElementById('riwayat-izin')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [location.hash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tanggal_mulai || !formData.tanggal_selesai) {
      setError('Tanggal mulai dan selesai wajib diisi.');
      return;
    }
    if (formData.tanggal_selesai < formData.tanggal_mulai) {
      setError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const dataPayload = new FormData();
      dataPayload.append('jenis_izin', formData.jenis_izin);
      dataPayload.append('tanggal_mulai', formData.tanggal_mulai);
      dataPayload.append('tanggal_selesai', formData.tanggal_selesai);
      dataPayload.append('keterangan', formData.keterangan);
      if (selectedFile) {
        dataPayload.append('bukti_file', selectedFile);
      }

      const response = await api.submitIzin(dataPayload);
      if (response?.status !== 'success') {
        throw new Error(response?.message || 'Pengajuan izin gagal dikirim.');
      }
      setSuccess(true);
      setHistoryRefreshKey((key) => key + 1);
      setFormData({
        jenis_izin: 'pulang_kampung',
        tanggal_mulai: '',
        tanggal_selesai: '',
        keterangan: ''
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message || 'Pengajuan izin gagal dikirim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resident-page resident-pengajuan-izin">
      <div className="resident-permission-heading">
        <div className="resident-page-heading">
          <div className="resident-subpage-banner">
            <Link to="/penghuni/dashboard" className="resident-subpage-back" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ChevronLeft size={22} />
            </Link>
            <h1 className="resident-subpage-title">Form Pengajuan Izin</h1>
          </div>
        </div>
      </div>

      <div className="resident-permission-layout">
        <div className="resident-permission-form">
        <Card hoverable={false} className="resident-form-card">
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(226,33,52,0.15)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontSize: '13px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(29,185,84,0.15)',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              fontWeight: '700',
              fontSize: '13px'
            }}>
              <CheckCircle2 size={18} />
              <span>Pengajuan izin berhasil dikirimkan ke Fasilitator Asrama.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Kategori Izin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                Kategori Izin <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <select
                value={formData.jenis_izin}
                onChange={(e) => setFormData({ ...formData, jenis_izin: e.target.value })}
                style={{
                  height: '42px',
                  backgroundColor: 'var(--color-surface-l2)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                  outline: 'none'
                }}
              >
                <option value="pulang_kampung">Pulang ke Rumah / Kampung</option>
                <option value="sakit">Sakit / Rawat Inap</option>
                <option value="kegiatan_kampus">Kegiatan Akademik / Kampus</option>
                <option value="keperluan_keluarga">Keperluan Keluarga Mendesak</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            {/* Rentang Tanggal Izin */}
            <div className="resident-date-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
              <Input
                type="date"
                label="Tanggal Mulai Izin"
                required
                value={formData.tanggal_mulai}
                onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
              />
              <Input
                type="date"
                label="Tanggal Selesai Izin"
                required
                value={formData.tanggal_selesai}
                onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
              />
            </div>

            {/* Keterangan / Alasan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                Alasan Detail Izin <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <textarea
                rows="4"
                required
                placeholder="Tuliskan keterangan dan alasan permohonan izin..."
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                style={{
                  backgroundColor: 'var(--color-surface-l2)',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  padding: '12px',
                  fontSize: '14px',
                  fontFamily: 'var(--font-family)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Upload Bukti File (JPG / PDF) Sesuai Catatan Whiteboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                Lampiran Bukti (JPG / PDF)
              </label>
              <label
                htmlFor="file-upload"
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-surface-l2)',
                  cursor: 'pointer',
                  display: 'block'
                }}
              >
                <p className="text-body-white" style={{ fontSize: '13px' }}>
                  {selectedFile ? selectedFile.name : 'Klik untuk memilih file bukti'}
                </p>
                <p className="text-small" style={{ marginTop: '4px' }}>
                  Format yang didukung: JPG, PNG, atau PDF (Maksimal 5MB)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="resident-action-button"
              style={{ marginTop: '8px' }}
            >
              {loading ? 'Mengirim Pengajuan...' : 'Kirim Permohonan Izin'}
            </Button>
          </form>
        </Card>
        </div>
        <RiwayatStatusIzin refreshKey={historyRefreshKey} />
      </div>
    </div>
  );
}
