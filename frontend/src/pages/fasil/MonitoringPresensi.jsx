import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Eye, Edit3, Filter, MapPin } from 'lucide-react';

export default function MonitoringPresensi() {
  const [dataPresensi] = useState([
    {
      id: 1,
      nama: 'Ahmad Fauzan',
      nim: '2311521001',
      kamar: 'A-101',
      sesi: 'Subuh',
      waktu: '05:15 WIB',
      status: 'hadir',
      latLong: '-0.914210, 100.461910',
      foto: 'uploads/presensi/subuh_sample.jpg'
    },
    {
      id: 2,
      nama: 'Budi Santoso',
      nim: '2311521002',
      kamar: 'A-101',
      sesi: 'Subuh',
      waktu: '05:40 WIB',
      status: 'hadir',
      latLong: '-0.914205, 100.461895',
      foto: 'uploads/presensi/subuh_sample.jpg'
    },
    {
      id: 3,
      nama: 'Fauzi Ramadhan',
      nim: '2311521005',
      kamar: 'A-102',
      sesi: 'Subuh',
      waktu: '06:12 WIB',
      status: 'terlambat',
      latLong: '-0.914250, 100.461920',
      foto: 'uploads/presensi/subuh_sample.jpg'
    },
    {
      id: 4,
      nama: 'Irfan Hakim',
      nim: '2311521010',
      kamar: 'A-102',
      sesi: 'Subuh',
      waktu: '-',
      status: 'alpa',
      latLong: '-',
      foto: null
    }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Monitoring Presensi Penghuni</h1>
        <p className="text-body">Kelola dan pantau kehadiran mahasiswa di gedung binaan Anda</p>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-warning)' }}>
           PANDUAN PENGERJAAN KELOMPOK • MONITORING PRESENSI (FASIL)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/fasil/MonitoringPresensi.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sediakan filter tanggal, filter sesi (Subuh / Malam), dan filter nomor kamar. Berikan fitur modal untuk melihat foto selfie presensi + peta lokasi GPS, serta aksi manual untuk mengubah status kehadiran jika diperlukan (misal dari alpa menjadi izin).
        </p>
      </Card>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ width: '180px' }}>
          <Input type="date" label="Tanggal" defaultValue="2026-09-24" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '160px' }}>
          <label className="text-label">Sesi</label>
          <select style={{ height: '42px', backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', padding: '0 12px' }}>
            <option value="subuh">Subuh (04.00-06.00)</option>
            <option value="malam">Malam (18.00-20.30)</option>
          </select>
        </div>
        <div style={{ width: '160px' }}>
          <Input placeholder="Cari kamar / nama..." label="Pencarian" />
        </div>
      </div>

      {/* Table */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Mahasiswa</th>
                <th style={{ padding: '16px' }}>Kamar</th>
                <th style={{ padding: '16px' }}>Waktu Absen</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Lokasi GPS</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Foto Wajah</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              {dataPresensi.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px' }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{row.nama}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral)' }}>NIM: {row.nim}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant="neutral" size="sm">{row.kamar}</Badge>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{row.waktu}</td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={row.status === 'hadir' ? 'success' : row.status === 'terlambat' ? 'warning' : 'error'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--color-neutral)' }}>
                    {row.latLong}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {row.foto ? (
                      <Button size="sm" variant="ghost" icon={Eye}>Lihat</Button>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <Button size="sm" variant="secondary" icon={Edit3}>Ubah</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
