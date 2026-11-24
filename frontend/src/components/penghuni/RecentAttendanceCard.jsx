import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';

export default function RecentAttendanceCard({
  riwayatLoading,
  riwayatTerbaru,
  tanggalHariIni,
  formatTanggalPendek,
  formatWaktuRiwayat
}) {
  return (
    <Card hoverable={false} className="resident-dashboard-section resident-recent-history">
      <div className="resident-history-section-header">
        <div>
          <span className="text-label">AKTIVITAS</span>
          <h2 className="text-card-title">Riwayat terbaru</h2>
        </div>
      </div>

      {riwayatLoading ? (
        <p className="text-body resident-history-empty">Memuat riwayat presensi...</p>
      ) : riwayatTerbaru.length > 0 ? (
        <div className="resident-recent-list">
          {riwayatTerbaru.map((record) => {
            const statusLower = String(record.status || '').toLowerCase();
            const isAlfa = statusLower === 'alpa' || statusLower === 'alfa';
            const isIzin = statusLower === 'izin';
            const iconStyle = isAlfa
              ? { color: 'var(--color-error)', background: 'rgba(226, 33, 52, 0.14)' }
              : isIzin
                ? { color: 'var(--color-warning)', background: 'rgba(245, 155, 35, 0.14)' }
                : { color: 'var(--color-primary)', background: 'rgba(29, 185, 84, 0.14)' };

            return (
              <div className="resident-recent-row" key={record.id}>
                <div className="resident-recent-icon" style={iconStyle}>
                  {isAlfa ? (
                    <XCircle size={17} />
                  ) : isIzin ? (
                    <FileText size={17} />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                </div>
                <div className="resident-recent-copy">
                  <strong>Presensi {record.sesi || 'Asrama'}</strong>
                  <span>
                    {formatTanggalPendek(record.tanggal || tanggalHariIni)}
                    {record.waktu && record.waktu !== '00:00:00' ? ` · ${formatWaktuRiwayat(record.waktu)}` : ''}
                  </span>
                </div>
                <Badge variant={record.status === 'hadir' ? 'success' : isIzin ? 'warning' : 'error'} size="sm">
                  {isAlfa ? 'alfa' : (record.status || 'tercatat')}
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-body resident-history-empty">Belum ada riwayat presensi.</p>
      )}

      <Link to="/penghuni/riwayat" className="resident-history-detail-link resident-history-detail-bottom">
        Lihat riwayat absensi lebih detail
      </Link>
    </Card>
  );
}
