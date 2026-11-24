import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import { getStoredPresensiSchedule, savePresensiSchedule } from '../../../utils/presensiSchedule';
import { calculateDurationDays, checkClosedTodaySession } from './izinValidation';

export const KATEGORI_LABELS = {
  pulang_kampung: 'Pulang ke Rumah / Kampung',
  sakit: 'Sakit / Rawat Inap',
  kegiatan_kampus: 'Kegiatan Akademik / Kampus',
  keperluan_keluarga: 'Keperluan Keluarga Mendesak',
  lainnya: 'Lainnya'
};

/**
 * Custom hook to encapsulate state and business logic for Pengajuan Izin.
 */
export function usePengajuanIzin() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [schedule, setSchedule] = useState(() => getStoredPresensiSchedule());
  const [formData, setFormData] = useState({
    jenis_izin: '',
    sesi: 'semua',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keterangan: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingIzins, setExistingIzins] = useState([]);
  const [existingPresensis, setExistingPresensis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  useEffect(() => {
    if (location.hash !== '#riwayat-izin') return undefined;
    const timerId = window.setTimeout(() => {
      document.getElementById('riwayat-izin')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timerId);
  }, [location.hash]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    api.getMyIzins()
      .then((res) => {
        if (res && Array.isArray(res.data)) setExistingIzins(res.data);
      })
      .catch(() => {});

    api.getMyPresensi()
      .then((res) => {
        if (res && Array.isArray(res.data)) setExistingPresensis(res.data);
      })
      .catch(() => {});

    api.getPengaturanPresensi()
      .then((res) => {
        if (res?.data) setSchedule(savePresensiSchedule(res.data));
      })
      .catch(() => {});
  }, [historyRefreshKey]);

  const durationDays = useMemo(() => {
    return calculateDurationDays(formData.tanggal_mulai, formData.tanggal_selesai, formData.sesi);
  }, [formData.tanggal_mulai, formData.tanggal_selesai, formData.sesi]);

  const findAttendedPresensi = useCallback(
    (startDateStr, endDateStr, chosenSesi = formData.sesi) => {
      if (!startDateStr || !endDateStr) return null;
      const newStart = startDateStr.substring(0, 10);
      const newEnd = endDateStr.substring(0, 10);

      return existingPresensis.find((p) => {
        const st = String(p.status || '').toLowerCase();
        if (!['hadir', 'terlambat', 'alpa', 'alfa'].includes(st)) return false;
        const pDate = typeof p.tanggal === 'string' ? p.tanggal.substring(0, 10) : '';
        if (!pDate || pDate < newStart || pDate > newEnd) return false;
        if (chosenSesi === 'semua') return true;
        return p.sesi === chosenSesi;
      });
    },
    [existingPresensis, formData.sesi]
  );

  const findOverlappingPermit = useCallback(
    (startDateStr, endDateStr, chosenSesi = formData.sesi) => {
      if (!startDateStr || !endDateStr) return null;
      const newStart = startDateStr.substring(0, 10);
      const newEnd = endDateStr.substring(0, 10);

      return existingIzins.find((izin) => {
        if (izin.status === 'ditolak') return false;

        const existStart = typeof izin.tanggal_mulai === 'string' ? izin.tanggal_mulai.substring(0, 10) : '';
        const existEnd = typeof izin.tanggal_selesai === 'string' ? izin.tanggal_selesai.substring(0, 10) : '';
        if (!existStart || !existEnd) return false;

        const dateOverlap = newStart <= existEnd && newEnd >= existStart;
        if (!dateOverlap) return false;

        const existSesi = izin.sesi || 'semua';
        if (chosenSesi === 'semua' || existSesi === 'semua') return true;
        return chosenSesi === existSesi;
      });
    },
    [existingIzins, formData.sesi]
  );

  const handleSesiChange = useCallback(
    (newSesi) => {
      if (formData.tanggal_mulai === todayStr) {
        const closedErr = checkClosedTodaySession(todayStr, newSesi, todayStr, schedule);
        if (closedErr) {
          setPopup({ type: 'error', title: closedErr.title, message: closedErr.message });
        }
      }
      setFormData((prev) => ({
        ...prev,
        sesi: newSesi,
        tanggal_selesai: newSesi !== 'semua' ? prev.tanggal_mulai : prev.tanggal_selesai
      }));
    },
    [formData.tanggal_mulai, todayStr, schedule]
  );

  const handleSingleDateChange = useCallback(
    (e) => {
      const newDate = e.target.value;
      if (newDate && newDate < todayStr) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Anda tidak dapat memilih tanggal yang sudah lampau. Silakan pilih tanggal hari ini atau yang akan datang.'
        });
        return;
      }

      const closedErr = checkClosedTodaySession(newDate, formData.sesi, todayStr, schedule);
      if (closedErr) {
        setPopup({ type: 'error', title: closedErr.title, message: closedErr.message });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        tanggal_mulai: newDate,
        tanggal_selesai: newDate
      }));
    },
    [todayStr, formData.sesi, schedule]
  );

  const handleStartDateChange = useCallback(
    (e) => {
      const newStart = e.target.value;
      if (newStart && newStart < todayStr) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tanggal mulai izin tidak boleh tanggal yang sudah lampau. Silakan pilih tanggal hari ini atau yang akan datang.'
        });
        return;
      }

      const closedErr = checkClosedTodaySession(newStart, formData.sesi, todayStr, schedule);
      if (closedErr) {
        setPopup({ type: 'error', title: closedErr.title, message: closedErr.message });
        return;
      }

      setFormData((prev) => {
        let updatedEnd = prev.tanggal_selesai;
        if (updatedEnd && updatedEnd < newStart) {
          updatedEnd = newStart;
        }
        return {
          ...prev,
          tanggal_mulai: newStart,
          tanggal_selesai: updatedEnd
        };
      });
    },
    [todayStr, formData.sesi, schedule]
  );

  const handleEndDateChange = useCallback(
    (e) => {
      const newEnd = e.target.value;
      if (newEnd && newEnd < todayStr) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tanggal selesai izin tidak boleh tanggal yang sudah lampau.'
        });
        return;
      }

      if (formData.tanggal_mulai && newEnd && newEnd < formData.tanggal_mulai) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tanggal selesai izin tidak boleh lebih awal dari tanggal mulai izin.'
        });
        return;
      }

      setFormData((prev) => ({ ...prev, tanggal_selesai: newEnd }));
    },
    [todayStr, formData.tanggal_mulai]
  );

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPopup({
        type: 'error',
        title: 'Ukuran File Terlalu Besar',
        message: 'Ukuran berkas maksimal adalah 5MB. Silakan pilih file dokumen yang lebih kecil.'
      });
      return;
    }

    const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setPopup({
        type: 'error',
        title: 'Format File Tidak Didukung',
        message: 'Harap unggah berkas bukti dengan format JPG, PNG, atau PDF.'
      });
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleRemoveFile = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const validateSubmission = useCallback(() => {
    if (!formData.jenis_izin) {
      return { title: 'Formulir Belum Lengkap', message: 'Kategori izin wajib dipilih. Silakan tentukan alasan kategori izin Anda.' };
    }

    if (formData.sesi === 'semua') {
      if (!formData.tanggal_mulai) {
        return { title: 'Formulir Belum Lengkap', message: 'Tanggal mulai izin wajib diisi.' };
      }
      if (!formData.tanggal_selesai) {
        return { title: 'Formulir Belum Lengkap', message: 'Tanggal selesai izin wajib diisi.' };
      }
      if (formData.tanggal_mulai < todayStr || formData.tanggal_selesai < todayStr) {
        return { title: 'Tanggal Tidak Valid', message: 'Tidak dapat mengajukan izin pada tanggal yang sudah lampau.' };
      }
      if (formData.tanggal_selesai < formData.tanggal_mulai) {
        return { title: 'Tanggal Tidak Valid', message: 'Tanggal selesai izin tidak boleh lebih awal dari tanggal mulai izin.' };
      }
    } else {
      if (!formData.tanggal_mulai) {
        return {
          title: 'Formulir Belum Lengkap',
          message: `Tanggal izin ${formData.sesi === 'malam' ? 'Sesi Malam' : 'Sesi Subuh'} wajib diisi.`
        };
      }
      if (formData.tanggal_mulai < todayStr) {
        return { title: 'Tanggal Tidak Valid', message: 'Tidak dapat mengajukan izin pada tanggal yang sudah lampau.' };
      }
    }

    if (!formData.keterangan || !formData.keterangan.trim()) {
      return { title: 'Formulir Belum Lengkap', message: 'Alasan detail izin wajib diisi secara jelas.' };
    }

    if (!selectedFile) {
      return { title: 'Formulir Belum Lengkap', message: 'Berkas lampiran bukti izin (JPG, PNG, atau PDF) wajib diunggah.' };
    }

    return null;
  }, [formData, todayStr, selectedFile]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationErr = validateSubmission();
      if (validationErr) {
        setPopup({ type: 'error', title: validationErr.title, message: validationErr.message });
        return;
      }

      const targetEnd = formData.sesi === 'semua' ? formData.tanggal_selesai : formData.tanggal_mulai;

      const closedSessionError = checkClosedTodaySession(formData.tanggal_mulai, formData.sesi, todayStr, schedule);
      if (closedSessionError) {
        setPopup({ type: 'error', title: closedSessionError.title, message: closedSessionError.message });
        return;
      }

      const attended = findAttendedPresensi(formData.tanggal_mulai, targetEnd, formData.sesi);
      if (attended) {
        const attendedDate = typeof attended.tanggal === 'string' ? attended.tanggal.substring(0, 10) : formData.tanggal_mulai;
        const attendedSesiLabel = attended.sesi === 'subuh' ? 'Sesi Subuh' : 'Sesi Malam';
        const isAlfa = ['alpa', 'alfa'].includes(String(attended.status || '').toLowerCase());
        const saranSesi = attended.sesi === 'subuh' ? 'Hanya Sesi Malam' : 'Hanya Sesi Subuh';
        setPopup({
          type: 'error',
          title: isAlfa ? 'Sesi Sudah Tercatat Alfa' : 'Presensi Sudah Tercatat',
          message: isAlfa
            ? `${attendedSesiLabel} pada tanggal ${attendedDate} sudah berakhir dan tercatat Alfa. Pengajuan izin hanya dapat dilakukan sebelum sesi presensi berakhir.`
            : formData.sesi === 'semua'
              ? `Anda sudah melakukan presensi ${attendedSesiLabel} pada tanggal ${attendedDate}. Tidak dapat mengajukan izin 'Semua Sesi' pada hari yang sesinya sudah dihadiri (pilih '${saranSesi}' jika ingin izin untuk sesi lainnya).`
              : `Anda sudah melakukan presensi ${attendedSesiLabel} pada tanggal ${attendedDate}. Tidak dapat mengajukan izin untuk sesi yang sudah dihadiri.`
        });
        return;
      }

      const overlap = findOverlappingPermit(formData.tanggal_mulai, targetEnd, formData.sesi);
      if (overlap) {
        const overlapStart = overlap.tanggal_mulai ? overlap.tanggal_mulai.substring(0, 10) : '';
        const overlapEnd = overlap.tanggal_selesai ? overlap.tanggal_selesai.substring(0, 10) : '';
        const statusText = overlap.status === 'pending' ? 'menunggu konfirmasi' : 'sudah disetujui';
        const sesiText = overlap.sesi === 'subuh' ? 'Sesi Subuh' : overlap.sesi === 'malam' ? 'Sesi Malam' : 'Semua Sesi';
        setPopup({
          type: 'error',
          title: 'Jadwal Izin Bertabrakan',
          message: `Anda sudah memiliki pengajuan izin pada rentang tanggal ${overlapStart} s/d ${overlapEnd} (${sesiText} - status: ${statusText}). Anda tidak dapat mengajukan izin pada sesi yang bertabrakan.`
        });
        return;
      }

      setLoading(true);
      try {
        const dataPayload = new FormData();
        dataPayload.append('jenis_izin', formData.jenis_izin);
        dataPayload.append('sesi', formData.sesi);
        dataPayload.append('tanggal_mulai', formData.tanggal_mulai);
        dataPayload.append('tanggal_selesai', targetEnd);
        dataPayload.append('keterangan', formData.keterangan.trim());
        dataPayload.append('bukti_file', selectedFile);

        const response = await api.submitIzin(dataPayload);
        if (response?.status !== 'success') {
          throw new Error(response?.message || 'Pengajuan izin gagal dikirim.');
        }

        const submittedDetails = {
          kategori: KATEGORI_LABELS[formData.jenis_izin] || formData.jenis_izin,
          sesi: formData.sesi === 'malam' ? 'Hanya Sesi Malam' : formData.sesi === 'subuh' ? 'Hanya Sesi Subuh' : 'Semua Sesi (Subuh & Malam)',
          tanggal: formData.sesi === 'semua' && formData.tanggal_mulai !== targetEnd
            ? `${formData.tanggal_mulai} s/d ${targetEnd}`
            : formData.tanggal_mulai,
          berkas: selectedFile.name
        };

        setHistoryRefreshKey((key) => key + 1);
        setFormData({
          jenis_izin: '',
          sesi: 'semua',
          tanggal_mulai: '',
          tanggal_selesai: '',
          keterangan: ''
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setPopup({
          type: 'success',
          title: 'Pengajuan Izin Berhasil!',
          message: 'Permohonan izin Anda telah berhasil dikirimkan dan tersimpan dalam sistem. Silakan menunggu proses verifikasi oleh Fasilitator.',
          details: submittedDetails
        });
      } catch (err) {
        setPopup({
          type: 'error',
          title: 'Pengajuan Izin Gagal',
          message: err.message || 'Terjadi kendala saat mengirimkan pengajuan izin ke server.'
        });
      } finally {
        setLoading(false);
      }
    },
    [
      validateSubmission,
      formData,
      selectedFile,
      todayStr,
      schedule,
      findAttendedPresensi,
      findOverlappingPermit
    ]
  );

  return {
    schedule,
    formData,
    setFormData,
    selectedFile,
    fileInputRef,
    loading,
    popup,
    setPopup,
    historyRefreshKey,
    setHistoryRefreshKey,
    todayStr,
    durationDays,
    handleSesiChange,
    handleSingleDateChange,
    handleStartDateChange,
    handleEndDateChange,
    handleFileChange,
    handleRemoveFile,
    handleSubmit
  };
}
