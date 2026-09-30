import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Building, Plus, MapPin, User, Edit2 } from 'lucide-react';

export default function KelolaGedung() {
  const [gedungs] = useState([
    {
      id: 1,
      nama: 'Asrama Putra Unand (Gedung A)',
      fasil: 'Fasil Muhammad Rizky',
      latLong: '-0.91420000, 100.46190000',
      radius: '100 Meter',
      totalKamar: 30,
      keterangan: 'Gedung khusus mahasiswa putra'
    },
    {
      id: 2,
      nama: 'Asrama Putri Unand (Gedung B)',
      fasil: 'Fasil Siti Nurhaliza',
      latLong: '-0.91480000, 100.46250000',
      radius: '100 Meter',
      totalKamar: 30,
      keterangan: 'Gedung khusus mahasiswi putri'
    }
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-page-title">Kelola Gedung Asrama</h1>
          <p className="text-body">Data gedung asrama, penanggung jawab fasil, dan titik koordinat GPS</p>
        </div>
        <Button variant="primary" size="md" icon={Plus}>
          Tambah Gedung Baru
        </Button>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-error)' }}>
           PANDUAN PENGERJAAN KELOMPOK • KELOLA GEDUNG (ADMIN)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/admin/KelolaGedung.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sesuai tabel <code>Gedung (id, nama, id_user)</code> di rancangan papan tulis, buat form untuk input gedung, pilih Fasil penanggung jawab (<code>id_user</code>), dan set koordinat GPS (lat, long, radius) untuk validasi presensi.
        </p>
      </Card>

      {/* Grid of Buildings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {gedungs.map((g) => (
          <Card key={g.id} hoverable={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building size={24} color="var(--color-primary)" />
                <h3 className="text-card-title" style={{ fontSize: '17px' }}>{g.nama}</h3>
              </div>
              <Button size="sm" variant="ghost" icon={Edit2}>Edit</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="var(--color-neutral)" />
                <span style={{ color: 'var(--color-neutral)' }}>Fasil Penanggung Jawab:</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{g.fasil}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="var(--color-neutral)" />
                <span style={{ color: 'var(--color-neutral)' }}>Koordinat GPS:</span>
                <span style={{ fontFamily: 'var(--font-code)', color: 'var(--color-text-primary)' }}>{g.latLong}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--color-neutral)' }}>Toleransi Radius: <strong style={{ color: 'var(--color-primary)' }}>{g.radius}</strong></span>
                <span style={{ color: 'var(--color-neutral)' }}>Kapasitas: <strong style={{ color: 'var(--color-text-primary)' }}>{g.totalKamar} Kamar</strong></span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
