/**
 * Utility functions for date calculations, time checks, and validation in Pengajuan Izin.
 */

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function getCurrentWibMinutes() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return hour * 60 + minute;
}

export function calculateDurationDays(startDate, endDate, sesi) {
  if (!startDate) return null;
  if (sesi !== 'semua') return 1;
  if (!endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return -1;
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24)) + 1;
}

export function checkClosedTodaySession(startDateStr, chosenSesi, todayStr, schedule) {
  if (!startDateStr || startDateStr !== todayStr) return null;
  const currentMin = getCurrentWibMinutes();
  const subuhEndMin = toMinutes(schedule.jam_subuh_selesai);
  const malamEndMin = toMinutes(schedule.jam_malam_selesai);

  if (chosenSesi === 'subuh' && currentMin >= subuhEndMin) {
    return {
      title: 'Sesi Subuh Hari Ini Sudah Berakhir',
      message: `Batas waktu Sesi Subuh hari ini (pukul ${schedule.jam_subuh_selesai} WIB) sudah ditutup. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.`
    };
  }
  if (chosenSesi === 'malam' && currentMin >= malamEndMin) {
    return {
      title: 'Sesi Malam Hari Ini Sudah Berakhir',
      message: `Batas waktu Sesi Malam hari ini (pukul ${schedule.jam_malam_selesai} WIB) sudah ditutup. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.`
    };
  }
  if (chosenSesi === 'semua') {
    if (currentMin >= malamEndMin) {
      return {
        title: 'Sesi Presensi Hari Ini Sudah Berakhir',
        message: 'Seluruh sesi presensi hari ini (Subuh & Malam) sudah berakhir. Silakan ajukan izin mulai tanggal besok.'
      };
    }
    if (currentMin >= subuhEndMin) {
      return {
        title: 'Sesi Subuh Hari Ini Sudah Berakhir',
        message: `Sesi Subuh hari ini (pukul ${schedule.jam_subuh_selesai} WIB) sudah ditutup sehingga tidak dapat diajukan dalam 'Semua Sesi' untuk hari ini. Jika ingin izin untuk malam ini, pilih 'Hanya Sesi Malam', atau mulai izin 'Semua Sesi' dari tanggal besok.`
      };
    }
  }
  return null;
}
