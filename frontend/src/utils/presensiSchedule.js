const DEFAULT_SCHEDULE = {
  jam_subuh_mulai: '04:00',
  jam_subuh_selesai: '06:00',
  jam_malam_mulai: '18:00',
  jam_malam_selesai: '20:30'
};

const STORAGE_KEY = 'asrama_presensi_schedule';

function normalizeTime(value, fallback) {
  const clean = String(value || '').trim().replace('.', ':');
  const match = clean.match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1]}:${match[2]}` : fallback;
}

function toMinutes(hhmm) {
  const [hour, minute] = hhmm.split(':').map(Number);
  return (hour * 60) + minute;
}

export function getStoredPresensiSchedule() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHEDULE;
    const parsed = JSON.parse(raw);
    return {
      jam_subuh_mulai: normalizeTime(parsed?.jam_subuh_mulai, DEFAULT_SCHEDULE.jam_subuh_mulai),
      jam_subuh_selesai: normalizeTime(parsed?.jam_subuh_selesai, DEFAULT_SCHEDULE.jam_subuh_selesai),
      jam_malam_mulai: normalizeTime(parsed?.jam_malam_mulai, DEFAULT_SCHEDULE.jam_malam_selesai ? parsed.jam_malam_mulai : DEFAULT_SCHEDULE.jam_malam_mulai),
      jam_malam_selesai: normalizeTime(parsed?.jam_malam_selesai, DEFAULT_SCHEDULE.jam_malam_selesai)
    };
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export function savePresensiSchedule(config) {
  const normalized = {
    jam_subuh_mulai: normalizeTime(config?.jam_subuh_mulai, DEFAULT_SCHEDULE.jam_subuh_mulai),
    jam_subuh_selesai: normalizeTime(config?.jam_subuh_selesai, DEFAULT_SCHEDULE.jam_subuh_selesai),
    jam_malam_mulai: normalizeTime(config?.jam_malam_mulai, DEFAULT_SCHEDULE.jam_malam_mulai),
    jam_malam_selesai: normalizeTime(config?.jam_malam_selesai, DEFAULT_SCHEDULE.jam_malam_selesai)
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('presensi-schedule-updated', { detail: normalized }));
  } catch {
    // Abaikan jika storage penuh
  }
  return normalized;
}

export function buildJadwalPresensi(config) {
  const activeConfig = config
    ? {
        jam_subuh_mulai: normalizeTime(config.jam_subuh_mulai, DEFAULT_SCHEDULE.jam_subuh_mulai),
        jam_subuh_selesai: normalizeTime(config.jam_subuh_selesai, DEFAULT_SCHEDULE.jam_subuh_selesai),
        jam_malam_mulai: normalizeTime(config.jam_malam_mulai, DEFAULT_SCHEDULE.jam_malam_mulai),
        jam_malam_selesai: normalizeTime(config.jam_malam_selesai, DEFAULT_SCHEDULE.jam_malam_selesai)
      }
    : getStoredPresensiSchedule();

  return [
    {
      id: 'subuh',
      label: 'Subuh',
      mulai: toMinutes(activeConfig.jam_subuh_mulai),
      selesai: toMinutes(activeConfig.jam_subuh_selesai),
      jamMulai: activeConfig.jam_subuh_mulai,
      jamSelesai: activeConfig.jam_subuh_selesai
    },
    {
      id: 'malam',
      label: 'Malam',
      mulai: toMinutes(activeConfig.jam_malam_mulai),
      selesai: toMinutes(activeConfig.jam_malam_selesai),
      jamMulai: activeConfig.jam_malam_mulai,
      jamSelesai: activeConfig.jam_malam_selesai
    }
  ];
}

function getWibMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour').value);
  const minute = Number(parts.find((part) => part.type === 'minute').value);
  return (hour * 60) + minute;
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

export function getPresensiScheduleState(date = new Date(), customSchedule = null) {
  const jadwalPresensi = buildJadwalPresensi(customSchedule);
  const minutes = getWibMinutes(date);
  const activeSession = jadwalPresensi.find(
    (session) => session.selesai > session.mulai && minutes >= session.mulai && minutes < session.selesai
  ) || null;

  let nextSession = null;
  if (!activeSession) {
    const isBeforeSubuh = minutes < jadwalPresensi[0].mulai;
    const isBeforeMalam = minutes >= jadwalPresensi[0].selesai && minutes < jadwalPresensi[1].mulai;
    const session = isBeforeSubuh ? jadwalPresensi[0] : isBeforeMalam ? jadwalPresensi[1] : jadwalPresensi[0];
    nextSession = { ...session, besok: !isBeforeSubuh && !isBeforeMalam };
  }

  return { activeSession, nextSession, jadwalPresensi };
}
