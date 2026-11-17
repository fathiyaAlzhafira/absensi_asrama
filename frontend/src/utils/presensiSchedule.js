const jadwalPresensi = [
  { id: 'subuh', label: 'Subuh', mulai: 4 * 60, selesai: 6 * 60, jamMulai: '04.00', jamSelesai: '06.00' },
  { id: 'malam', label: 'Malam', mulai: 18 * 60, selesai: 20 * 60 + 30, jamMulai: '18.00', jamSelesai: '20.30' }
];

function getWibMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour').value);
  const minute = Number(parts.find((part) => part.type === 'minute').value);
  return hour * 60 + minute;
}

export function getWibDateKey(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getPresensiScheduleState(date = new Date()) {
  const minutes = getWibMinutes(date);
  const activeSession = jadwalPresensi.find(
    (session) => minutes >= session.mulai && minutes < session.selesai
  ) || null;

  let nextSession = null;
  if (!activeSession) {
    const isBeforeSubuh = minutes < jadwalPresensi[0].mulai;
    const isBeforeMalam = minutes >= jadwalPresensi[0].selesai && minutes < jadwalPresensi[1].mulai;
    const session = isBeforeSubuh ? jadwalPresensi[0] : isBeforeMalam ? jadwalPresensi[1] : jadwalPresensi[0];
    nextSession = { ...session, besok: !isBeforeSubuh && !isBeforeMalam };
  }

  return { activeSession, nextSession };
}
