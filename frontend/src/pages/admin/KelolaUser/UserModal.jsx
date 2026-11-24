import React from 'react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { X, Check, AlertCircle, RotateCcw } from 'lucide-react';
import FasilAssignmentSelector from './FasilAssignmentSelector';
import RoomSelector from './RoomSelector';

export default function UserModal({
  isOpen,
  onClose,
  editingUserId,
  formData,
  setFormData,
  formError,
  submitting,
  selectedGedungId,
  selectedLantai,
  roomSearch,
  setRoomSearch,
  buildingOptions,
  availableFloors,
  filteredRooms,
  defaultPasswordSuggestion,
  onNameChange,
  onNimChange,
  onGedungSelect,
  onLantaiSelect,
  onResetPasswordToggle,
  onSaveUser
}) {
  if (!isOpen) return null;

  const selectStyle = {
    height: '42px',
    backgroundColor: 'var(--color-surface-l2)',
    color: 'var(--color-text-primary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    padding: '0 12px',
    fontSize: '13px',
    width: '100%'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface-l1)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          width: '100%',
          maxWidth: '540px',
          padding: '24px',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="text-section-title">
            {editingUserId ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-neutral)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {formError && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              backgroundColor: 'rgba(226, 33, 52, 0.15)',
              border: '1px solid var(--color-error)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={onSaveUser} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hidden inputs to prevent browser credentials autofill */}
          <input type="text" name="fake_username_autofill" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} readOnly />
          <input type="password" name="fake_password_autofill" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} readOnly />

          <Input
            label="Nama Lengkap"
            name="user_full_name"
            autoComplete="off"
            required
            value={formData.nama}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Masukkan nama lengkap"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Input
                label="Email Kampus"
                type="email"
                name="user_campus_email"
                autoComplete="off"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={formData.role === 'penghuni' ? 'nama@student.unand.ac.id' : 'nama@unand.ac.id'}
              />
              {formData.role === 'penghuni' && (
                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '500' }}>
                  *Wajib domain: @student.unand.ac.id
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Input
                label="NIM (Nomor Induk)"
                type="text"
                name="user_nim_number"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                value={formData.nim}
                onChange={(e) => onNimChange(e.target.value)}
                placeholder="Contoh: 2311521001"
              />
              <span
                style={{
                  fontSize: '11px',
                  color: formData.nim && formData.nim.length === 10 ? 'var(--color-primary)' : 'var(--color-neutral)'
                }}
              >
                *Harus tepat 10 digit ({formData.nim ? formData.nim.length : 0}/10)
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                Role Pengguna
              </label>
              <select
                value={formData.role}
                onChange={(e) => {
                  const nextRole = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    role: nextRole,
                    kamar_id: nextRole === 'fasil' ? '' : prev.kamar_id
                  }));
                }}
                style={selectStyle}
              >
                <option value="penghuni">Penghuni Asrama</option>
                <option value="fasil">Fasilitator (Fasil)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
                Jenis Kelamin
              </label>
              <select
                value={formData.jekel}
                onChange={(e) => setFormData({ ...formData, jekel: e.target.value })}
                style={selectStyle}
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Penugasan Gedung & Lantai Binaan Khusus Fasilitator */}
          {formData.role === 'fasil' && (
            <FasilAssignmentSelector
              selectedGedungId={selectedGedungId}
              selectedLantai={selectedLantai}
              buildingOptions={buildingOptions}
              availableFloors={availableFloors}
              onGedungSelect={onGedungSelect}
              onLantaiSelect={onLantaiSelect}
              selectStyle={selectStyle}
            />
          )}

          {/* Penempatan Gedung & Kamar Khusus Penghuni */}
          {formData.role === 'penghuni' && (
            <RoomSelector
              selectedGedungId={selectedGedungId}
              selectedLantai={selectedLantai}
              kamarId={formData.kamar_id}
              roomSearch={roomSearch}
              setRoomSearch={setRoomSearch}
              buildingOptions={buildingOptions}
              availableFloors={availableFloors}
              filteredRooms={filteredRooms}
              editingUserId={editingUserId}
              onGedungSelect={onGedungSelect}
              onLantaiSelect={onLantaiSelect}
              onKamarChange={(id) => setFormData((prev) => ({ ...prev, kamar_id: id }))}
              selectStyle={selectStyle}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Asal Daerah"
              value={formData.asal}
              onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
              placeholder="Kota / Kabupaten"
            />
            <Input
              label="No. WhatsApp / HP"
              type="text"
              inputMode="numeric"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value.replace(/[^\d+]/g, '') })}
              placeholder="0812..."
            />
          </div>

          {editingUserId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reset Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-l2)',
                  border: formData.password ? '1px solid var(--color-primary)' : '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: '13px', color: formData.password ? 'var(--color-primary)' : 'var(--color-text-secondary)', fontWeight: formData.password ? '600' : '400' }}>
                  {formData.password
                    ? `✓ Password akan direset ke default: ${formData.password}`
                    : `Kembalikan password ke default (${defaultPasswordSuggestion || 'NamaAwal + NIM'})`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={formData.password ? 'ghost' : 'secondary'}
                  icon={RotateCcw}
                  onClick={onResetPasswordToggle}
                >
                  {formData.password ? 'Batal Reset' : 'Reset Password'}
                </Button>
              </div>
            </div>
          ) : (
            <Input
              label="Password Awal"
              type="password"
              name="new_account_initial_password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
              }}
              placeholder="Otomatis NamaAwal + NIM"
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Check} disabled={submitting}>
              {submitting ? 'Menyimpan...' : editingUserId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
