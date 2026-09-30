import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Check, X, FileText, Download, MessageSquare } from 'lucide-react';

export default function VerifikasiIzin() {
  const [permohonan] = useState([
    {
      id: 1,
      nama: 'Budi Santoso',
      nim: '2311521002',
      kamar: 'A-101',
      jenis: 'Sakit',
      periode: '24-09-2026 s/d 25-09-2026',
      alasan: 'Demam dan flu berat, istirahat di kamar kosan kerabat dekat rumah sakit',
      file: 'surat_keterangan_dokter.pdf',
      status: 'pending'
    },
    {
      id: 2,
      nama: 'Muhammad Hanif',
      nim: '2311521015',
      kamar: 'A-201',
      jenis: 'Pulang Kampung',
      periode: '25-09-2026 s/d 28-09-2026',
      alasan: 'Acara pernikahan kakak kandung di Payakumbuh',
      file: 'undangan_pernikahan.jpg',
      status: 'pending'
    }
  ]);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Verifikasi Pengajuan Izin</h1>
        <p className="text-body">Tinjau berkas bukti dan berikan persetujuan atau penolakan izin penghuni</p>
      </div>

      {/* Task Note Box */}
      <Card style={{ borderLeft: '4px solid var(--color-warning)', marginBottom: '24px' }}>
        <span className="text-label" style={{ color: 'var(--color-warning)' }}>
           PANDUAN PENGERJAAN KELOMPOK • VERIFIKASI IZIN (FASIL)
        </span>
        <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
          File: src/pages/fasil/VerifikasiIzin.jsx
        </h3>
        <p className="text-body" style={{ fontSize: '13px' }}>
          <strong>Tugas Anggota Kelompok:</strong> Sambungkan tombol <strong>Setujui</strong> dan <strong>Tolak</strong> ke API <code>/api/izins/verify/:id</code>. Sediakan modal popup untuk Fasil memasukkan alasan penolakan atau catatan bimbingan sebelum status di-update ke database.
        </p>
      </Card>

      {/* List Izin Pending */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {permohonan.map((item) => (
          <Card key={item.id} hoverable={false} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 className="text-card-title" style={{ fontSize: '18px', color: 'var(--color-text-primary)' }}>{item.nama}</h3>
                  <Badge variant="neutral">NIM: {item.nim}</Badge>
                  <Badge variant="neutral">Kamar {item.kamar}</Badge>
                  <Badge variant="warning">{item.jenis}</Badge>
                </div>
                <div className="text-small" style={{ color: 'var(--color-neutral)', marginTop: '4px' }}>
                  Periode Izin: <strong style={{ color: 'var(--color-text-primary)' }}>{item.periode}</strong>
                </div>
              </div>
              <Badge variant="warning">Menunggu Konfirmasi</Badge>
            </div>

            <div style={{
              backgroundColor: 'var(--color-surface-l2)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '18px'
            }}>
              <span className="text-label" style={{ color: 'var(--color-neutral)' }}>Alasan Pengajuan:</span>
              <p className="text-body-white" style={{ marginTop: '4px' }}>"{item.alasan}"</p>
            </div>

            {/* Lampiran Bukti File (JPG / PDF) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="var(--color-primary)" />
                <span className="text-body-white" style={{ fontSize: '13px' }}>Berkas Bukti: <strong>{item.file}</strong></span>
                <Button size="sm" variant="ghost" icon={Download}>Buka / Unduh</Button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button size="md" variant="danger" icon={X}>
                  Tolak Izin
                </Button>
                <Button size="md" variant="primary" icon={Check}>
                  Setujui Izin
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
