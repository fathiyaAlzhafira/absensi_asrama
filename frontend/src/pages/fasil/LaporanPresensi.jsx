import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from '@e965/xlsx';
import { Download, Filter, Printer } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { api } from '../../services/api';
import './LaporanPresensi.css';

const PAGE_SIZE = 10;

function toLocalDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getInitialFilters() {
  const today = new Date();
  return {
    start_date: toLocalDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
    end_date: toLocalDateInput(today),
    gedung_id: 'all',
    kamar_id: 'all',
    sesi: 'all',
  };
}

function formatDate(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function getStatusLabel(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : '-';
}

export default function LaporanPresensi() {
  const [filters, setFilters] = useState(getInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [gedungs, setGedungs] = useState([]);
  const [kamars, setKamars] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pageRecords = useMemo(
    () => records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, records],
  );
  const availableRooms = kamars.filter(
    (kamar) => filters.gedung_id === 'all' || String(kamar.gedung_id) === filters.gedung_id,
  );
  const activeBuilding = gedungs.find(
    (gedung) => String(gedung.id) === appliedFilters?.gedung_id,
  );
  const activeRoom = kamars.find(
    (kamar) => String(kamar.id) === appliedFilters?.kamar_id,
  );
  const buildingLabel = activeBuilding?.nama || 'Semua Gedung Binaan';
  const roomLabel = activeRoom?.nomor_kamar || 'Semua Kamar';
  const sessionLabel = appliedFilters?.sesi === 'all'
    ? 'Semua Sesi'
    : appliedFilters?.sesi === 'subuh' ? 'Subuh' : 'Malam';

  async function loadReport(nextFilters) {
    setLoading(true);
    setError('');
    try {
      const response = await api.getFasilReport(nextFilters);
      if (response.status !== 'success' || !response.data) {
        throw new Error(response.message || 'Data laporan tidak dapat dimuat.');
      }

      setGedungs(response.data.gedungs || []);
      setKamars(response.data.kamars || []);
      setRecords(response.data.records || []);
      setSummary(response.data.summary || null);
      setAppliedFilters({ ...nextFilters });
      setPage(1);
    } catch (requestError) {
      setError(requestError.message || 'Terjadi kesalahan saat memuat laporan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(filters);
    // The initial request uses the initial month-to-date filter only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'gedung_id' ? { kamar_id: 'all' } : {}),
    }));
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

  function exportExcel() {
    if (!appliedFilters || !summary) return;

    setExporting(true);
    setError('');
    try {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['Laporan Presensi Fasil'],
        ['Periode', formatDate(appliedFilters.start_date), 's.d.', formatDate(appliedFilters.end_date)],
        ['Gedung', buildingLabel],
        ['Kamar', roomLabel],
        ['Sesi', sessionLabel],
        [],
        ['No.', 'Tanggal', 'Nama Penghuni', 'NIM', 'Gedung', 'Kamar', 'Sesi', 'Waktu', 'Status'],
        ...records.map((record, index) => [
          index + 1,
          formatDate(record.tanggal),
          record.nama || '-',
          record.nim || '-',
          record.gedung || '-',
          record.kamar || '-',
          getStatusLabel(record.sesi),
          record.waktu || '-',
          getStatusLabel(record.status),
        ]),
        [],
        ['Rekap Status', 'Jumlah'],
        ['Total Data Presensi', summary.total],
        ['Hadir', summary.hadir],
        ['Terlambat', summary.terlambat],
        ['Izin', summary.izin],
        ['Alpa', summary.alpa],
      ]);
      worksheet['!cols'] = [
        { wch: 7 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 34 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Presensi');
      const file = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([file], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-presensi-${appliedFilters.start_date}-${appliedFilters.end_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(exportError.message || 'Gagal membuat file Excel.');
    } finally {
      setExporting(false);
    }
  }

  function printReport() {
    if (appliedFilters && summary) {
      window.print();
    }
  }

  function renderTableRows(rows, offset = 0) {
    if (rows.length === 0) {
      return (
        <tr>
          <td className="report-empty" colSpan="8">Tidak ada data presensi pada filter ini.</td>
        </tr>
      );
    }

    return rows.map((record, index) => (
      <tr key={record.id}>
        <td>{offset + index + 1}</td>
        <td>{formatDate(record.tanggal)}</td>
        <td>
          <strong>{record.nama || '-'}</strong>
          <small>{record.nim || 'NIM tidak tersedia'}</small>
        </td>
        <td>{record.gedung || '-'}</td>
        <td>{record.kamar || '-'}</td>
        <td>{getStatusLabel(record.sesi)}</td>
        <td>{record.waktu || '-'}</td>
        <td><span className={`report-status status-${record.status}`}>{getStatusLabel(record.status)}</span></td>
      </tr>
    ));
  }

  const reportTable = (rows, offset = 0) => (
    <table className="report-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Tanggal</th>
          <th>Nama Penghuni / NIM</th>
          <th>Gedung</th>
          <th>Kamar</th>
          <th>Sesi</th>
          <th>Waktu</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>{renderTableRows(rows, offset)}</tbody>
    </table>
  );

  return (
    <div className="fasil-report">
      <div className="report-screen">
        <div className="report-page-heading">
          <div>
            <h1 className="text-page-title">Rekap &amp; Laporan Presensi</h1>
            <p className="text-body">Rekapitulasi presensi penghuni gedung binaan Anda</p>
          </div>
          <div className="report-actions">
            <Button variant="secondary" size="md" icon={Printer} onClick={printReport} disabled={loading || !summary}>
              Cetak
            </Button>
            <Button variant="primary" size="md" icon={Download} onClick={exportExcel} disabled={loading || exporting || !summary}>
              {exporting ? 'Menyiapkan Excel...' : 'Ekspor Format Excel'}
            </Button>
          </div>
        </div>

        <Card hoverable={false} style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div className="report-filter-grid">
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
              <label className="report-select-field">
                <span className="text-label">Gedung</span>
                <select name="gedung_id" value={filters.gedung_id} onChange={updateFilter}>
                  <option value="all">Semua Gedung Binaan</option>
                  {gedungs.map((gedung) => (
                    <option key={gedung.id} value={gedung.id}>{gedung.nama}</option>
                  ))}
                </select>
              </label>
              <label className="report-select-field">
                <span className="text-label">Kamar</span>
                <select name="kamar_id" value={filters.kamar_id} onChange={updateFilter}>
                  <option value="all">Semua Kamar</option>
                  {availableRooms.map((kamar) => (
                    <option key={kamar.id} value={kamar.id}>{kamar.nomor_kamar}</option>
                  ))}
                </select>
              </label>
              <label className="report-select-field">
                <span className="text-label">Sesi</span>
                <select name="sesi" value={filters.sesi} onChange={updateFilter}>
                  <option value="all">Semua Sesi</option>
                  <option value="subuh">Subuh</option>
                  <option value="malam">Malam</option>
                </select>
              </label>
              <div className="report-filter-submit">
                <Button type="submit" variant="primary" size="md" icon={Filter} disabled={loading}>
                  {loading ? 'Memuat...' : 'Tampilkan Laporan'}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {error && <div className="report-error" role="alert">{error}</div>}

        {loading && (
          <div className="report-loading" role="status" aria-live="polite">
            Memuat laporan presensi...
          </div>
        )}

        {summary && !loading && (
          <>
            <div className="report-summary-grid">
              {[
                ['Total Presensi', summary.total],
                ['Hadir', summary.hadir],
                ['Terlambat', summary.terlambat],
                ['Izin', summary.izin],
                ['Alpa', summary.alpa],
              ].map(([label, value]) => (
                <Card key={label} hoverable={false} style={{ padding: '16px 20px' }}>
                  <div className="text-small">{label}</div>
                  <strong className="report-summary-value">{value}</strong>
                </Card>
              ))}
            </div>

            <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
              <div className="report-results-heading">
                <div>
                  <h2 className="text-card-title">Data Presensi</h2>
                  <p className="text-small">
                    {formatDate(appliedFilters.start_date)} – {formatDate(appliedFilters.end_date)}
                    {' · '}{buildingLabel} · {roomLabel} · {sessionLabel}
                  </p>
                </div>
                <span className="text-small">{records.length} data</span>
              </div>
              <div className="report-table-scroll">
                {reportTable(pageRecords, (page - 1) * PAGE_SIZE)}
              </div>
              <div className="report-pagination">
                <span className="text-small">
                  Halaman {page} dari {pageCount}
                </span>
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

      {summary && appliedFilters && (
        <section id="presensi-report-print" className="report-print-only">
          <header className="print-report-header">
            <h1>Laporan Presensi Penghuni</h1>
            <p>Sistem Absensi Penghuni Asrama UNAND</p>
            <div className="print-report-meta">
              <span><strong>Periode:</strong> {formatDate(appliedFilters.start_date)} – {formatDate(appliedFilters.end_date)}</span>
              <span><strong>Gedung:</strong> {buildingLabel}</span>
              <span><strong>Kamar:</strong> {roomLabel}</span>
              <span><strong>Sesi:</strong> {sessionLabel}</span>
            </div>
            <div className="print-report-summary">
              <span>Total: {summary.total}</span>
              <span>Hadir: {summary.hadir}</span>
              <span>Terlambat: {summary.terlambat}</span>
              <span>Izin: {summary.izin}</span>
              <span>Alpa: {summary.alpa}</span>
            </div>
          </header>
          {reportTable(records)}
        </section>
      )}
    </div>
  );
}
