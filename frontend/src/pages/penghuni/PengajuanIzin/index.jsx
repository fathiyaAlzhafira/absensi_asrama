import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import RiwayatStatusIzin from '../../../components/penghuni/RiwayatStatusIzin';
import { usePengajuanIzin } from './usePengajuanIzin';
import PengajuanIzinForm from './PengajuanIzinForm';
import IzinStatusPopup from './IzinStatusPopup';

export default function PengajuanIzin() {
  const {
    schedule,
    formData,
    setFormData,
    selectedFile,
    fileInputRef,
    loading,
    popup,
    setPopup,
    historyRefreshKey,
    setHistoryRefreshKey,
    todayStr,
    durationDays,
    handleSesiChange,
    handleSingleDateChange,
    handleStartDateChange,
    handleEndDateChange,
    handleFileChange,
    handleRemoveFile,
    handleSubmit
  } = usePengajuanIzin();

  const handleClosePopup = (wasSuccess) => {
    setPopup(null);
    if (wasSuccess) {
      document.getElementById('riwayat-izin')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="resident-page resident-pengajuan-izin">
      {/* Top Heading Banner */}
      <div className="resident-permission-heading">
        <div className="resident-page-heading">
          <div className="resident-subpage-banner">
            <Link
              to="/penghuni/dashboard"
              className="resident-subpage-back"
              aria-label="Kembali ke beranda"
              title="Kembali ke beranda"
            >
              <ChevronLeft size={22} />
            </Link>
            <h1 className="resident-subpage-title">Form Pengajuan Izin</h1>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="resident-permission-layout">
        <div className="resident-permission-form">
          <PengajuanIzinForm
            formData={formData}
            setFormData={setFormData}
            schedule={schedule}
            durationDays={durationDays}
            todayStr={todayStr}
            selectedFile={selectedFile}
            fileInputRef={fileInputRef}
            loading={loading}
            onSesiChange={handleSesiChange}
            onSingleDateChange={handleSingleDateChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onFileChange={handleFileChange}
            onRemoveFile={handleRemoveFile}
            onSubmit={handleSubmit}
          />
        </div>

        <RiwayatStatusIzin
          refreshKey={historyRefreshKey}
          onPermitChanged={() => setHistoryRefreshKey((key) => key + 1)}
        />
      </div>

      {/* Pop Up Feedback Modal */}
      <IzinStatusPopup popup={popup} onClose={handleClosePopup} />
    </div>
  );
}
