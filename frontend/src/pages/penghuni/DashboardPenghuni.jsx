import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import AttendanceCapture from '../../components/penghuni/AttendanceCapture';
import {
  CheckCircle2,
  FileText,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  getPresensiScheduleState,
  getStoredPresensiSchedule,
  getWibDateKey,
  savePresensiSchedule
} from '../../utils/presensiSchedule';
import { isPointInGeoJsonPolygon } from '../../utils/geofence';

const formatJam = (date) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
}).format(date);

const formatTanggal = (date) => new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
}).format(date);

const formatTanggalPendek = (tanggal) => {
  if (!tanggal) return '-';
  const date = new Date(`${String(tanggal).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(tanggal);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatWaktuRiwayat = (waktu) => waktu && waktu !== '00:00:00' ? waktu.slice(0, 5) : '--:--';

const getNamaWilayah = ({ latitude, longitude }) => {
  const sekitarPadang = latitude >= -1.35 && latitude <= -0.75 &&
    longitude >= 100.1 && longitude <= 100.7;
  return sekitarPadang ? 'Kota Padang, Sumatera Barat' : 'Wilayah tidak teridentifikasi';
};

export default function DashboardPenghuni() {
  const { user, setUser } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [scheduleConfig, setScheduleConfig] = useState(() => getStoredPresensiSchedule());
  const [todayStatus, setTodayStatus] = useState({ subuh: null, malam: null });
  const [building, setBuilding] = useState(null);
  const [room, setRoom] = useState(null);
  const [buildingError, setBuildingError] = useState('');
  const [riwayatTerbaru, setRiwayatTerbaru] = useState([]);
  const [riwayatLoading, setRiwayatLoading] = useState(true);
  const [statusError, setStatusError] = useState('');
  const [lokasi, setLokasi] = useState({ status: 'loading', coords: null, error: '' });

  const { activeSession, nextSession } = getPresensiScheduleState(now, scheduleConfig);
  const sessionStatus = activeSession ? todayStatus[activeSession.id] : null;
  const nextSessionStatus = !activeSession && nextSession && !nextSession.besok
    ? todayStatus[nextSession.id]
    : null;
  // Tombol ambil presensi tetap aktif apabila pengajuan izin masih pending (belum disetujui),
  // dan baru dinonaktifkan setelah presensi hadir tercatat atau izin resmi disetujui.
  const presensiTercatat = Boolean(sessionStatus && sessionStatus.status !== 'izin_pending');
  const buildingGeometry = building?.geofence_geojson || building?.polygon_geojson || building?.polygon || null;
  const geofenceStatus = building && !building.is_active
    ? 'inactive'
    : !buildingGeometry
      ? 'unconfigured'
      : lokasi.status !== 'ready'
        ? 'checking'
        : isPointInGeoJsonPolygon(lokasi.coords.latitude, lokasi.coords.longitude, buildingGeometry)
          ? 'inside'
          : 'outside';

  const perbaruiLokasi = useCallback(() => {
    if (!navigator.geolocation) {
      setLokasi({
        status: 'error',
        coords: null,
        error: 'Browser ini tidak mendukung akses lokasi.'
      });
      return;
    }

    setLokasi({ status: 'loading', coords: null, error: '' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLokasi({ status: 'ready', coords, error: '' }),
      (error) => {
        const pesan = {
          1: 'Izin lokasi belum diberikan. Aktifkan akses lokasi di pengaturan browser.',
          2: 'Lokasi belum dapat ditemukan. Coba pindah ke area terbuka.',
          3: 'Permintaan lokasi terlalu lama. Silakan coba lagi.'
        };
        setLokasi({
          status: 'error',
          coords: null,
          error: pesan[error.code] || 'Lokasi tidak dapat diakses saat ini.'
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    perbaruiLokasi();
  }, [perbaruiLokasi]);

  const muatGedungSaya = useCallback(() => {
    setBuildingError('');
    return api.getMyBuildingAssignment().then((response) => {
      const assignment = response?.data?.gedung || response?.data?.building || response?.data;
      const assignedRoom = response?.data?.kamar || null;
      setBuilding(assignment && typeof assignment === 'object' ? assignment : null);
      setRoom(assignedRoom && typeof assignedRoom === 'object' ? assignedRoom : null);
      if (assignment?.nama || assignedRoom?.nomor_kamar) {
        setUser((prev) => {
          if (!prev) return prev;
          const nextNomorKamar = assignedRoom?.nomor_kamar ?? prev.nomor_kamar ?? null;
          const nextGedung = assignment?.nama ?? prev.gedung ?? null;
          if (prev.nomor_kamar === nextNomorKamar && prev.kamar === nextNomorKamar && prev.gedung === nextGedung) {
            return prev;
          }
          return {
            ...prev,
            kamar_id: assignedRoom?.id ?? prev.kamar_id,
            nomor_kamar: nextNomorKamar,
            kamar: nextNomorKamar,
            gedung: nextGedung
          };
        });
      }
    }).catch((error) => {
      setBuildingError(error.message || 'Gedung tempat tinggal gagal dimuat.');
    });
  }, [setUser]);

  useEffect(() => {
    muatGedungSaya();
  }, [muatGedungSaya]);

  useEffect(() => {
    let active = true;

    Promise.allSettled([api.getTodayStatus(), api.getMyPresensi(), api.getPengaturanPresensi()]).then(([statusResult, historyResult, scheduleResult]) => {
      if (!active) return;

      if (scheduleResult.status === 'fulfilled' && scheduleResult.value?.data) {
        setScheduleConfig(savePresensiSchedule(scheduleResult.value.data));
      }

      const errors = [];
      let status = null;
      if (statusResult.status === 'fulfilled' && statusResult.value?.data) {
        status = statusResult.value.data;
        if (status.jadwal) {
          setScheduleConfig(savePresensiSchedule(status.jadwal));
        }
      } else {
        errors.push('Status presensi hari ini belum dapat dimuat.');
      }

      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value?.data)) {
        const history = [...historyResult.value.data].sort((a, b) => {
          const dateA = `${a.tanggal || ''} ${a.waktu || ''}`;
          const dateB = `${b.tanggal || ''} ${b.waktu || ''}`;
          return dateB.localeCompare(dateA);
        });
        setRiwayatTerbaru(history.slice(0, 3));

        if (!status) {
          const today = getWibDateKey(new Date());
          status = { subuh: null, malam: null };
          history
            .filter((record) => record.tanggal === today)
            .forEach((record) => {
              if (record.sesi === 'subuh' || record.sesi === 'malam') {
                status[record.sesi] = { status: record.status, waktu: record.waktu };
              }
            });
        }
      } else {
        errors.push('Riwayat presensi terbaru belum dapat dimuat.');
      }

      if (status) setTodayStatus(status);
      setRiwayatLoading(false);
      setStatusError(errors.length === 2 ? errors.join(' ') : '');
    });

    return () => {
      active = false;
    };
  }, []);

  const tanggalHariIni = getWibDateKey(now);
  const nomorKamar = room?.nomor_kamar || user?.nomor_kamar || user?.kamar;

  return (
    <div className="resident-page resident-dashboard">
      <Card hoverable={false} className="resident-greeting-card">
        <h1 className="text-page-title">Halo, {user?.nama || 'Penghuni Asrama'}</h1>
        <p className="text-body">
          {nomorKamar ? `Kamar ${nomorKamar} · ` : ''}
          {building?.nama || user?.gedung || 'Asrama Unand'}
        </p>
      </Card>

      <Card hoverable={false} className="resident-attendance-card">
        <div className="resident-attendance-clock">
          <div>
            <span className="text-label">WAKTU SEKARANG</span>
            <time className="resident-live-clock" dateTime={now.toISOString()}>{formatJam(now)}</time>
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
              onClick={perbaruiLokasi}
              disabled={lokasi.status === 'loading'}
              aria-label="Perbarui lokasi"
              title="Perbarui lokasi"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="resident-attendance-action">
          {activeSession ? (
            <>
              <div className="resident-attendance-copy">
                <h2 className="text-card-title">Presensi {activeSession.label} saat ini</h2>
                <p className="text-body">
                  Dibuka pukul {activeSession.jamMulai}–{activeSession.jamSelesai} WIB.
                </p>
                {buildingError && <p className="resident-dashboard-error">{buildingError}</p>}
                {sessionStatus && (
                  <p
                    className="resident-attendance-recorded"
                    style={sessionStatus.status === 'izin_pending' ? { color: 'var(--color-warning)' } : undefined}
                  >
                    {sessionStatus.status === 'izin'
                      ? `✓ Status Sesi ${activeSession.label}: Tercatat Izin (Disetujui). Anda tidak perlu mengambil presensi.`
                      : sessionStatus.status === 'izin_pending'
                        ? `Status Sesi ${activeSession.label}: Pengajuan izin sedang menunggu verifikasi.`
                        : `✓ Presensi ${activeSession.label} telah tercatat${sessionStatus.waktu ? ` pukul ${sessionStatus.waktu} WIB` : ''}.`}
                  </p>
                )}
                {statusError && <p className="resident-dashboard-error">{statusError}</p>}
              </div>

              {!presensiTercatat ? (
                <AttendanceCapture
                  session={activeSession}
                  coords={lokasi.status === 'ready' ? lokasi.coords : null}
                  building={building}
                  geofenceStatus={geofenceStatus}
                  pendingIzinId={sessionStatus?.status === 'izin_pending' ? sessionStatus?.izin_id : null}
                  onCancelPendingIzin={() => {
                    setTodayStatus((current) => ({
                      ...current,
                      [activeSession.id]: null
                    }));
                  }}
                  onOpenCamera={muatGedungSaya}
                  onSubmitted={() => {
                    const waktu = formatJam(new Date());
                    setTodayStatus((current) => ({
                      ...current,
                      [activeSession.id]: { status: 'hadir', waktu }
                    }));
                    setRiwayatTerbaru((current) => [{
                      id: `baru-${Date.now()}`,
                      tanggal: tanggalHariIni,
                      waktu,
                      sesi: activeSession.id,
                      status: 'hadir'
                    }, ...current].slice(0, 3));
                  }}
                />
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  disabled
                  className="resident-attendance-button"
                  style={sessionStatus.status === 'izin' ? {
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                    backgroundColor: 'rgba(29, 185, 84, 0.12)',
                    opacity: 1
                  } : undefined}
                >
                  {sessionStatus.status === 'izin'
                    ? `Tercatat Izin Sesi ${activeSession.label} (Tidak Perlu Absen)`
                    : sessionStatus.status === 'izin_pending'
                      ? `Menunggu Verifikasi Izin Sesi ${activeSession.label}`
                      : `Presensi ${activeSession.label} Sudah Tercatat`}
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="resident-attendance-copy">
                <h2 className="text-card-title">Presensi {nextSession.label} berikutnya</h2>
                <p className="text-body">
                  {nextSession.besok ? 'Dibuka besok' : 'Dibuka'} pukul {nextSession.jamMulai} WIB.
                </p>
                {nextSessionStatus && (
                  <p
                    className="resident-attendance-recorded"
                    style={nextSessionStatus.status === 'izin_pending' ? { color: 'var(--color-warning)' } : undefined}
                  >
                    {nextSessionStatus.status === 'izin'
                      ? `✓ Status Sesi ${nextSession.label}: Tercatat Izin (Disetujui). Anda tidak perlu mengambil presensi.`
                      : nextSessionStatus.status === 'izin_pending'
                        ? `Status Sesi ${nextSession.label}: Pengajuan izin sedang menunggu verifikasi.`
                        : `✓ Presensi ${nextSession.label} telah tercatat.`}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="lg"
                disabled
                className="resident-attendance-button"
                style={nextSessionStatus?.status === 'izin' ? {
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                  backgroundColor: 'rgba(29, 185, 84, 0.12)',
                  opacity: 1
                } : undefined}
              >
                {nextSessionStatus?.status === 'izin'
                  ? `Tercatat Izin Sesi ${nextSession.label} (Tidak Perlu Absen)`
                  : `Ambil presensi ${nextSession.label}`}
              </Button>
            </>
          )}
        </div>
      </Card>

      <div className="resident-dashboard-sections">
        <Card hoverable={false} className="resident-dashboard-section">
          <div className="resident-dashboard-section-heading">
            <div className="resident-dashboard-section-icon"><FileText size={20} /></div>
            <div className="resident-dashboard-section-copy">
              <h2 className="text-card-title">Perlu mengajukan izin?</h2>
              <p className="text-body">Kirim permohonan izin jika berhalangan mengikuti presensi.</p>
            </div>
          </div>
          <div className="resident-dashboard-section-actions">
            <Link to="/penghuni/izin/tambah" className="resident-dashboard-cta">
              Ajukan Izin
            </Link>
            <Link to="/penghuni/izin" className="resident-history-detail-link">Lihat status izin</Link>
          </div>
        </Card>

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
      </div>
    </div>
  );
}
