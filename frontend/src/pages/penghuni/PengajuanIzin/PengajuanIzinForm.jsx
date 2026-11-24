import React from 'react';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { Clock } from 'lucide-react';
import SesiSelector from './SesiSelector';
import FileUploadDropzone from './FileUploadDropzone';

export default function PengajuanIzinForm({
  formData,
  setFormData,
  schedule,
  durationDays,
  todayStr,
  selectedFile,
  fileInputRef,
  loading,
  onSesiChange,
  onSingleDateChange,
  onStartDateChange,
  onEndDateChange,
  onFileChange,
  onRemoveFile,
  onSubmit
}) {
  return (
    <Card hoverable={false} className="resident-form-card">
      <form onSubmit={onSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 1. Kategori Izin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
            Kategori Izin <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <select
            value={formData.jenis_izin}
            onChange={(e) => setFormData({ ...formData, jenis_izin: e.target.value })}
            required
            style={{
              height: '42px',
              backgroundColor: 'var(--color-surface-l2)',
              color: formData.jenis_izin ? 'var(--color-text-primary)' : 'var(--color-neutral)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              padding: '0 12px',
              fontSize: '14px',
              fontFamily: 'var(--font-family)',
              outline: 'none'
            }}
          >
            <option value="" disabled>-- Pilih Kategori Izin --</option>
            <option value="pulang_kampung">Pulang ke Rumah / Kampung</option>
            <option value="sakit">Sakit / Rawat Inap</option>
            <option value="kegiatan_kampus">Kegiatan Akademik / Kampus</option>
            <option value="keperluan_keluarga">Keperluan Keluarga Mendesak</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>

        {/* 2. Pilihan Sesi Izin */}
        <SesiSelector
          sesi={formData.sesi}
          schedule={schedule}
          onSesiChange={onSesiChange}
        />

        {/* 3. Pilihan Tanggal Izin */}
        {formData.sesi === 'semua' ? (
          <div className="resident-date-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <Input
              type="date"
              label="Tanggal Mulai Izin"
              required
              value={formData.tanggal_mulai}
              onChange={onStartDateChange}
              min={todayStr}
            />
            <Input
              type="date"
              label="Tanggal Selesai Izin"
              required
              value={formData.tanggal_selesai}
              onChange={onEndDateChange}
              min={formData.tanggal_mulai || todayStr}
            />
          </div>
        ) : (
          <div>
            <Input
              type="date"
              label={formData.sesi === 'malam' ? 'Tanggal Izin (Sesi Malam)' : 'Tanggal Izin (Sesi Subuh)'}
              required
              value={formData.tanggal_mulai}
              onChange={onSingleDateChange}
              min={todayStr}
            />
          </div>
        )}

        {/* Total Durasi Izin */}
        {durationDays !== null && durationDays > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-surface-l2)',
              border: '1px solid var(--color-border)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--color-text-primary)'
            }}
          >
            <Clock size={16} color="var(--color-primary)" />
            <span>
              Total Durasi Izin: <strong style={{ color: 'var(--color-primary)' }}>{durationDays} Hari</strong>{' '}
              {formData.sesi === 'semua' && formData.tanggal_mulai !== formData.tanggal_selesai
                ? `(${formData.tanggal_mulai} s/d ${formData.tanggal_selesai})`
                : `(${formData.tanggal_mulai})`}{' '}
              •{' '}
              <strong style={{ color: formData.sesi === 'malam' ? 'var(--color-warning)' : 'var(--color-primary)' }}>
                {formData.sesi === 'malam' ? 'Hanya Sesi Malam' : formData.sesi === 'subuh' ? 'Hanya Sesi Subuh' : 'Semua Sesi (Subuh & Malam)'}
              </strong>
            </span>
          </div>
        )}

        {/* 4. Alasan Detail Izin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
            Alasan Detail Izin <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <textarea
            rows="4"
            required
            placeholder="Tuliskan keterangan dan alasan permohonan izin secara jelas..."
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
              resize: 'vertical',
              lineHeight: 1.5
            }}
          />
        </div>

        {/* 5. Berkas Lampiran Bukti */}
        <FileUploadDropzone
          selectedFile={selectedFile}
          fileInputRef={fileInputRef}
          onFileChange={onFileChange}
          onRemoveFile={onRemoveFile}
        />

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
  );
}
