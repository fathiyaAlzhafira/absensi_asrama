import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, X } from 'lucide-react';
import Button from '../common/Button';
import { api } from '../../services/api';
import { getPresensiScheduleState } from '../../utils/presensiSchedule';

function getCameraError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
    return 'Izin kamera ditolak. Aktifkan akses kamera di pengaturan browser.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'Kamera tidak ditemukan pada perangkat ini.';
  }
  return 'Kamera tidak dapat dibuka. Pastikan browser menggunakan HTTPS atau localhost.';
}

export default function AttendanceCapture({
  session,
  coords,
  building,
  geofenceStatus,
  onSubmitted
}) {
  const videoRef = useRef(null);
  const activeRef = useRef(false);
  const cameraRequestRef = useRef(0);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      cameraRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!stream || !videoRef.current) return undefined;
    videoRef.current.srcObject = stream;
    return () => stream.getTracks().forEach((track) => track.stop());
  }, [stream]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !submitting) closeModal();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [modalOpen, submitting]);

  const closeModal = () => {
    cameraRequestRef.current += 1;
    setStream(null);
    setModalOpen(false);
    setPhoto('');
    setCameraError('');
    setSubmitError('');
    setSubmitted(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setSubmitError('');
    setPhoto('');
    setSubmitted(false);
    setModalOpen(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Browser ini tidak mendukung kamera. Gunakan browser terbaru melalui HTTPS atau localhost.');
      return;
    }

    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;
    setCameraLoading(true);
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user' }
      });
      if (!activeRef.current || cameraRequestRef.current !== requestId) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      setStream(cameraStream);
    } catch (error) {
      if (cameraRequestRef.current === requestId) setCameraError(getCameraError(error));
    } finally {
      if (cameraRequestRef.current === requestId) setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError('Kamera belum siap. Tunggu beberapa saat lalu coba lagi.');
      return;
    }

    const canvas = document.createElement('canvas');
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setCameraError('Foto tidak dapat diproses oleh browser ini.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.82));
    setStream(null);
  };

  const submitAttendance = async () => {
    setSubmitError('');
    if (getPresensiScheduleState(new Date()).activeSession?.id !== session.id) {
      setSubmitError('Sesi presensi sudah ditutup. Foto tidak dapat dikirim.');
      return;
    }
    if (!coords || !photo) {
      setSubmitError('Lokasi perangkat dan foto perlu tersedia sebelum presensi dikirim.');
      return;
    }
    if (geofenceStatus !== 'inside') {
      setSubmitError(geofenceStatus === 'outside'
        ? 'Lokasi Anda berada di luar area gedung yang ditetapkan.'
        : geofenceStatus === 'inactive'
          ? 'Gedung tempat tinggal sedang tidak aktif untuk presensi.'
        : 'Area presensi gedung belum tersedia atau belum dapat diverifikasi.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.submitPresensi({
        sesi: session.id,
        lat: coords.latitude,
        long: coords.longitude,
        foto_wajah: photo
      });
      if (response.status !== 'success') {
        throw new Error(response.message || 'Presensi gagal dikirim.');
      }
      setSubmitted(true);
      onSubmitted?.(response.data);
    } catch (error) {
      setSubmitError(error.message || 'Presensi gagal dikirim. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="resident-camera-capture">
      <Button type="button" variant="primary" size="lg" onClick={startCamera}>
        Ambil foto presensi {session.label}
      </Button>

      {modalOpen && (
        <div
          className="resident-camera-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) closeModal();
          }}
        >
          <section
            className="resident-camera-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resident-camera-title"
          >
            <header className="resident-camera-dialog-header">
              <div>
                <h2 id="resident-camera-title">Presensi {session.label}</h2>
                <p>Ambil foto dan pastikan lokasi Anda berada di area gedung.</p>
              </div>
              <button
                type="button"
                className="resident-camera-close"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Tutup kamera"
              >
                <X size={20} />
              </button>
            </header>

            <div className="resident-camera-location" role="status">
              <MapPin size={18} />
              <div>
                <strong>{building?.nama || 'Gedung tempat tinggal'}</strong>
                {coords ? (
                  <span>
                    {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                    {Number.isFinite(coords.accuracy) && ` · akurasi ±${Math.round(coords.accuracy)} m`}
                  </span>
                ) : (
                  <span>Lokasi perangkat belum tersedia.</span>
                )}
                <span className={`resident-geofence-status ${geofenceStatus || 'checking'}`}>
                  {geofenceStatus === 'inside'
                    ? 'Lokasi sesuai area gedung'
                    : geofenceStatus === 'outside'
                      ? 'Lokasi di luar area gedung'
                      : geofenceStatus === 'unconfigured'
                        ? 'Area gedung belum diatur'
                          : geofenceStatus === 'inactive'
                            ? 'Gedung tempat tinggal sedang nonaktif'
                        : 'Memeriksa area presensi...'}
                </span>
              </div>
            </div>

            {submitted ? (
              <div className="resident-camera-success" role="status">
                <CheckCircle2 size={20} />
                <span>Presensi {session.label} berhasil tercatat.</span>
              </div>
            ) : (
              <>
                {cameraLoading && <div className="resident-camera-placeholder">Menyiapkan kamera...</div>}
                {stream && (
                  <div className="resident-camera-preview">
                    <video ref={videoRef} autoPlay playsInline muted aria-label="Pratinjau kamera" />
                    <Button type="button" variant="primary" onClick={capturePhoto}>
                      Ambil foto
                    </Button>
                  </div>
                )}
                {photo && (
                  <div className="resident-camera-preview">
                    <img src={photo} alt="Pratinjau foto presensi" />
                    <Button type="button" variant="secondary" onClick={() => setPhoto('')}>
                      Foto ulang
                    </Button>
                  </div>
                )}
                {!cameraLoading && !stream && !photo && !cameraError && (
                  <div className="resident-camera-placeholder">
                    Kamera siap digunakan. Izinkan akses kamera untuk mengambil foto.
                  </div>
                )}
                {photo && (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    disabled={!coords || geofenceStatus !== 'inside' || submitting}
                    onClick={submitAttendance}
                  >
                    {submitting ? 'Mengirim presensi...' : 'Kirim presensi'}
                  </Button>
                )}
              </>
            )}

            {cameraError && <p className="resident-camera-error" role="alert">{cameraError}</p>}
            {submitError && <p className="resident-camera-error" role="alert">{submitError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
