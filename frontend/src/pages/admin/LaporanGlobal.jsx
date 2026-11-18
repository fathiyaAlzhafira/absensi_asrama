import React, { useCallback, useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
  Download,
  Printer,
  CheckCircle2,
  FileText,
  XCircle,
  BarChart3,
  AlertCircle,
  Search
} from 'lucide-react';
import { api } from '../../services/api';
import { getWibDateKey } from '../../utils/presensiSchedule';

function getDefaultDateRange() {
  const today = getWibDateKey(new Date());
  const startOfMonth = `${today.slice(0, 7)}-01`;
  return { startOfMonth, today };
}

function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function LaporanGlobal() {
  const defaults = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaults.startOfMonth);
  const [endDate, setEndDate] = useState(defaults.today);
  const [gedungId, setGedungId] = useState('all');
  const [sesi, setSesi] = useState('Semua');
  const [search, setSearch] = useState('');

  const [gedungs, setGedungs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('mahasiswa'); // 'mahasiswa' | 'gedung' | 'detail'

  const [report, setReport] = useState({
    ringkasan: {
      total_presensi: 0,
      jumlah_hadir: 0,
      jumlah_terlambat: 0,
      total_hadir: 0,
      jumlah_izin: 0,
      jumlah_tidak_hadir: 0,
      persentase_kehadiran: 0
    },
    rekap_mahasiswa: [],
    rekap_gedung: [],
    data: []
  });

  useEffect(() => {
    let active = true;
    api.getGedungs()
      .then((res) => {
        if (!active) return;
        setGedungs(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const fetchReport = useCallback(async (overrideParams = null) => {
    setLoading(true);
    setError('');
    try {
      const params = overrideParams || {
        start_date: startDate,
        end_date: endDate,
        gedung_id: gedungId,
        sesi,
        search: search.trim()
      };
      const res = await api.getLaporanPresensi(params);
      if (res?.status !== 'success' || !res.data) {
        throw new Error(res?.message || 'Gagal memuat laporan global asrama.');
      }
      setReport({
        ringkasan: res.data.ringkasan || {
          total_presensi: 0,
          jumlah_hadir: 0,
          jumlah_terlambat: 0,
          total_hadir: 0,
          jumlah_izin: 0,
          jumlah_tidak_hadir: 0,
          persentase_kehadiran: 0
        },
        rekap_mahasiswa: Array.isArray(res.data.rekap_mahasiswa) ? res.data.rekap_mahasiswa : [],
        rekap_gedung: Array.isArray(res.data.rekap_gedung) ? res.data.rekap_gedung : [],
        data: Array.isArray(res.data.data) ? res.data.data : []
      });
    } catch (err) {
      setError(err.message || 'Gagal memuat data laporan dari server.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, gedungId, sesi, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchReport({
        start_date: startDate,
        end_date: endDate,
        gedung_id: gedungId,
        sesi,
        search: search.trim()
      });
    }, search.trim() ? 250 : 0);

    return () => window.clearTimeout(timer);
  }, [startDate, endDate, gedungId, sesi, search, fetchReport]);

  const selectedGedungName = gedungId === 'all'
    ? 'Semua Gedung Asrama'
    : (gedungs.find((g) => String(g.id) === String(gedungId))?.nama || 'Gedung Terpilih');

  const selectedSesiName = sesi === 'subuh' ? 'Sesi Subuh' : sesi === 'malam' ? 'Sesi Malam' : 'Semua Sesi';

  const handleExportCsv = () => {
    const rows = report.rekap_mahasiswa;
    if (!rows.length && !report.data.length) {
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
        csvEscape(item.gedung),
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
    link.download = `laporan-presensi-asrama_${startDate}_sd_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const { ringkasan, rekap_mahasiswa: mhs, rekap_gedung: gdg, data: det } = report;
    const printDate = formatTanggalIndo(getWibDateKey(new Date()));

    let tableTitle = 'Rekapitulasi Kehadiran per Mahasiswa';
    let tableHead = '';
    let tableRows = '';

    if (activeTab === 'gedung') {
      tableTitle = 'Rekapitulasi Kehadiran per Gedung Asrama';
      tableHead = `
        <tr>
          <th style="width:40px;text-align:center;">No</th>
          <th>Gedung Asrama</th>
          <th style="width:70px;text-align:center;">Hadir</th>
          <th style="width:70px;text-align:center;">Izin</th>
          <th style="width:70px;text-align:center;">Alfa</th>
          <th style="width:85px;text-align:center;">Total Sesi</th>
          <th style="width:95px;text-align:center;">Kehadiran</th>
        </tr>`;
      tableRows = gdg.length
        ? gdg.map((r, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td><strong>${escapeHtml(r.gedung)}</strong></td>
            <td style="text-align:center;color:#15803d;font-weight:700;">${r.hadir}</td>
            <td style="text-align:center;color:#b45309;font-weight:700;">${r.izin}</td>
            <td style="text-align:center;color:#b91c1c;font-weight:700;">${r.alfa}</td>
            <td style="text-align:center;">${r.total}</td>
            <td style="text-align:center;font-weight:700;">${r.persentase_hadir}%</td>
          </tr>`).join('')
        : '<tr><td colspan="7" style="text-align:center;padding:18px;color:#6b7280;">Tidak ada data untuk dicetak.</td></tr>';
    } else if (activeTab === 'detail') {
      tableTitle = 'Log Detail Presensi Penghuni Asrama';
      tableHead = `
        <tr>
          <th style="width:36px;text-align:center;">No</th>
          <th style="width:88px;">Tanggal</th>
          <th style="width:62px;">Sesi</th>
          <th>Nama Mahasiswa</th>
          <th style="width:98px;">NIM</th>
          <th>Gedung / Kamar</th>
          <th style="width:74px;text-align:center;">Waktu</th>
          <th style="width:72px;text-align:center;">Status</th>
        </tr>`;
      tableRows = det.length
        ? det.map((r, i) => {
          const st = String(r.status || '').toLowerCase();
          const stLabel = st === 'alpa' || st === 'alfa' ? 'ALFA' : st.toUpperCase();
          const stColor = st === 'hadir' ? '#15803d' : st === 'izin' ? '#b45309' : '#b91c1c';
          return `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td>${escapeHtml(r.tanggal)}</td>
            <td>${escapeHtml(r.sesi)}</td>
            <td><strong>${escapeHtml(r.nama)}</strong></td>
            <td>${escapeHtml(r.nim)}</td>
            <td>${escapeHtml(r.gedung)}${r.kamar && r.kamar !== '-' ? ` · Kamar ${escapeHtml(r.kamar)}` : ''}</td>
            <td style="text-align:center;">${escapeHtml(r.waktu)}</td>
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
          <th>Gedung / Kamar</th>
          <th style="width:58px;text-align:center;">Hadir</th>
          <th style="width:52px;text-align:center;">Izin</th>
          <th style="width:52px;text-align:center;">Alfa</th>
          <th style="width:70px;text-align:center;">Total</th>
          <th style="width:82px;text-align:center;">Kehadiran</th>
        </tr>`;
      tableRows = mhs.length
        ? mhs.map((r, i) => `
          <tr>
            <td style="text-align:center;">${i + 1}</td>
            <td><strong>${escapeHtml(r.nama)}</strong></td>
            <td>${escapeHtml(r.nim)}</td>
            <td>${escapeHtml(r.gedung)}${r.kamar && r.kamar !== '-' ? ` · Kamar ${escapeHtml(r.kamar)}` : ''}</td>
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
  <title>Laporan Global Presensi Asrama Unand</title>
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
      text-align: center;
      border-bottom: 2.5px solid #111827;
      padding-bottom: 10px;
      margin-bottom: 16px;
    }
    .kop-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #15803d;
    }
    .kop-title {
      font-size: 17px;
      font-weight: 800;
      margin: 3px 0 2px;
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
      width: 220px;
      text-align: center;
      font-size: 11px;
    }
    .sign-space { height: 54px; }
  </style>
</head>
<body>
  <div class="kop">
    <div class="kop-sub">Universitas Andalas · UPT Asrama Mahasiswa</div>
    <div class="kop-title">LAPORAN GLOBAL PRESENSI PENGHUNI ASRAMA</div>
    <div class="kop-addr">Kampus Limau Manis, Padang, Sumatera Barat</div>
  </div>

  <div class="meta-box">
    <div class="meta-row"><strong>Periode Laporan:</strong> ${escapeHtml(formatTanggalIndo(startDate))} s/d ${escapeHtml(formatTanggalIndo(endDate))}</div>
    <div class="meta-row"><strong>Gedung Asrama:</strong> ${escapeHtml(selectedGedungName)}</div>
    <div class="meta-row"><strong>Sesi Presensi:</strong> ${escapeHtml(selectedSesiName)}</div>
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
      <div class="summary-value" style="color:#111827;">${ringkasan.total_hadir}</div>
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
      <div>Pengelola Asrama Universitas Andalas</div>
      <div class="sign-space"></div>
      <div><strong>( ___________________________ )</strong></div>
    </div>
  </div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      window.setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    };
  };

  const { ringkasan, rekap_mahasiswa: rekapMahasiswa, rekap_gedung: rekapGedung, data: detailList } = report;

  const selectStyle = {
    height: '42px',
    width: '100%',
    backgroundColor: 'var(--color-surface-l2)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    padding: '0 12px',
    fontSize: '14px',
    fontFamily: 'var(--font-family)',
    outline: 'none'
  };

  const thStyle = {
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  };

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '13px',
    color: 'var(--color-text-primary)',
    verticalAlign: 'middle'
  };

  return (
    <div>
      {/* Header Halaman */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <h1 className="text-page-title">Laporan Global Seluruh Asrama</h1>
          <p className="text-body">Rekapitulasi statistik kehadiran, izin, dan alfa penghuni seluruh gedung asrama Unand</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0, marginLeft: 'auto' }}>
          <Button variant="secondary" size="md" icon={Printer} onClick={handlePrint}>
            Cetak
          </Button>
          <Button variant="primary" size="md" icon={Download} onClick={handleExportCsv}>
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* Card Filter Otomatis */}
      <Card hoverable={false} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="laporan-filter-grid">
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
                Pilih Gedung
              </label>
              <select
                value={gedungId}
                onChange={(e) => setGedungId(e.target.value)}
                style={selectStyle}
              >
                <option value="all">Semua Gedung Asrama</option>
                {gedungs.map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.nama}</option>
                ))}
              </select>
            </div>
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
          </div>

          <Input
            label="Cari Mahasiswa"
            placeholder="Ketik nama mahasiswa atau NIM..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

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
      <div className="laporan-summary-grid" style={{ marginBottom: '24px' }}>
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
            {loading ? '...' : ringkasan.total_hadir}
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
              { key: 'mahasiswa', label: 'Rekap Mahasiswa', count: rekapMahasiswa.length },
              { key: 'gedung', label: 'Rekap Gedung', count: rekapGedung.length },
              { key: 'detail', label: 'Log Presensi', count: detailList.length }
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
          {loading && (
            <span style={{ fontSize: '12px', color: 'var(--color-neutral)' }}>Memperbarui data...</span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          {activeTab === 'mahasiswa' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ ...thStyle, width: '52px', textAlign: 'center' }}>No</th>
                  <th style={thStyle}>Nama Mahasiswa</th>
                  <th style={thStyle}>NIM</th>
                  <th style={thStyle}>Gedung &amp; Kamar</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Hadir</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Izin</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Alfa</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Total Sesi</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Memuat data laporan dari server...
                    </td>
                  </tr>
                ) : rekapMahasiswa.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Belum ada catatan presensi pada rentang tanggal dan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  rekapMahasiswa.map((row, idx) => (
                    <tr key={row.user_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-neutral)' }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{row.nama}</td>
                      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{row.nim}</td>
                      <td style={tdStyle}>
                        {row.gedung}{row.kamar && row.kamar !== '-' ? ` · Kamar ${row.kamar}` : ''}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {row.hadir}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-warning)' }}>
                        {row.izin}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-error)' }}>
                        {row.alfa}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>{row.total}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Badge
                          variant={row.persentase_hadir >= 80 ? 'success' : row.persentase_hadir >= 50 ? 'warning' : 'error'}
                          size="sm"
                        >
                          {row.persentase_hadir}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'gedung' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ ...thStyle, width: '52px', textAlign: 'center' }}>No</th>
                  <th style={thStyle}>Gedung Asrama</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Hadir</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Izin</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Alfa</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Total Sesi</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Persentase Hadir</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Memuat data laporan dari server...
                    </td>
                  </tr>
                ) : rekapGedung.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Belum ada data rekap gedung pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  rekapGedung.map((row, idx) => (
                    <tr key={row.gedung} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-neutral)' }}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: '700' }}>{row.gedung}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {row.hadir}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-warning)' }}>
                        {row.izin}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '700', color: 'var(--color-error)' }}>
                        {row.alfa}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>{row.total}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <Badge
                          variant={row.persentase_hadir >= 80 ? 'success' : row.persentase_hadir >= 50 ? 'warning' : 'error'}
                          size="sm"
                        >
                          {row.persentase_hadir}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Sesi</th>
                  <th style={thStyle}>Nama Mahasiswa</th>
                  <th style={thStyle}>NIM</th>
                  <th style={thStyle}>Gedung &amp; Kamar</th>
                  <th style={thStyle}>Waktu</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Memuat data laporan dari server...
                    </td>
                  </tr>
                ) : detailList.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                      Belum ada catatan detail presensi pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  detailList.map((row) => {
                    const statusLower = String(row.status || '').toLowerCase();
                    const isAlfa = statusLower === 'alpa' || statusLower === 'alfa';
                    const isIzin = statusLower === 'izin';
                    return (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={tdStyle}>{row.tanggal}</td>
                        <td style={tdStyle}>{row.sesi}</td>
                        <td style={{ ...tdStyle, fontWeight: '700' }}>{row.nama}</td>
                        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{row.nim}</td>
                        <td style={tdStyle}>
                          {row.gedung}{row.kamar && row.kamar !== '-' ? ` · Kamar ${row.kamar}` : ''}
                        </td>
                        <td style={tdStyle}>{row.waktu}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <Badge variant={statusLower === 'hadir' ? 'success' : isIzin ? 'warning' : 'error'} size="sm">
                            {isAlfa ? 'alfa' : row.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <style>{`
        .laporan-filter-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .laporan-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .laporan-filter-grid,
          .laporan-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 600px) {
          .laporan-filter-grid,
          .laporan-summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
