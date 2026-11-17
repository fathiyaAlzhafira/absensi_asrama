import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Clock, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { getStoredPresensiSchedule, savePresensiSchedule } from '../../utils/presensiSchedule';

export default function PengaturanPresensi() {
  const [config, setConfig] = useState(() => getStoredPresensiSchedule());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.getPengaturanPresensi()
      .then((res) => {
        if (!active || !res?.data) return;
        const normalized = savePresensiSchedule(res.data);
        setConfig(normalized);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Jadwal presensi gagal dimuat dari server.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await api.updatePengaturanPresensi(config);
      const updated = savePresensiSchedule(response?.data || config);
      setConfig(updated);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (saveErr) {
      setError(saveErr.message || 'Gagal menyimpan pengaturan jadwal presensi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-management-page">
      <header className="admin-management-header">
        <div>
          <h1 className="text-page-title">Pengaturan Jadwal Presensi</h1>
          <p className="text-body">
            Atur jam buka dan tutup presensi Subuh serta Malam. Batas wilayah presensi diatur per gedung melalui poligon pada menu Kelola Gedung.
          </p>
        </div>
      </header>

      <Card hoverable={false} style={{ maxWidth: '720px', padding: '24px' }}>
        {loading ? (
          <p className="text-body">Memuat jadwal presensi...</p>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={18} color="var(--color-primary)" />
                <h2 className="text-card-title">Jadwal Sesi Subuh</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Input
                  type="time"
                  label="Jam Mulai Subuh"
                  required
                  value={config.jam_subuh_mulai}
                  onChange={(e) => setConfig({ ...config, jam_subuh_mulai: e.target.value })}
                />
                <Input
                  type="time"
                  label="Jam Selesai Subuh"
                  required
                  value={config.jam_subuh_selesai}
                  onChange={(e) => setConfig({ ...config, jam_subuh_selesai: e.target.value })}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={18} color="var(--color-warning)" />
                <h2 className="text-card-title">Jadwal Sesi Malam</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <Input
                  type="time"
                  label="Jam Mulai Malam"
                  required
                  value={config.jam_malam_mulai}
                  onChange={(e) => setConfig({ ...config, jam_malam_mulai: e.target.value })}
                />
                <Input
                  type="time"
                  label="Jam Selesai Malam"
                  required
                  value={config.jam_malam_selesai}
                  onChange={(e) => setConfig({ ...config, jam_malam_selesai: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="admin-management-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {saved && (
              <div className="admin-management-notice" role="status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} />
                <span>Jadwal presensi berhasil diperbarui dan langsung berlaku.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="md" icon={Save} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Jadwal Presensi'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
