import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';
import { Plus, FileText, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function StatusIzin() {
  const [daftarIzin, setDaftarIzin] = useState([
    {
      id: 1,
      jenis_izin: 'pulang_kampung',
      tanggal_mulai: '2026-09-24',
      tanggal_selesai: '2026-09-26',
      keterangan: 'Ada acara keluarga di kampung halaman Solok',
      status: 'disetujui',
      catatan_fasil: 'Disetujui. Harap kembali ke asrama sebelum presensi malam tanggal 26.',
      bukti_file: 'uploads/izin/bukti_surat_izin.pdf'
    },
    {
      id: 2,
      jenis_izin: 'sakit',
      tanggal_mulai: '2026-09-18',
      tanggal_selesai: '2026-09-19',
      keterangan: 'Demam tinggi dan istirahat di klinik',
      status: 'disetujui',
      catatan_fasil: 'Disetujui. Surat dokter terlampir valid.',
      bukti_file: 'uploads/izin/surat_dokter.jpg'
    },
    {
      id: 3,
      jenis_izin: 'kegiatan_kampus',
      tanggal_mulai: '2026-09-10',
      tanggal_selesai: '2026-09-10',
      keterangan: 'Rapat panitia inaugurasi fakultas hingga larut malam',
      status: 'ditolak',
      catatan_fasil: 'Tidak menyertakan tanda tangan resmi pembina organisasi.',
      bukti_file: 'uploads/izin/surat_undangan.pdf'
    }
  ]);

  useEffect(() => {
    api.getMyIzins().then((res) => {
      if (res && res.data && res.data.length > 0) {
        setDaftarIzin(res.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Status Izin Saya</h1>
        <p className="text-body">Pantau status persetujuan dari Fasilitator Asrama</p>
      </div>

      {/* List Kartu Izin */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {daftarIzin.map((item) => (
          <Card key={item.id} hoverable={false} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 className="text-card-title" style={{ fontSize: '18px', color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                  {item.jenis_izin ? item.jenis_izin.replace('_', ' ') : 'Izin'}
                </h3>
                <span className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '2px', display: 'block' }}>
                  Periode: {item.tanggal_mulai} s/d {item.tanggal_selesai}
                </span>
              </div>
              <Badge variant={item.status === 'disetujui' ? 'success' : item.status === 'ditolak' ? 'error' : 'warning'}>
                {item.status}
              </Badge>
            </div>

            <p className="text-body-white" style={{ marginBottom: '16px', fontSize: '14px' }}>
              "{item.keterangan}"
            </p>

            {item.catatan_fasil && (
              <div style={{
                backgroundColor: 'var(--color-surface-l2)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${item.status === 'disetujui' ? 'var(--color-primary)' : 'var(--color-error)'}`,
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-neutral)', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
                  Catatan dari Fasilitator:
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                  {item.catatan_fasil}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-neutral)' }}>
                <FileText size={16} />
                <span>Lampiran: <strong style={{ color: 'var(--color-text-primary)' }}>{item.bukti_file || 'Berkas Terlampir'}</strong></span>
              </div>
              <Button size="sm" variant="ghost" icon={ExternalLink}>
                Buka Berkas
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
