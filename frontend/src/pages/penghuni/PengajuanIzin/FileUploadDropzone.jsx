import React from 'react';
import { FileUp, FileText, X } from 'lucide-react';

export default function FileUploadDropzone({
  selectedFile,
  fileInputRef,
  onFileChange,
  onRemoveFile
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Lampiran Bukti (JPG / PNG / PDF) <span style={{ color: 'var(--color-primary)' }}>*</span>
        </label>
        <span style={{ fontSize: '11px', color: 'var(--color-warning)', fontWeight: '600' }}>
          (Wajib diunggah)
        </span>
      </div>

      {selectedFile ? (
        <div
          style={{
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            backgroundColor: 'var(--color-surface-l2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(29, 185, 84, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={22} color="var(--color-primary)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {selectedFile.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Berkas Terlampir'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemoveFile}
            title="Ganti atau Hapus File"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 12px',
              fontSize: '12px',
              color: 'var(--color-error)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <X size={14} />
            <span>Hapus File</span>
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          style={{
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface-l2)',
            cursor: 'pointer',
            display: 'block',
            transition: 'border-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          <FileUp size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
          <p className="text-body-white" style={{ fontSize: '14px', fontWeight: '700' }}>
            Klik untuk memilih berkas bukti izin
          </p>
          <p className="text-small" style={{ marginTop: '4px', color: 'var(--color-neutral)' }}>
            Mendukung format berkas .JPG, .PNG, atau .PDF (Maksimal 5MB)
          </p>
          <input
            id="file-upload"
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </label>
      )}
    </div>
  );
}
