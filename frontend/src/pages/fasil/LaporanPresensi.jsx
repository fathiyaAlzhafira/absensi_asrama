import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { api } from '../../services/api';
import {
  FileText,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  BarChart3,
  Search,
  AlertCircle
} from 'lucide-react';

// Mengambil tanggal hari ini format YYYY-MM-DD
const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Mengambil tanggal awal bulan berjalan format YYYY-MM-DD
const getFirstDayOfMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

// Format tanggal tampilan Indonesia (contoh: 18 Nov 2026)
const formatTanggalIndo = (str) => {
  if (!str) return '-';
  const parts = str.split('-');
  if (parts.length !== 3) return str;
  const [y, m, d] = parts;
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(d, 10)} ${bulan[parseInt(m, 10) - 1]} ${y}`;
};

const statusConfig = {
  hadir: { label: 'Hadir', variant: 'success' },
  terlambat: { label: 'Terlambat', variant: 'warning' },
  izin: { label: 'Izin', variant: 'default' },
  alpa: { label: 'Alpa / Tidak Hadir', variant: 'error' },
  alfa: { label: 'Alpa / Tidak Hadir', variant: 'error' }
};

const selectStyle = {
  height: '42px',
  width: '100%',
  backgroundColor: 'var(--color-surface-l2)',
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontSize: '13.5px',
  outline: 'none',
  boxSizing: 'border-box'
};

const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export default function LaporanPresensi() {
  const [laporanData, setLaporanData] = useState([]);
  const [rekapMahasiswa, setRekapMahasiswa] = useState([]);
  const [ringkasan, setRingkasan] = useState({
    total_presensi: 0,
    jumlah_hadir: 0,
    jumlah_terlambat: 0,
    total_hadir: 0,
    jumlah_izin: 0,
    jumlah_tidak_hadir: 0,
    persentase_kehadiran: 0.0
  });
  const [gedungInfo, setGedungInfo] = useState(null);
  const [daftarKamarServer, setDaftarKamarServer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('mahasiswa'); // 'mahasiswa' atau 'detail'

  // State Filter
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [sesi, setSesi] = useState('Semua');
  const [kamar, setKamar] = useState('Semua');
  const [pencarian, setPencarian] = useState('');

  // Mengambil data laporan dari API
  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (sesi !== 'Semua') params.sesi = sesi;
      if (kamar !== 'Semua') params.kamar = kamar;
      if (pencarian.trim()) params.search = pencarian.trim();

      const res = await api.getLaporanPresensi(params);
      if (res && res.status === 'success') {
        const payload = res.data || {};
        setLaporanData(payload.data || []);
        setRekapMahasiswa(payload.rekap_mahasiswa || []);
        if (payload.ringkasan) {
          setRingkasan(payload.ringkasan);
        }
        if (payload.gedung) {
          setGedungInfo(payload.gedung);
        }
        if (Array.isArray(payload.kamars) && payload.kamars.length > 0) {
          setDaftarKamarServer(payload.kamars.map((k) => k.nomor_kamar));
        }
      } else {
        throw new Error(res?.message || 'Gagal memuat data laporan presensi.');
      }
    } catch (err) {
      console.error('Fetch laporan presensi error:', err);
      setError(err.message || 'Terjadi kesalahan saat memuat data laporan.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, sesi, kamar, pencarian]);

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // Daftar kamar unik
  const daftarKamar = useMemo(() => {
    const kamarsFromData = laporanData.map((item) => item.kamar).filter(Boolean);
    const combined = [...new Set([...daftarKamarServer, ...kamarsFromData])].filter(
      (k) => k !== '-'
    );
    return combined.sort();
  }, [daftarKamarServer, laporanData]);

  // Rekap mahasiswa yang konsisten
  const displayRekapMahasiswa = useMemo(() => {
    if (rekapMahasiswa && rekapMahasiswa.length > 0) {
      return rekapMahasiswa;
    }
    // Fallback hitung otomatis jika backend hanya kirim raw data
    const map = {};
    for (const row of laporanData) {
      const key = `${row.nama}_${row.nim}`;
      if (!map[key]) {
        map[key] = {
          nama: row.nama,
          nim: row.nim,
          kamar: row.kamar,
          gedung: row.gedung || (gedungInfo ? gedungInfo.nama : 'Gedung Asrama'),
          hadir: 0,
          izin: 0,
          alfa: 0,
          total: 0,
          persentase_hadir: 0
        };
      }
      const st = String(row.status || '').toLowerCase();
      if (st === 'hadir' || st === 'terlambat') {
        map[key].hadir++;
      } else if (st === 'izin') {
        map[key].izin++;
      } else {
        map[key].alfa++;
      }
      map[key].total++;
    }
    const list = Object.values(map);
    for (const m of list) {
      m.persentase_hadir = m.total > 0 ? Math.round((m.hadir / m.total) * 100 * 10) / 10 : 0;
    }
    return list.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
  }, [rekapMahasiswa, laporanData, gedungInfo]);

  // Reset filter
  const handleResetFilter = () => {
    setStartDate(getFirstDayOfMonth());
    setEndDate(getToday());
    setSesi('Semua');
    setKamar('Semua');
    setPencarian('');
  };

  // Ekspor Excel (CSV)
  const handleExportCsv = () => {
    const rows = displayRekapMahasiswa;
    if (!rows.length && !laporanData.length) {
      alert('Tidak ada data laporan untuk diekspor pada filter ini.');
      return;
    }

    const csvEscape = (val) => {
      const str = String(val ?? '');
      if (/[",\n;]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = ['No', 'Nama Mahasiswa', 'NIM', 'Gedung', 'Kamar', 'Hadir', 'Izin', 'Alfa', 'Total Sesi', 'Persentase Hadir (%)'];
    const lines = [
      headers.join(','),
      ...rows.map((item, idx) => [
        idx + 1,
        csvEscape(item.nama),
        csvEscape(item.nim),
        csvEscape(item.gedung || (gedungInfo ? gedungInfo.nama : '')),
        csvEscape(item.kamar),
        item.hadir,
        item.izin,
        item.alfa,
        item.total,
        item.persentase_hadir
      ].join(','))
    ];

    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-presensi-fasil_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cetak laporan resmi standar A4 (Sama dengan Administrator)
  const handlePrint = () => {
    const printDate = formatTanggalIndo(getToday());
    const namaGedung = gedungInfo ? gedungInfo.nama : 'Gedung Binaan';

    let tableTitle = 'Rekapitulasi Kehadiran per Mahasiswa';
    let tableHead = '';
    let tableRows = '';

    if (activeTab === 'detail') {
      tableTitle = 'Log Detail Presensi Penghuni Asrama';
      tableHead = `
        <tr>
          <th style="width:36px;text-align:center;">No</th>
          <th style="width:88px;text-align:center;">Tanggal</th>
          <th style="width:65px;text-align:center;">Sesi</th>
          <th>Nama Mahasiswa</th>
          <th style="width:98px;">NIM</th>
          <th style="width:90px;text-align:center;">Kamar</th>
          <th style="width:74px;text-align:center;">Waktu</th>
          <th style="width:72px;text-align:center;">Status</th>
        </tr>`;
      tableRows = laporanData.length
        ? laporanData.map((r, i) => {
            const st = String(r.status || '').toLowerCase();
            const stLabel = st === 'alpa' || st === 'alfa' ? 'ALFA' : st.toUpperCase();
            const stColor = st === 'hadir' ? '#15803d' : st === 'izin' ? '#b45309' : '#b91c1c';
            return `
            <tr>
              <td style="text-align:center;">${i + 1}</td>
              <td style="text-align:center;">${escapeHtml(r.tanggal)}</td>
              <td style="text-align:center;">${escapeHtml(r.sesi)}</td>
              <td><strong>${escapeHtml(r.nama)}</strong></td>
              <td>${escapeHtml(r.nim)}</td>
              <td style="text-align:center;">${escapeHtml(r.kamar || '-')}</td>
              <td style="text-align:center;">${escapeHtml(r.waktu || '-')}</td>
              <td style="text-align:center;font-weight:700;color:${stColor};">${stLabel}</td>
            </tr>`;
          }).join('')
        : '<tr><td colspan="8" style="text-align:center;padding:18px;color:#6b7280;">Tidak ada data untuk dicetak.</td></tr>';
    } else {
      tableTitle = 'Rekapitulasi Kehadiran per Mahasiswa';
      tableHead = `
        <tr>
          <th style="width:36px;text-align:center;">No</th>
          <th>Nama Mahasiswa</th>
          <th style="width:105px;">NIM</th>
          <th style="width:110px;text-align:center;">Kamar</th>
          <th style="width:58px;text-align:center;">Hadir</th>
          <th style="width:52px;text-align:center;">Izin</th>
          <th style="width:52px;text-align:center;">Alfa</th>
          <th style="width:70px;text-align:center;">Total</th>
          <th style="width:82px;text-align:center;">Kehadiran</th>
        </tr>`;
      tableRows = displayRekapMahasiswa.length
        ? displayRekapMahasiswa.map((r, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td><strong>${escapeHtml(r.nama)}</strong></td>
            <td>${escapeHtml(r.nim)}</td>
            <td style="text-align:center;">${escapeHtml(r.kamar ? `Kamar ${r.kamar}` : '-')}</td>
            <td style="text-align:center;color:#15803d;font-weight:700;">${r.hadir}</td>
            <td style="text-align:center;color:#b45309;font-weight:700;">${r.izin}</td>
            <td style="text-align:center;color:#b91c1c;font-weight:700;">${r.alfa}</td>
            <td style="text-align:center;">${r.total}</td>
            <td style="text-align:center;font-weight:700;">${r.persentase_hadir}%</td>
          </tr>`).join('')
        : '<tr><td colspan="9" style="text-align:center;padding:18px;color:#6b7280;">Tidak ada data untuk dicetak.</td></tr>';
    }

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Presensi Mahasiswa Asrama - Gedung ${escapeHtml(namaGedung)}</title>
  <style>
    @page { size: A4 portrait; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #111827;
      font-size: 11.5px;
      line-height: 1.45;
      background: #ffffff;
    }
    .kop {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
      gap: 16px;
    }
    .kop-logo {
      width: 65px;
      height: 65px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .kop-text {
      flex: 1;
      text-align: center;
    }
    .kop-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #15803d;
    }
    .kop-title {
      font-size: 16px;
      font-weight: 800;
      margin: 4px 0 3px;
      letter-spacing: 0.02em;
    }
    .kop-addr {
      font-size: 10.5px;
      color: #4b5563;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .meta-row strong { color: #111827; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-card {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
    }
    .summary-label {
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4b5563;
      letter-spacing: 0.04em;
    }
    .summary-value {
      font-size: 20px;
      font-weight: 800;
      margin: 4px 0 2px;
    }
    .summary-note {
      font-size: 9.5px;
      color: #6b7280;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 700;
      margin: 0 0 8px;
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #f3f4f6;
      color: #111827;
      font-weight: 700;
      text-align: left;
      padding: 8px 8px;
      border: 1px solid #d1d5db;
      font-size: 10.5px;
    }
    td {
      padding: 7px 8px;
      border: 1px solid #d1d5db;
      vertical-align: middle;
    }
    tbody tr:nth-child(even) { background: #fafafa; }
    .footer-sign {
      margin-top: 28px;
      display: flex;
      justify-content: flex-end;
    }
    .sign-box {
      width: 240px;
      text-align: center;
      font-size: 11px;
    }
    .sign-space { height: 54px; }
  </style>
</head>
<body>
  <div class="kop">
    <img src="${window.location.origin}/assets/TB.png" alt="Logo Universitas Andalas" class="kop-logo" />
    <div class="kop-text">
      <div class="kop-sub">Universitas Andalas · UPT Asrama Mahasiswa</div>
      <div class="kop-title">REKAPITULASI LAPORAN PRESENSI MAHASISWA ASRAMA</div>
      <div class="kop-addr">Kampus Limau Manis, Padang, Sumatera Barat</div>
    </div>
    <img src="${window.location.origin}/assets/logo-asrama.png" alt="Logo Asrama" class="kop-logo" />
  </div>

  <div class="meta-box">
    <div class="meta-row"><strong>Periode Laporan:</strong> ${escapeHtml(formatTanggalIndo(startDate))} s/d ${escapeHtml(formatTanggalIndo(endDate))}</div>
    <div class="meta-row"><strong>Gedung Asrama:</strong> Gedung ${escapeHtml(namaGedung)}</div>
    <div class="meta-row"><strong>Sesi Presensi:</strong> ${escapeHtml(sesi === 'Semua' ? 'Semua Sesi' : sesi)}</div>
    <div class="meta-row"><strong>Filter Kamar:</strong> ${escapeHtml(kamar === 'Semua' ? 'Semua Kamar' : `Kamar ${kamar}`)}</div>
    <div class="meta-row"><strong>Tanggal Cetak:</strong> ${escapeHtml(printDate)}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Persentase Kehadiran</div>
      <div class="summary-value" style="color:#15803d;">${ringkasan.persentase_kehadiran}%</div>
      <div class="summary-note">Dari ${ringkasan.total_presensi} catatan sesi</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Hadir</div>
      <div class="summary-value" style="color:#111827;">${ringkasan.total_hadir || ringkasan.jumlah_hadir}</div>
      <div class="summary-note">Presensi tercatat hadir</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Izin</div>
      <div class="summary-value" style="color:#b45309;">${ringkasan.jumlah_izin}</div>
      <div class="summary-note">Izin disetujui</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Total Alfa</div>
      <div class="summary-value" style="color:#b91c1c;">${ringkasan.jumlah_tidak_hadir}</div>
      <div class="summary-note">Tanpa keterangan</div>
    </div>
  </div>

  <h3 class="section-title">${escapeHtml(tableTitle)}</h3>
  <table>
    <thead>${tableHead}</thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="footer-sign">
    <div class="sign-box">
      <div>Padang, ${escapeHtml(printDate)}</div>
      <div>Fasilitator Gedung ${escapeHtml(namaGedung)}</div>
      <div class="sign-space"></div>
      <div><strong>( ___________________________ )</strong></div>
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1024px';
    iframe.style.height = '1400px';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Gagal memicu cetak:', err);
      }
      window.setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    };

    const images = doc.images;
    const totalImages = images.length;
    if (totalImages > 0) {
      let loadedCount = 0;
      const onImageDone = () => {
        loadedCount += 1;
        if (loadedCount >= totalImages) {
          setTimeout(triggerPrint, 200);
        }
      };

      for (let i = 0; i < totalImages; i++) {
        if (images[i].complete) {
          loadedCount += 1;
        } else {
          images[i].onload = onImageDone;
          images[i].onerror = onImageDone;
        }
      }

      if (loadedCount >= totalImages) {
        setTimeout(triggerPrint, 200);
      }
    } else {
      setTimeout(triggerPrint, 200);
    }
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.alpa;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  return (
    <div>
      {/* Header Halaman */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 className="text-page-title">
            Laporan Gedung {gedungInfo ? gedungInfo.nama : 'Binaan'}
          </h1>
          <p className="text-body">
            Rekapitulasi kehadiran, izin, dan alfa penghuni asrama per periode
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, marginLeft: 'auto' }}>
          <Button
            variant="secondary"
            size="md"
            icon={Printer}
            onClick={handlePrint}
            disabled={loading || (laporanData.length === 0 && displayRekapMahasiswa.length === 0)}
          >
            Cetak Laporan
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Download}
            onClick={handleExportCsv}
            disabled={loading || displayRekapMahasiswa.length === 0}
          >
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* Card Filter Parameter */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            alignItems: 'end'
          }}>
            <Input
              type="date"
              label="Dari Tanggal"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Sampai Tanggal"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Sesi Presensi
              </label>
              <select
                value={sesi}
                onChange={(e) => setSesi(e.target.value)}
                style={selectStyle}
              >
                <option value="Semua">Semua Sesi</option>
                <option value="subuh">Sesi Subuh</option>
                <option value="malam">Sesi Malam</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Filter Kamar
              </label>
              <select
                value={kamar}
                onChange={(e) => setKamar(e.target.value)}
                style={selectStyle}
              >
                <option value="Semua">Semua Kamar</option>
                {daftarKamar.map((kmr) => (
                  <option key={kmr} value={kmr}>Kamar {kmr}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Input
                label="Cari Mahasiswa"
                placeholder="Ketik nama mahasiswa atau NIM..."
                icon={Search}
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
              />
            </div>
            {(sesi !== 'Semua' || kamar !== 'Semua' || pencarian.trim() || startDate !== getFirstDayOfMonth() || endDate !== getToday()) && (
              <Button variant="ghost" size="md" onClick={handleResetFilter}>
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(226, 33, 52, 0.12)',
          border: '1px solid var(--color-error)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }} role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Kartu Ringkasan Sejajar Simetris */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">PERSENTASE KEHADIRAN</span>
            <BarChart3 size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-primary)', margin: '8px 0 4px', lineHeight: 1.1 }}>
            {loading ? '...' : `${ringkasan.persentase_kehadiran}%`}
          </div>
          <span className="text-small">Dari {ringkasan.total_presensi} catatan sesi</span>
        </Card>

        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">TOTAL HADIR</span>
            <CheckCircle2 size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-text-primary)', margin: '8px 0 4px', lineHeight: 1.1 }}>
            {loading ? '...' : (ringkasan.total_hadir || ringkasan.jumlah_hadir)}
          </div>
          <span className="text-small">Presensi tepat waktu &amp; tercatat</span>
        </Card>

        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">TOTAL IZIN</span>
            <FileText size={18} color="var(--color-warning)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-warning)', margin: '8px 0 4px', lineHeight: 1.1 }}>
            {loading ? '...' : ringkasan.jumlah_izin}
          </div>
          <span className="text-small">Izin disetujui fasilitator</span>
        </Card>

        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '124px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-label">TOTAL ALFA</span>
            <XCircle size={18} color="var(--color-error)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: 'var(--color-error)', margin: '8px 0 4px', lineHeight: 1.1 }}>
            {loading ? '...' : ringkasan.jumlah_tidak_hadir}
          </div>
          <span className="text-small">Tidak hadir tanpa keterangan</span>
        </Card>
      </div>

      {/* Tabel Data dengan Tab Bar Clean menyatu di atas tabel */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          padding: '0 20px',
          gap: '12px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--color-surface-l1)'
        }}>
          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
            {[
              { key: 'mahasiswa', label: 'Rekap Mahasiswa', count: displayRekapMahasiswa.length },
              { key: 'detail', label: 'Log Presensi', count: laporanData.length }
            ].map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 2px',
                    border: 'none',
                    borderBottom: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: '13.5px',
                    fontWeight: isSelected ? '700' : '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'color var(--transition-fast), border-color var(--transition-fast)'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: isSelected ? 'rgba(29, 185, 84, 0.14)' : 'var(--color-surface-l2)',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-neutral)'
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 0' }}>
            <Badge variant="neutral">Sesi: {sesi}</Badge>
            <Badge variant="neutral">Kamar: {kamar}</Badge>
          </div>
        </div>

        {/* Tabel Rekapitulasi Mahasiswa (Default) */}
        {activeTab === 'mahasiswa' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', width: '48px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '12px 16px' }}>Nama Mahasiswa</th>
                  <th style={{ padding: '12px 16px', width: '140px' }}>NIM</th>
                  <th style={{ padding: '12px 16px', width: '150px' }}>Kamar</th>
                  <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Hadir</th>
                  <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Izin</th>
                  <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Alfa</th>
                  <th style={{ padding: '12px 16px', width: '90px', textAlign: 'center' }}>Total</th>
                  <th style={{ padding: '12px 16px', width: '110px', textAlign: 'center' }}>Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      <RefreshCw size={28} className="spin" style={{ marginBottom: '10px', animation: 'spin 1.5s linear infinite' }} />
                      <p>Memuat rekapitulasi kehadiran mahasiswa...</p>
                    </td>
                  </tr>
                ) : displayRekapMahasiswa.length > 0 ? (
                  displayRekapMahasiswa.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-neutral)' }}>{idx + 1}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{row.nama}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{row.nim}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge variant="neutral" size="sm">{row.kamar ? `Kamar ${row.kamar}` : '-'}</Badge>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-success)', fontWeight: '700' }}>
                        {row.hadir}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-warning)', fontWeight: '700' }}>
                        {row.izin}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-error)', fontWeight: '700' }}>
                        {row.alfa}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '600' }}>
                        {row.total}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', color: 'var(--color-text-primary)' }}>
                        {row.persentase_hadir}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        Tidak ada data mahasiswa pada filter yang dipilih
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabel Log Detail Presensi */}
        {activeTab === 'detail' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 16px', width: '48px', textAlign: 'center' }}>No</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Tanggal</th>
                  <th style={{ padding: '12px 16px', width: '90px' }}>Sesi</th>
                  <th style={{ padding: '12px 16px' }}>Mahasiswa</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>NIM</th>
                  <th style={{ padding: '12px 16px', width: '120px' }}>Kamar</th>
                  <th style={{ padding: '12px 16px', width: '90px' }}>Waktu</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      <RefreshCw size={28} className="spin" style={{ marginBottom: '10px', animation: 'spin 1.5s linear infinite' }} />
                      <p>Memuat log catatan presensi...</p>
                    </td>
                  </tr>
                ) : laporanData.length > 0 ? (
                  laporanData.map((row, index) => (
                    <tr key={row.id || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--color-neutral)' }}>{index + 1}</td>
                      <td style={{ padding: '14px 16px' }}>{row.tanggal}</td>
                      <td style={{ padding: '14px 16px', fontWeight: '500' }}>{row.sesi}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: 'var(--color-text-primary)' }}>{row.nama}</strong>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{row.nim}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <Badge variant="neutral" size="sm">{row.kamar || '-'}</Badge>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--color-neutral)' }}>{row.waktu || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>{getStatusBadge(row.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      <FileText size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                      <p style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>
                        Tidak ada catatan presensi dalam rentang periode ini
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
