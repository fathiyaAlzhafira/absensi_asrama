import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Users, Phone, Mail, Search, DoorOpen } from 'lucide-react';

export default function DataPenghuni() {
  const [penghuniList] = useState([
    { id: 1, nama: 'Ahmad Fauzan', nim: '2311521001', kamar: 'A-101', lantai: 1, asal: 'Solok', jekel: 'L', hp: '081300010002' },
    { id: 2, nama: 'Budi Santoso', nim: '2311521002', kamar: 'A-101', lantai: 1, asal: 'Pariaman', jekel: 'L', hp: '081300010003' },
    { id: 3, nama: 'Fauzi Ramadhan', nim: '2311521005', kamar: 'A-102', lantai: 1, asal: 'Padang Panjang', jekel: 'L', hp: '081300010008' },
    { id: 4, nama: 'Muhammad Hanif', nim: '2311521015', kamar: 'A-201', lantai: 2, asal: 'Payakumbuh', jekel: 'L', hp: '081300010012' },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Data Penghuni Gedung</h1>
          <p className="text-body">Daftar mahasiswa asrama di bawah binaan Anda</p>
        </div>
        <div style={{ width: '280px' }}>
          <Input placeholder="Cari nama / NIM / kamar..." icon={Search} />
        </div>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-warning)' }}>
           PANDUAN PENGERJAAN KELOMPOK • DATA PENGHUNI (FASIL)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/fasil/DataPenghuni.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Tampilkan data mahasiswa asrama dari endpoint <code>/api/users?role=penghuni&gedung_id=...</code>. Buat tombol kontak cepat WhatsApp dan modal detail biodata mahasiswa beserta riwayat presensinya.
        </p>
      </Card>

      {/* Table Card */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Nama Mahasiswa</th>
                <th style={{ padding: '16px' }}>NIM</th>
                <th style={{ padding: '16px' }}>Kamar</th>
                <th style={{ padding: '16px' }}>Lantai</th>
                <th style={{ padding: '16px' }}>Asal Daerah</th>
                <th style={{ padding: '16px' }}>Kontak WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {penghuniList.map((mhs) => (
                <tr key={mhs.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontWeight: '700' }}>{mhs.nama}</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{mhs.nim}</td>
                  <td style={{ padding: '16px' }}><Badge variant="neutral" size="sm">{mhs.kamar}</Badge></td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>Lantai {mhs.lantai}</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{mhs.asal}</td>
                  <td style={{ padding: '16px' }}>
                    <a
                      href={`https://wa.me/${mhs.hp.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                    >
                      <Phone size={14} /> {mhs.hp}
                    </a>
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
