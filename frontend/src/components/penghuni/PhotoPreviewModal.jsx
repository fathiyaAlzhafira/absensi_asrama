import React from 'react';
import Button from '../common/Button';
import { X } from 'lucide-react';

export default function PhotoPreviewModal({ photoUrl, onClose }) {
  if (!photoUrl) return null;

  return (
    <div
      className="resident-photo-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="resident-photo-dialog">
        <div className="resident-photo-header">
          <h2 className="text-card-title">Foto Bukti Presensi</h2>
          <button
            type="button"
            className="resident-camera-close"
            onClick={onClose}
            aria-label="Tutup foto"
          >
            <X size={18} />
          </button>
        </div>
        <img src={photoUrl} alt="Foto selfie presensi" />
        <Button
          size="md"
          variant="secondary"
          onClick={onClose}
          style={{ width: '100%', textTransform: 'none', letterSpacing: 0 }}
        >
          Tutup
        </Button>
      </div>
    </div>
  );
}
