import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Settings, Clock, MapPin, Save, CheckCircle } from 'lucide-react';

export default function PengaturanPresensi() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    jam_subuh_mulai: '04:00',
    jam_subuh_selesai: '06:00',
    jam_malam_mulai: '18:00',
    jam_malam_selesai: '20:30',
    lat_default: '-0.91420000',
    long_default: '100.46190000',
    radius_default_meter: 100
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Pengaturan Jam & Radius Presensi</h1>
        <p className="text-body">Konfigurasi jadwal operasional presensi Subuh & Malam serta batas GPS geofencing</p>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-error)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-error)' }}>
           PANDUAN PENGERJAAN KELOMPOK • PENGATURAN PRESENSI (ADMIN)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/admin/PengaturanPresensi.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sesuai aturan papan tulis (<em>"Subuh 04.00-06.00 dan Malam 18.00-20.30 harus di asrama"</em>), hubungkan form ini ke tabel <code>pengaturan_presensi</code> agar admin bisa mengubah jam absensi dan batas radius toleransi GPS sewaktu-waktu tanpa ubah kodingan.
        </p>
      </Card>

      <Card hoverable={false} style={{ maxWidth: '720px', padding: '28px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Bagian Jadwal Sesi Subuh */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={18} color="var(--color-primary)" />
              <h3 className="text-card-title">Jadwal Sesi Subuh</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                type="time"
                label="Jam Mulai Subuh"
                value={config.jam_subuh_mulai}
                onChange={(e) => setConfig({ ...config, jam_subuh_mulai: e.target.value })}
              />
              <Input
                type="time"
                label="Jam Selesai Subuh"
                value={config.jam_subuh_selesai}
                onChange={(e) => setConfig({ ...config, jam_subuh_selesai: e.target.value })}
              />
            </div>
          </div>

          {/* Bagian Jadwal Sesi Malam */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Clock size={18} color="var(--color-warning)" />
              <h3 className="text-card-title">Jadwal Sesi Malam</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                type="time"
                label="Jam Mulai Malam"
                value={config.jam_malam_mulai}
                onChange={(e) => setConfig({ ...config, jam_malam_mulai: e.target.value })}
              />
              <Input
                type="time"
                label="Jam Selesai Malam"
                value={config.jam_malam_selesai}
                onChange={(e) => setConfig({ ...config, jam_malam_selesai: e.target.value })}
              />
            </div>
          </div>

          {/* Bagian Titik Lokasi & Radius */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MapPin size={18} color="var(--color-primary)" />
              <h3 className="text-card-title">Koordinat Geofencing Asrama Unand</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="Latitude Pusat Asrama"
                value={config.lat_default}
                onChange={(e) => setConfig({ ...config, lat_default: e.target.value })}
              />
              <Input
                label="Longitude Pusat Asrama"
                value={config.long_default}
                onChange={(e) => setConfig({ ...config, long_default: e.target.value })}
              />
            </div>
            <Input
              type="number"
              label="Radius Toleransi Presensi (Meter)"
              value={config.radius_default_meter}
              onChange={(e) => setConfig({ ...config, radius_default_meter: e.target.value })}
            />
          </div>

          {saved && (
            <div style={{
              backgroundColor: 'rgba(29,185,84,0.15)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              color: 'var(--color-primary)',
              fontWeight: '700',
              textAlign: 'center',
              fontSize: '13px'
            }}>
               Pengaturan presensi berhasil disimpan!
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" icon={Save}>
            Simpan Perubahan Pengaturan
          </Button>
        </form>
      </Card>
    </div>
  );
}
