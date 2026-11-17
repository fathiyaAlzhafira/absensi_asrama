import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from '@e965/xlsx';
import { Download, Filter, Printer } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { api } from '../../services/api';
import './LaporanGlobal.css';

const PAGE_SIZE = 10;
const EMPTY_ROWS = [];

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function initialFilters() {
  const today = new Date();
  return {
    start_date: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    end_date: toDateInput(today),
    gedung_id: 'all',
    sesi: 'all',
  };
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function sessionLabel(value) {
  if (value === 'subuh') return 'Subuh';
  if (value === 'malam') return 'Malam';
  return 'Semua Sesi';
}

function AttendanceTrend({ trend }) {
  const width = 900;
  const height = 250;
  const left = 46;
  const right = 18;
  const top = 18;
  const bottom = 38;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const x = (index) => trend.length <= 1
    ? left + chartWidth / 2
    : left + (index / (trend.length - 1)) * chartWidth;
  const y = (percentage) => top + chartHeight - (percentage / 100) * chartHeight;
  const path = trend.map((item, index) => (
    `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(item.persentase_kehadiran)}`
  )).join(' ');
  const labelIndexes = new Set(
    Array.from({ length: Math.min(6, trend.length) }, (_, index) => (
      Math.round(index * (trend.length - 1) / Math.max(1, Math.min(6, trend.length) - 1))
    )),
  );

  return (
    <div className="global-chart-scroll">
      <svg
        className="global-trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Grafik persentase kehadiran harian"
      >
        {[0, 50, 100].map((percentage) => (
          <g key={percentage}>
            <line
              x1={left}
              x2={width - right}
              y1={y(percentage)}
              y2={y(percentage)}
              className="chart-grid-line"
            />
            <text x={left - 8} y={y(percentage) + 4} textAnchor="end" className="chart-axis-label">
              {percentage}%
            </text>
          </g>
        ))}
        {trend.length > 0 && <path d={path} className="chart-trend-line" />}
        {trend.map((item, index) => (
          <circle
            key={item.tanggal}
            cx={x(index)}
            cy={y(item.persentase_kehadiran)}
            r="3"
            className="chart-trend-point"
          >
            <title>{`${formatDate(item.tanggal)}: ${item.persentase_kehadiran}% (${item.total_presensi} presensi)`}</title>
          </circle>
        ))}
        {trend.map((item, index) => labelIndexes.has(index) && (
          <text
            key={`${item.tanggal}-label`}
            x={x(index)}
            y={height - 10}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {item.tanggal.slice(8, 10)}/{item.tanggal.slice(5, 7)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function LaporanGlobal() {
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const rows = report?.rows || EMPTY_ROWS;
  const summary = report?.summary;
  const trend = report?.trend || [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, rows],
  );
  const building = report?.gedungs?.find(
    (item) => String(item.id) === appliedFilters?.gedung_id,
  );
  const buildingLabel = building?.nama || 'Semua Gedung Asrama';
  const activeSessionLabel = sessionLabel(appliedFilters?.sesi);

  async function loadReport(nextFilters) {
    setLoading(true);
    setError('');
    try {
      const response = await api.getGlobalReport(nextFilters);
      if (response?.status !== 'success' || !response.data) {
        throw new Error(response?.message || 'Data laporan global tidak dapat dimuat.');
      }
      setReport(response.data);
      setAppliedFilters({ ...nextFilters });
      setPage(1);
    } catch (requestError) {
      setError(requestError.message || 'Terjadi kesalahan saat memuat laporan global.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(filters);
    // Load only the initial month-to-date report on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!filters.start_date || !filters.end_date) {
      setError('Tanggal mulai dan tanggal akhir wajib diisi.');
      return;
    }
    if (filters.start_date > filters.end_date) {
      setError('Tanggal mulai tidak boleh melewati tanggal akhir.');
      return;
    }
    loadReport(filters);
  }

  function tableRows(data, offset = 0) {
    if (data.length === 0) {
      return (
        <tr>
          <td className="global-table-empty" colSpan="12">Tidak ada penghuni pada filter ini.</td>
        </tr>
      );
    }
    return data.map((row, index) => (
      <tr key={row.user_id}>
        <td>{offset + index + 1}</td>
        <td><strong>{row.nama || '-'}</strong></td>
        <td>{row.nim || '-'}</td>
        <td>{row.gedung || '-'}</td>
        <td>{row.kamar || '-'}</td>
        <td>{row.total_presensi}</td>
        <td>{row.hadir}</td>
        <td>{row.terlambat}</td>
        <td>{row.izin}</td>
        <td>{row.alpa}</td>
        <td><strong>{row.persentase_kehadiran}%</strong></td>
        <td>
          {row.waktu_absen ? (
            <>
              <strong>{row.waktu_absen.waktu}</strong>
              <small>{formatDate(row.waktu_absen.tanggal)} · {sessionLabel(row.waktu_absen.sesi)}</small>
            </>
          ) : '-'}
        </td>
      </tr>
    ));
  }

  function renderTable(data, offset = 0) {
    return (
      <table className="global-report-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Nama Penghuni</th>
            <th>NIM</th>
            <th>Gedung</th>
            <th>Kamar</th>
            <th>Total Data</th>
            <th>Hadir</th>
            <th>Terlambat</th>
            <th>Izin</th>
            <th>Alpa</th>
            <th>% Kehadiran</th>
            <th>Waktu Absen Terakhir</th>
          </tr>
        </thead>
        <tbody>{tableRows(data, offset)}</tbody>
      </table>
    );
  }

  function exportExcel() {
    if (!report || !appliedFilters) return;

    setExporting(true);
    setError('');
    try {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Laporan Global Seluruh Asrama UNAND'],
        ['Periode', formatDate(appliedFilters.start_date), 's.d.', formatDate(appliedFilters.end_date)],
        ['Gedung', buildingLabel],
        ['Sesi', activeSessionLabel],
        [],
        ['Ringkasan Statistik'],
        ['Total Penghuni', summary.total_penghuni],
        ['Total Data Presensi', summary.total_presensi],
        ['Hadir', summary.hadir],
        ['Terlambat', summary.terlambat],
        ['Izin', summary.izin],
        ['Alpa', summary.alpa],
        ['Persentase Kehadiran', `${summary.persentase_kehadiran}%`],
        [],
        ['Rekapitulasi Penghuni'],
        ['No.', 'Nama Penghuni', 'NIM', 'Gedung', 'Kamar', 'Total Data', 'Hadir', 'Terlambat', 'Izin', 'Alpa', '% Kehadiran', 'Waktu Absen Terakhir'],
        ...rows.map((row, index) => [
          index + 1,
          row.nama || '-',
          row.nim || '-',
          row.gedung || '-',
          row.kamar || '-',
          row.total_presensi,
          row.hadir,
          row.terlambat,
          row.izin,
          row.alpa,
          `${row.persentase_kehadiran}%`,
          row.waktu_absen
            ? `${row.waktu_absen.tanggal} ${row.waktu_absen.waktu} (${sessionLabel(row.waktu_absen.sesi)})`
            : '-',
        ]),
        [],
        ['Tren Kehadiran Harian'],
        ['Tanggal', 'Total Data Presensi', 'Hadir', 'Terlambat', 'Izin', 'Alpa', '% Kehadiran'],
        ...trend.map((item) => [
          formatDate(item.tanggal),
          item.total_presensi,
          item.hadir,
          item.terlambat,
          item.izin,
          item.alpa,
          `${item.persentase_kehadiran}%`,
        ]),
      ]);
      worksheet['!cols'] = [
        { wch: 7 }, { wch: 28 }, { wch: 16 }, { wch: 34 }, { wch: 14 },
        { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 28 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Global');
      const file = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-global-${appliedFilters.start_date}-${appliedFilters.end_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(exportError.message || 'Gagal membuat file Excel laporan global.');
    } finally {
      setExporting(false);
    }
  }

  function printReport() {
    if (report && appliedFilters) {
      window.print();
    }
  }

  return (
    <div className="global-report">
      <div className="global-report-screen">
        <div className="global-report-heading">
          <div>
            <h1 className="text-page-title">Laporan Global Seluruh Asrama</h1>
            <p className="text-body">Rekapitulasi statistik kehadiran penghuni seluruh gedung asrama Unand</p>
          </div>
          <div className="global-report-actions">
            <Button variant="secondary" size="md" icon={Printer} onClick={printReport} disabled={loading || !report}>
              Cetak
            </Button>
            <Button variant="primary" size="md" icon={Download} onClick={exportExcel} disabled={loading || exporting || !report}>
              {exporting ? 'Menyiapkan Excel...' : 'Ekspor Format Excel'}
            </Button>
          </div>
        </div>

        <Card hoverable={false} style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="global-filter-grid">
              <Input
                type="date"
                label="Dari Tanggal"
                name="start_date"
                value={filters.start_date}
                onChange={updateFilter}
                required
              />
              <Input
                type="date"
                label="Sampai Tanggal"
                name="end_date"
                value={filters.end_date}
                onChange={updateFilter}
                required
              />
              <label className="global-select-field">
                <span className="text-label">Pilih Gedung</span>
                <select name="gedung_id" value={filters.gedung_id} onChange={updateFilter}>
                  {(report?.gedungs || [{ id: 'all', nama: 'Semua Gedung Asrama' }]).map((item) => (
                    <option key={item.id} value={item.id}>{item.nama}</option>
                  ))}
                </select>
              </label>
              <label className="global-select-field">
                <span className="text-label">Sesi Presensi</span>
                <select name="sesi" value={filters.sesi} onChange={updateFilter}>
                  <option value="all">Semua Sesi</option>
                  <option value="subuh">Subuh</option>
                  <option value="malam">Malam</option>
                </select>
              </label>
              <div className="global-filter-submit">
                <Button type="submit" variant="primary" size="md" icon={Filter} disabled={loading}>
                  {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {error && <div className="global-report-error" role="alert">{error}</div>}
        {loading && <div className="global-report-loading" role="status">Memuat laporan global...</div>}

        {!loading && summary && (
          <>
            <div className="global-summary-grid">
              {[
                ['Total Penghuni', summary.total_penghuni],
                ['Total Data Presensi', summary.total_presensi],
                ['Hadir', summary.hadir],
                ['Terlambat', summary.terlambat],
                ['Izin', summary.izin],
                ['Alpa', summary.alpa],
                ['Kehadiran', `${summary.persentase_kehadiran}%`],
              ].map(([label, value]) => (
                <Card key={label} hoverable={false} style={{ padding: '16px 18px' }}>
                  <span className="text-small">{label}</span>
                  <strong className="global-summary-value">{value}</strong>
                </Card>
              ))}
            </div>

            <Card hoverable={false} style={{ marginBottom: '20px' }}>
              <div className="global-section-heading">
                <div>
                  <h2 className="text-card-title">Tren Kehadiran Harian</h2>
                  <p className="text-small">
                    {formatDate(appliedFilters.start_date)} – {formatDate(appliedFilters.end_date)}
                    {' · '}{buildingLabel} · {activeSessionLabel}
                  </p>
                </div>
                <span className="text-small">Hadir + terlambat dari data presensi</span>
              </div>
              <AttendanceTrend trend={trend} />
            </Card>

            <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
              <div className="global-section-heading global-table-heading">
                <div>
                  <h2 className="text-card-title">Rekapitulasi Penghuni</h2>
                  <p className="text-small">
                    {formatDate(appliedFilters.start_date)} – {formatDate(appliedFilters.end_date)}
                    {' · '}{buildingLabel} · {activeSessionLabel}
                  </p>
                </div>
                <span className="text-small">{rows.length} penghuni</span>
              </div>
              <div className="global-table-scroll">{renderTable(pageRows, (page - 1) * PAGE_SIZE)}</div>
              <div className="global-pagination">
                <span className="text-small">Halaman {page} dari {pageCount}</span>
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page >= pageCount}
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {report && appliedFilters && (
        <section id="global-report-print" className="global-report-print">
          <header className="global-print-header">
            <h1>Laporan Global Presensi Penghuni</h1>
            <p>Sistem Absensi Penghuni Asrama UNAND</p>
            <div className="global-print-meta">
              <span><strong>Periode:</strong> {formatDate(appliedFilters.start_date)} – {formatDate(appliedFilters.end_date)}</span>
              <span><strong>Gedung:</strong> {buildingLabel}</span>
              <span><strong>Sesi:</strong> {activeSessionLabel}</span>
            </div>
          </header>
          <div className="global-print-summary">
            <span>Penghuni: {summary.total_penghuni}</span>
            <span>Data presensi: {summary.total_presensi}</span>
            <span>Hadir: {summary.hadir}</span>
            <span>Terlambat: {summary.terlambat}</span>
            <span>Izin: {summary.izin}</span>
            <span>Alpa: {summary.alpa}</span>
            <span>Kehadiran: {summary.persentase_kehadiran}%</span>
          </div>
          <h2 className="global-print-subtitle">Tren Kehadiran Harian</h2>
          <AttendanceTrend trend={trend} />
          <h2 className="global-print-subtitle">Rekapitulasi Penghuni</h2>
          {renderTable(rows)}
        </section>
      )}
    </div>
  );
}
