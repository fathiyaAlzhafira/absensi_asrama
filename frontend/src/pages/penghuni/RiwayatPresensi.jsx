import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { History, Calendar, Eye, X, MapPin } from 'lucide-react';
import { api } from '../../services/api';

export default function RiwayatPresensi() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getMyPresensi().then((res) => {
      if (res && res.data) {
        setRiwayat(res.data);
      }
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Riwayat Presensi</h1>
        <p className="text-body">Rekapitulasi kehadiran Anda pada sesi Subuh dan Malam</p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: '220px' }}>
          <Input
            type="month"
            label="Pilih Periode Bulan"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          />
        </div>
      </div>

      {/* Table Card */}
      <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-l2)', color: 'var(--color-neutral)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px' }}>Tanggal</th>
                <th style={{ padding: '16px' }}>Sesi</th>
                <th style={{ padding: '16px' }}>Waktu Absen</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Koordinat GPS</th>
                <th style={{ padding: '16px' }}>Keterangan</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Foto Selfie</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    Memuat data riwayat presensi...
                  </td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral)' }}>
                    Belum ada riwayat presensi yang tercatat.
                  </td>
                </tr>
              ) : (
                riwayat.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '16px', color: 'var(--color-text-primary)', fontWeight: '600' }}>{row.tanggal}</td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={row.sesi === 'subuh' ? 'default' : 'warning'} size="sm">
                      {row.sesi.toUpperCase()}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>
                    {row.waktu !== '00:00:00' ? row.waktu : '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <Badge variant={row.status === 'hadir' ? 'success' : row.status === 'izin' ? 'warning' : 'error'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td style={{ padding: '16px', fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--color-neutral)' }}>
                    {row.lat && row.long ? `${row.lat}, ${row.long}` : '-'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--color-neutral)' }}>{row.keterangan || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {row.foto_wajah ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => setSelectedPhoto(row.foto_wajah)}
                      >
                        Lihat Foto
                      </Button>
                    ) : (
                      <span style={{ color: 'var(--color-neutral)' }}>-</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Preview Foto Selfie */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface-l1)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            maxWidth: '460px',
            width: '100%',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="text-card-title">Foto Selfie Presensi</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{
              width: '100%',
              height: '320px',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              backgroundColor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img
                src={selectedPhoto}
                alt="Foto Selfie"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button size="sm" variant="secondary" onClick={() => setSelectedPhoto(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
