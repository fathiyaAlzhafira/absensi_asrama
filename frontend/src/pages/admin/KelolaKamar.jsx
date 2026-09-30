import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { DoorOpen, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function KelolaKamar() {
  const [kamars] = useState([
    { id: 1, no_kamar: 'A-101', gedung: 'Gedung A (Putra)', lantai: 1, kapasitas: 4, terisi: 2 },
    { id: 2, no_kamar: 'A-102', gedung: 'Gedung A (Putra)', lantai: 1, kapasitas: 4, terisi: 4 },
    { id: 3, no_kamar: 'A-201', gedung: 'Gedung A (Putra)', lantai: 2, kapasitas: 4, terisi: 3 },
    { id: 4, no_kamar: 'B-101', gedung: 'Gedung B (Putri)', lantai: 1, kapasitas: 4, terisi: 1 },
    { id: 5, no_kamar: 'B-102', gedung: 'Gedung B (Putri)', lantai: 1, kapasitas: 4, terisi: 0 },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Kelola Kamar Asrama</h1>
          <p className="text-body">Data kamar per gedung asrama, kapasitas, dan plotting penghuni</p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          Tambah Kamar Baru
        </Button>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-error)' }}>
           PANDUAN PENGERJAAN KELOMPOK • KELOLA KAMAR (ADMIN)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/admin/KelolaKamar.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sesuai tabel <code>Kamar (id, nomor_kamar, lantai, id_gedung)</code> di whiteboard, buat form untuk tambah kamar, pilih gedung relasi (<code>gedung_id</code>), set nomor kamar dan lantai. Hubungkan ke endpoint <code>/api/kamars</code>.
        </p>
      </Card>

      {/* Table */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Nomor Kamar</th>
                <th style={{ padding: '16px' }}>Gedung</th>
                <th style={{ padding: '16px' }}>Lantai</th>
                <th style={{ padding: '16px' }}>Kapasitas</th>
                <th style={{ padding: '16px' }}>Status Terisi</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {kamars.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontWeight: '700' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DoorOpen size={16} color="var(--color-primary)" />
                      <span>{k.no_kamar}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{k.gedung}</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>Lantai {k.lantai}</td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{k.kapasitas} Orang</td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={k.terisi >= k.kapasitas ? 'error' : 'success'} size="sm">
                      {k.terisi} / {k.kapasitas} Terisi
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Button size="sm" variant="ghost" icon={Edit2}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={Trash2} style={{ color: 'var(--color-error)' }}>Hapus</Button>
                    </div>
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
