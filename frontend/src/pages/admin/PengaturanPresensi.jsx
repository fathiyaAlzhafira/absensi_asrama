import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Clock, Save, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { api } from '../../services/api';
import { getStoredPresensiSchedule, savePresensiSchedule } from '../../utils/presensiSchedule';

const DEFAULT_SCHEDULE = {
  jam_subuh_mulai: '04:00',
  jam_subuh_selesai: '06:00',
  jam_malam_mulai: '18:00',
  jam_malam_selesai: '20:30'
};

function calcDurationText(start, end) {
  const parse = (val) => {
    const m = String(val || '').replace('.', ':').match(/^(\d{2}):(\d{2})/);
    return m ? (Number(m[1]) * 60) + Number(m[2]) : null;
  };
  const s = parse(start);
  const e = parse(end);
  if (s === null || e === null) return '-';
  if (e <= s) {
    if (e > 0 && e < (12 * 60) && (e + 12 * 60) > s) {
      const pmH = String(Math.floor(e / 60) + 12).padStart(2, '0');
      const pmM = String(e % 60).padStart(2, '0');
      return `Gunakan format 24 jam (${pmH}:${pmM} untuk malam)`;
    }
    return 'Jam selesai harus setelah jam mulai';
  }
  const diff = e - s;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours ? `${hours} jam ` : ''}${mins ? `${mins} menit` : ''}`.trim();
}

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
    <div className="admin-management-page admin-schedule-page">
      <header className="admin-management-header">
        <div>
          <h1 className="text-page-title">Pengaturan Jadwal Presensi</h1>
          <p className="text-body">
            Atur jam operasional presensi Subuh dan Malam. Perubahan jadwal otomatis berlaku untuk seluruh penghuni asrama.
          </p>
        </div>
      </header>

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

      {loading ? (
        <Card hoverable={false}><p className="text-body">Memuat jadwal presensi...</p></Card>
      ) : (
        <form onSubmit={handleSave} className="admin-schedule-form">
          <div className="admin-schedule-grid">
            {/* Kartu Sesi Subuh */}
            <Card hoverable={false} className="admin-schedule-card">
              <div className="admin-schedule-card-header">
                <div className="admin-schedule-title-wrap">
                  <span className="admin-schedule-icon subuh">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h2 className="text-card-title">Sesi Subuh</h2>
                    <p className="text-small">Presensi pagi penghuni asrama</p>
                  </div>
                </div>
                <Badge variant="success" size="sm">
                  {config.jam_subuh_mulai} – {config.jam_subuh_selesai} WIB
                </Badge>
              </div>

              <div className="admin-room-form-row">
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

              <div className="admin-schedule-meta">
                <span>Durasi jendela presensi</span>
                <strong>{calcDurationText(config.jam_subuh_mulai, config.jam_subuh_selesai)}</strong>
              </div>
            </Card>

            {/* Kartu Sesi Malam */}
            <Card hoverable={false} className="admin-schedule-card">
              <div className="admin-schedule-card-header">
                <div className="admin-schedule-title-wrap">
                  <span className="admin-schedule-icon malam">
                    <Clock size={18} />
                  </span>
                  <div>
                    <h2 className="text-card-title">Sesi Malam</h2>
                    <p className="text-small">Presensi malam &amp; jam malam asrama</p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">
                  {config.jam_malam_mulai} – {config.jam_malam_selesai} WIB
                </Badge>
              </div>

              <div className="admin-room-form-row">
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

              <div className="admin-schedule-meta">
                <span>Durasi jendela presensi</span>
                <strong>{calcDurationText(config.jam_malam_mulai, config.jam_malam_selesai)}</strong>
              </div>
            </Card>
          </div>

          <Card hoverable={false} className="admin-schedule-footer-card">
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>
                Validasi Lokasi Presensi Menggunakan Poligon Gedung
              </strong>
              <p className="text-small" style={{ marginTop: '2px' }}>
                Setiap penghuni hanya dapat melakukan presensi di dalam area poligon gedung kamarnya pada jam operasional di atas.
              </p>
            </div>
            <div className="admin-schedule-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setConfig(DEFAULT_SCHEDULE)}
                disabled={saving}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} />
                <span>Kembalikan Default</span>
              </button>
              <Button type="submit" variant="primary" size="md" icon={Save} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Jadwal Presensi'}
              </Button>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
