import React, { useEffect, useRef, useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import RiwayatStatusIzin from '../../components/penghuni/RiwayatStatusIzin';
import { FileUp, FileText, CheckCircle2, AlertCircle, ChevronLeft, X, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { getStoredPresensiSchedule, savePresensiSchedule } from '../../utils/presensiSchedule';

const kategoriLabels = {
  pulang_kampung: 'Pulang ke Rumah / Kampung',
  sakit: 'Sakit / Rawat Inap',
  kegiatan_kampus: 'Kegiatan Akademik / Kampus',
  keperluan_keluarga: 'Keperluan Keluarga Mendesak',
  lainnya: 'Lainnya'
};

export default function PengajuanIzin() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [schedule, setSchedule] = useState(() => getStoredPresensiSchedule());
  const [formData, setFormData] = useState({
    jenis_izin: '',
    sesi: 'semua',
    tanggal_mulai: '',
    tanggal_selesai: '',
    keterangan: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingIzins, setExistingIzins] = useState([]);
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

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayStr();

  useEffect(() => {
    api.getMyIzins()
      .then((res) => {
        if (res && Array.isArray(res.data)) {
          setExistingIzins(res.data);
        }
      })
      .catch(() => {});

    api.getPengaturanPresensi()
      .then((res) => {
        if (res?.data) setSchedule(savePresensiSchedule(res.data));
      })
      .catch(() => {});
  }, [historyRefreshKey]);

  const getDurationDays = () => {
    if (!formData.tanggal_mulai) return null;
    if (formData.sesi !== 'semua') return 1;
    if (!formData.tanggal_selesai) return null;
    const start = new Date(formData.tanggal_mulai);
    const end = new Date(formData.tanggal_selesai);
    if (end < start) return -1;
    const diffTime = end.getTime() - start.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24)) + 1;
  };

  const durationDays = getDurationDays();

  const findOverlappingPermit = (startDateStr, endDateStr, chosenSesi = formData.sesi) => {
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
  };

  const handleSesiChange = (newSesi) => {
    setFormData((prev) => ({
      ...prev,
      sesi: newSesi,
      tanggal_selesai: newSesi !== 'semua' ? prev.tanggal_mulai : prev.tanggal_selesai
    }));
  };

  const handleSingleDateChange = (e) => {
    const newDate = e.target.value;
    if (newDate && newDate < todayStr) {
      setPopup({
        type: 'error',
        title: 'Tanggal Tidak Valid',
        message: 'Anda tidak dapat memilih tanggal yang sudah lampau. Silakan pilih tanggal hari ini atau yang akan datang.'
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tanggal_mulai: newDate,
      tanggal_selesai: newDate
    }));
  };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    if (newStart && newStart < todayStr) {
      setPopup({
        type: 'error',
        title: 'Tanggal Tidak Valid',
        message: 'Tanggal mulai izin tidak boleh tanggal yang sudah lampau. Silakan pilih tanggal hari ini atau yang akan datang.'
      });
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
  };

  const handleEndDateChange = (e) => {
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
  };

  const handleFileChange = (e) => {
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
  };

  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.jenis_izin) {
      setPopup({
        type: 'error',
        title: 'Formulir Belum Lengkap',
        message: 'Kategori izin wajib dipilih. Silakan tentukan alasan kategori izin Anda.'
      });
      return;
    }

    if (formData.sesi === 'semua') {
      if (!formData.tanggal_mulai) {
        setPopup({
          type: 'error',
          title: 'Formulir Belum Lengkap',
          message: 'Tanggal mulai izin wajib diisi.'
        });
        return;
      }
      if (!formData.tanggal_selesai) {
        setPopup({
          type: 'error',
          title: 'Formulir Belum Lengkap',
          message: 'Tanggal selesai izin wajib diisi.'
        });
        return;
      }
      if (formData.tanggal_mulai < todayStr || formData.tanggal_selesai < todayStr) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tidak dapat mengajukan izin pada tanggal yang sudah lampau.'
        });
        return;
      }
      if (formData.tanggal_selesai < formData.tanggal_mulai) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tanggal selesai izin tidak boleh lebih awal dari tanggal mulai izin.'
        });
        return;
      }
    } else {
      if (!formData.tanggal_mulai) {
        setPopup({
          type: 'error',
          title: 'Formulir Belum Lengkap',
          message: `Tanggal izin ${formData.sesi === 'malam' ? 'Sesi Malam' : 'Sesi Subuh'} wajib diisi.`
        });
        return;
      }
      if (formData.tanggal_mulai < todayStr) {
        setPopup({
          type: 'error',
          title: 'Tanggal Tidak Valid',
          message: 'Tidak dapat mengajukan izin pada tanggal yang sudah lampau.'
        });
        return;
      }
    }

    if (!formData.keterangan || !formData.keterangan.trim()) {
      setPopup({
        type: 'error',
        title: 'Formulir Belum Lengkap',
        message: 'Alasan detail izin wajib diisi secara jelas.'
      });
      return;
    }

    if (!selectedFile) {
      setPopup({
        type: 'error',
        title: 'Formulir Belum Lengkap',
        message: 'Berkas lampiran bukti izin (JPG, PNG, atau PDF) wajib diunggah.'
      });
      return;
    }

    const targetEnd = formData.sesi === 'semua' ? formData.tanggal_selesai : formData.tanggal_mulai;
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
        kategori: kategoriLabels[formData.jenis_izin] || formData.jenis_izin,
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
  };

  return (
    <div className="resident-page resident-pengajuan-izin">
      <div className="resident-permission-heading">
        <div className="resident-page-heading">
          <div className="resident-subpage-banner">
            <Link to="/penghuni/dashboard" className="resident-subpage-back" aria-label="Kembali ke beranda" title="Kembali ke beranda">
              <ChevronLeft size={22} />
            </Link>
            <h1 className="resident-subpage-title">Form Pengajuan Izin</h1>
          </div>
        </div>
      </div>

      <div className="resident-permission-layout">
        <div className="resident-permission-form">
          <Card hoverable={false} className="resident-form-card">
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                    Pilihan Sesi Izin Absen <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>
                    Pilih sesi yang ingin diizinkan
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleSesiChange('semua')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: formData.sesi === 'semua' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: formData.sesi === 'semua' ? 'rgba(29, 185, 84, 0.12)' : 'var(--color-surface-l2)',
                      color: formData.sesi === 'semua' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontWeight: formData.sesi === 'semua' ? '700' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>Semua Sesi</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>Subuh &amp; Malam (Seharian)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSesiChange('malam')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: formData.sesi === 'malam' ? '2px solid var(--color-warning)' : '1px solid var(--color-border)',
                      backgroundColor: formData.sesi === 'malam' ? 'rgba(245, 155, 35, 0.12)' : 'var(--color-surface-l2)',
                      color: formData.sesi === 'malam' ? 'var(--color-warning)' : 'var(--color-text-primary)',
                      fontWeight: formData.sesi === 'malam' ? '700' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>Hanya Sesi Malam</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>
                      {schedule.jam_malam_mulai} – {schedule.jam_malam_selesai} WIB
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSesiChange('subuh')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: formData.sesi === 'subuh' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: formData.sesi === 'subuh' ? 'rgba(29, 185, 84, 0.12)' : 'var(--color-surface-l2)',
                      color: formData.sesi === 'subuh' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontWeight: formData.sesi === 'subuh' ? '700' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      textAlign: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>Hanya Sesi Subuh</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>
                      {schedule.jam_subuh_mulai} – {schedule.jam_subuh_selesai} WIB
                    </span>
                  </button>
                </div>

                <div style={{
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-surface-l1)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--color-border)'
                }}>
                  {formData.sesi === 'malam' && (
                    <span><strong>Info:</strong> Anda mengajukan izin <strong>Hanya untuk Sesi Malam</strong> pada 1 tanggal yang dipilih. Di keesokan paginya, Anda tetap dapat melakukan presensi Subuh seperti biasa.</span>
                  )}
                  {formData.sesi === 'subuh' && (
                    <span><strong>Info:</strong> Anda mengajukan izin <strong>Hanya untuk Sesi Subuh</strong> pada 1 tanggal yang dipilih. Pada malam harinya, Anda tetap dapat melakukan presensi Malam di asrama.</span>
                  )}
                  {formData.sesi === 'semua' && (
                    <span><strong>Info:</strong> Izin mencakup <strong>Seluruh Sesi</strong> (Subuh &amp; Malam) selama rentang tanggal berlangsung.</span>
                  )}
                </div>
              </div>

              {/* 3. Pilihan Tanggal Izin */}
              {formData.sesi === 'semua' ? (
                <div className="resident-date-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                  <Input
                    type="date"
                    label="Tanggal Mulai Izin"
                    required
                    value={formData.tanggal_mulai}
                    onChange={handleStartDateChange}
                    min={todayStr}
                  />
                  <Input
                    type="date"
                    label="Tanggal Selesai Izin"
                    required
                    value={formData.tanggal_selesai}
                    onChange={handleEndDateChange}
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
                    onChange={handleSingleDateChange}
                    min={todayStr}
                  />
                </div>
              )}

              {/* Total Durasi Izin */}
              {durationDays !== null && durationDays > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--color-surface-l2)',
                  border: '1px solid var(--color-border)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)'
                }}>
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
                  <div style={{
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    backgroundColor: 'var(--color-surface-l2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(29, 185, 84, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={22} color="var(--color-primary)" />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: 'var(--color-text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {selectedFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Berkas Terlampir'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
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
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

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
        </div>

        <RiwayatStatusIzin refreshKey={historyRefreshKey} />
      </div>

      {/* Pop Up Modal (Berhasil / Tidak Berhasil) */}
      {popup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'popupFadeIn 0.25s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            border: popup.type === 'success' ? '1px solid rgba(29, 185, 84, 0.4)' : '1px solid rgba(226, 33, 52, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            padding: '28px 24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => {
                const wasSuccess = popup.type === 'success';
                setPopup(null);
                if (wasSuccess) {
                  document.getElementById('riwayat-izin')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-neutral)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: popup.type === 'success' ? 'rgba(29, 185, 84, 0.15)' : 'rgba(226, 33, 52, 0.15)',
              border: popup.type === 'success' ? '2px solid var(--color-primary)' : '2px solid var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              {popup.type === 'success' ? (
                <CheckCircle2 size={36} color="var(--color-primary)" />
              ) : (
                <AlertCircle size={36} color="var(--color-error)" />
              )}
            </div>

            <h3 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              margin: '0 0 8px 0'
            }}>
              {popup.title}
            </h3>

            <p style={{
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              margin: '0 0 20px 0',
              lineHeight: 1.5
            }}>
              {popup.message}
            </p>

            {popup.type === 'success' && popup.details && (
              <div style={{
                width: '100%',
                backgroundColor: 'var(--color-surface-l2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: '20px',
                textAlign: 'left',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-neutral)' }}>Kategori Izin:</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{popup.details.kategori}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-neutral)' }}>Sesi:</span>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{popup.details.sesi}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-neutral)' }}>Tanggal:</span>
                  <strong style={{ color: 'var(--color-primary)' }}>{popup.details.tanggal}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-neutral)' }}>Berkas Bukti:</span>
                  <span style={{
                    color: 'var(--color-text-primary)',
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {popup.details.berkas}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
              {popup.type === 'success' ? (
                <Button
                  variant="primary"
                  size="md"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setPopup(null);
                    document.getElementById('riwayat-izin')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Lihat Status Izin Saya
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  style={{ width: '100%' }}
                  onClick={() => setPopup(null)}
                >
                  Tutup &amp; Periksa Kembali
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
