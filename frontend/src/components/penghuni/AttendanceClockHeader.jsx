import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function AttendanceClockHeader({
  now,
  lokasi,
  onPerbaruiLokasi,
  formatJam,
  formatTanggal,
  getNamaWilayah
}) {
  return (
    <div className="resident-attendance-clock">
      <div>
        <span className="text-label">WAKTU SEKARANG</span>
        <time className="resident-live-clock" dateTime={now.toISOString()}>
          {formatJam(now)}
        </time>
        <span className="resident-live-date">{formatTanggal(now)} WIB</span>
      </div>

      <div className="resident-current-location">
        <div className="resident-location-info">
          <span className="resident-location-label">LOKASI ANDA SEKARANG</span>
          <strong>{lokasi.status === 'ready' ? getNamaWilayah(lokasi.coords) : 'Lokasi saat ini'}</strong>
          {lokasi.status === 'loading' && <span>Mencari lokasi...</span>}
          {lokasi.status === 'ready' && (
            <span>{lokasi.coords.latitude.toFixed(6)}, {lokasi.coords.longitude.toFixed(6)}</span>
          )}
          {lokasi.status === 'error' && <span className="resident-location-error">{lokasi.error}</span>}
        </div>
        <button
          type="button"
          className="resident-location-refresh"
          onClick={onPerbaruiLokasi}
          disabled={lokasi.status === 'loading'}
          aria-label="Perbarui lokasi"
          title="Perbarui lokasi"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
