import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Camera, MapPin, CheckCircle2, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Presensi() {
  const { user } = useAuth();
  const [inAsramaArea, setInAsramaArea] = useState(true);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleCapture = () => {
    setPhotoTaken(true);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(true);
    }, 1000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-page-title">Presensi Kehadiran</h1>
        <p className="text-body">Pastikan Anda berada di lingkungan Asrama Unand dan mengaktifkan akses kamera & lokasi</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Left: Viewfinder Camera Card */}
        <Card hoverable={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--color-primary)" />
              <span className="text-card-title">Kamera Selfie Wajah</span>
            </div>
            <Badge variant="neutral">Kamera Aktif</Badge>
          </div>

          {/* Viewfinder Preview Box */}
          <div style={{
            width: '100%',
            height: '320px',
            backgroundColor: '#000000',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--color-surface-l2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            {photoTaken ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <CheckCircle2 size={56} color="var(--color-primary)" style={{ marginBottom: '12px' }} />
                <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '4px' }}>Foto Wajah Berhasil Diambil</h4>
                <p className="text-small">Siap dikirim ke sistem presensi</p>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={RefreshCw}
                  onClick={() => setPhotoTaken(false)}
                  style={{ marginTop: '12px' }}
                >
                  Ambil Ulang Foto
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  width: '140px',
                  height: '180px',
                  border: '2px solid var(--color-primary)',
                  borderRadius: 'var(--radius-pill)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6
                }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral)', textAlign: 'center', padding: '8px' }}>
                    Posisikan Wajah di Sini
                  </span>
                </div>
                <Button size="md" variant="primary" icon={Camera} onClick={handleCapture}>
                  Ambil Foto Sekarang
                </Button>
              </div>
            )}
          </div>

          {successMessage && (
            <div style={{
              backgroundColor: 'rgba(29,185,84,0.15)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center',
              color: 'var(--color-primary)',
              fontWeight: '700',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
               Presensi Berhasil Disimpan ke Database!
            </div>
          )}

          <Button
            size="lg"
            variant="primary"
            style={{ width: '100%' }}
            disabled={!photoTaken || !inAsramaArea || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Mengirim Data...' : 'Kirim Presensi Sekarang'}
          </Button>
        </Card>

        {/* Right: GPS Location & Verification Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* GPS Status Card */}
          <Card hoverable={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color={inAsramaArea ? 'var(--color-primary)' : 'var(--color-error)'} />
                <span className="text-card-title">Validasi Lokasi (Geofencing)</span>
              </div>
              <Badge variant={inAsramaArea ? 'success' : 'error'}>
                {inAsramaArea ? 'Di Dalam Asrama' : 'Di Luar Area'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-neutral)' }}>Koordinat Anda:</span>
                <span style={{ fontFamily: 'var(--font-code)', color: 'var(--color-text-primary)' }}>-0.914210, 100.461910</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-neutral)' }}>Pusat Asrama:</span>
                <span style={{ fontFamily: 'var(--font-code)', color: 'var(--color-text-primary)' }}>-0.914200, 100.461900</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-neutral)' }}>Jarak dari Asrama:</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>14 Meter (Maks 100m)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-neutral)' }}>Sesi Aktif:</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: '700' }}>Subuh (04.00 - 06.00 WIB)</span>
              </div>
            </div>
          </Card>

          {/* Guide for Group Mate */}
          <Card style={{ borderLeft: '4px solid var(--color-primary)' }}>
            <span className="text-label" style={{ color: 'var(--color-primary)' }}>
              PANDUAN PENGERJAAN KELOMPOK • PRESENSI KAMERA & GPS
            </span>
            <h3 className="text-card-title" style={{ marginTop: '6px', marginBottom: '8px' }}>
              File: src/pages/penghuni/Presensi.jsx
            </h3>
            <p className="text-body" style={{ fontSize: '13px', lineHeight: '22px' }}>
              <strong>Tugas Anggota Kelompok:</strong>
              <br />1. Gunakan <code>navigator.mediaDevices.getUserMedia()</code> atau library <code>react-webcam</code> untuk preview kamera asli.
              <br />2. Gunakan <code>navigator.geolocation.getCurrentPosition()</code> untuk mengambil koordinat latitude & longitude asli ponsel.
              <br />3. Kirim data ke API <code>/api/presensis</code> dengan payload: <code>user_id, tanggal, waktu, sesi, lat, long, foto_wajah</code>.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
