import React from 'react';

export default function RoomSelector({
  selectedGedungId,
  selectedLantai,
  kamarId,
  roomSearch,
  setRoomSearch,
  buildingOptions,
  availableFloors,
  filteredRooms,
  editingUserId,
  onGedungSelect,
  onLantaiSelect,
  onKamarChange,
  selectStyle
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-surface-l2)',
        border: '1px solid var(--color-border)'
      }}
    >
      <span
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        Penempatan Gedung &amp; Kamar
      </span>

      {/* Gedung Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Gedung Asrama
        </label>
        <select
          value={selectedGedungId}
          onChange={(e) => onGedungSelect(e.target.value)}
          style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)' }}
        >
          <option value="">Belum ditempatkan</option>
          {buildingOptions.map((g) => (
            <option key={g.id} value={g.id}>{g.nama}</option>
          ))}
        </select>
      </div>

      {/* Lantai Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Lantai
        </label>
        <select
          value={selectedLantai}
          onChange={(e) => onLantaiSelect(e.target.value)}
          disabled={!selectedGedungId}
          style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)', opacity: selectedGedungId ? 1 : 0.6 }}
        >
          <option value="">Semua Lantai</option>
          {availableFloors.map((fl) => (
            <option key={fl} value={fl}>Lantai {fl}</option>
          ))}
        </select>
      </div>

      {/* Kamar Selection with Quick Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-neutral)', textTransform: 'uppercase' }}>
          Kamar
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', gap: '10px' }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            disabled={!selectedGedungId}
            value={roomSearch}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setRoomSearch(val);
              const q = val.trim().toLowerCase();
              if (q) {
                const firstMatch = filteredRooms.find((r) =>
                  String(r.nomor_kamar || '').toLowerCase().includes(q)
                );
                if (firstMatch) {
                  onKamarChange(String(firstMatch.id));
                }
              }
            }}
            placeholder="Cari nomor kamar..."
            style={{
              ...selectStyle,
              backgroundColor: 'var(--color-surface-l1)',
              outline: 'none',
              opacity: selectedGedungId ? 1 : 0.6
            }}
          />

          <select
            value={kamarId}
            disabled={!selectedGedungId}
            onChange={(e) => onKamarChange(e.target.value)}
            style={{ ...selectStyle, backgroundColor: 'var(--color-surface-l1)', opacity: selectedGedungId ? 1 : 0.6 }}
          >
            <option value="">
              {selectedGedungId ? `-- Pilih Kamar (${filteredRooms.length} tersedia) --` : 'Pilih gedung terlebih dahulu'}
            </option>
            {filteredRooms.map((room) => {
              const terisi = Number(room.jumlah_penghuni ?? 0);
              const kapasitas = Number(room.kapasitas ?? 4);
              const isCurrentUserRoom = editingUserId && String(room.id) === String(kamarId);
              const isFull = terisi >= kapasitas && !isCurrentUserRoom;
              return (
                <option key={room.id} value={room.id} disabled={isFull}>
                  Kamar {room.nomor_kamar} (Lt. {room.lantai}) — {terisi}/{kapasitas}{isFull ? ' [Penuh]' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {selectedGedungId && filteredRooms.length === 0 && (
          <span style={{ fontSize: '12px', color: 'var(--color-error)' }}>
            {roomSearch
              ? `Tidak ada kamar dengan nomor "${roomSearch}" pada filter ini.`
              : 'Gedung/lantai ini belum memiliki kamar. Tambahkan kamar di menu Kelola Kamar.'}
          </span>
        )}
      </div>
    </div>
  );
}
