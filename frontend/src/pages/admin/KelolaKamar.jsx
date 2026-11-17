import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { api } from '../../services/api';

const EMPTY_FORM = { gedung_id: '', nomor_kamar: '', lantai: '', kapasitas: '4' };
const EMPTY_FLOOR = { gedung_id: '', nomor_lantai: '1', nama: '' };

function getData(response, label) {
  if (!Array.isArray(response?.data)) {
    throw new Error(`Data ${label} dari server tidak sesuai format.`);
  }
  return response.data;
}

export default function KelolaKamar() {
  const [kamars, setKamars] = useState([]);
  const [gedungs, setGedungs] = useState([]);
  const [lantais, setLantais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [floorSaving, setFloorSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [customFloor, setCustomFloor] = useState(false);
  const [floorFormOpen, setFloorFormOpen] = useState(false);
  const [floorForm, setFloorForm] = useState(EMPTY_FLOOR);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [roomResponse, buildingResponse, floorResponse] = await Promise.all([
        api.getKamars(),
        api.getGedungs(),
        api.getLantais().catch(() => ({ data: [] }))
      ]);
      setKamars(getData(roomResponse, 'kamar'));
      setGedungs(getData(buildingResponse, 'gedung'));
      setLantais(Array.isArray(floorResponse?.data) ? floorResponse.data : []);
    } catch (loadError) {
      setError(loadError.message || 'Data kamar gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeBuildings = useMemo(
    () => gedungs.filter((building) => building.is_active),
    [gedungs]
  );

  const floorsByBuilding = useMemo(() => {
    const map = new Map();
    const addFloor = (buildingId, floorObj) => {
      const key = String(buildingId || '');
      if (!key) return;
      const list = map.get(key) || [];
      if (!list.some((item) => Number(item.nomor_lantai) === Number(floorObj.nomor_lantai))) {
        list.push(floorObj);
      }
      map.set(key, list);
    };

    lantais.forEach((floor) => addFloor(floor.gedung_id, floor));
    gedungs.forEach((building) => {
      (building.lantais || []).forEach((floor) => addFloor(building.id, floor));
    });
    kamars.forEach((room) => {
      if (room.lantai !== undefined && room.lantai !== null) {
        addFloor(room.gedung_id, { id: null, gedung_id: room.gedung_id, nomor_lantai: Number(room.lantai) });
      }
    });

    map.forEach((list, key) => {
      map.set(key, [...list].sort((a, b) => Number(a.nomor_lantai) - Number(b.nomor_lantai)));
    });
    return map;
  }, [gedungs, kamars, lantais]);

  const filterFloors = useMemo(() => {
    if (buildingFilter) return floorsByBuilding.get(buildingFilter) || [];
    const numbers = new Set();
    floorsByBuilding.forEach((list) => list.forEach((floor) => numbers.add(Number(floor.nomor_lantai))));
    return [...numbers].sort((a, b) => a - b).map((nomor_lantai) => ({ nomor_lantai }));
  }, [buildingFilter, floorsByBuilding]);

  const formBuildingFloors = useMemo(
    () => floorsByBuilding.get(String(form.gedung_id || '')) || [],
    [floorsByBuilding, form.gedung_id]
  );

  const visibleRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return kamars.filter((room) => {
      const buildingId = room.gedung_id ?? room.gedung?.id;
      const buildingName = room.gedung?.nama || room.nama_gedung || room.gedung_nama || '';
      return (!buildingFilter || String(buildingId) === buildingFilter) &&
        (!floorFilter || String(room.lantai) === floorFilter) &&
        (!query || `${room.nomor_kamar || room.no_kamar || ''} ${buildingName}`.toLowerCase().includes(query));
    });
  }, [buildingFilter, floorFilter, kamars, search]);

  const selectedBuilding = useMemo(
    () => gedungs.find((building) => String(building.id) === String(buildingFilter)) || null,
    [buildingFilter, gedungs]
  );

  const openForm = (room = null) => {
    const defaultBuildingId = room
      ? String(room.gedung_id ?? room.gedung?.id ?? '')
      : (buildingFilter || String(activeBuildings[0]?.id ?? ''));
    const buildingFloors = floorsByBuilding.get(defaultBuildingId) || [];
    const defaultFloor = room
      ? String(room.lantai ?? '1')
      : String(floorFilter || buildingFloors[0]?.nomor_lantai || 1);

    setEditing(room);
    setFormOpen(true);
    setCustomFloor(buildingFloors.length === 0);
    setError('');
    setForm(room ? {
      gedung_id: defaultBuildingId,
      nomor_kamar: room.nomor_kamar || room.no_kamar || '',
      lantai: defaultFloor,
      kapasitas: String(room.kapasitas ?? 4)
    } : {
      ...EMPTY_FORM,
      gedung_id: defaultBuildingId,
      lantai: defaultFloor
    });
  };

  const closeForm = () => {
    setEditing(null);
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setCustomFloor(false);
    setError('');
  };

  const handleFormBuildingChange = (nextBuildingId) => {
    const buildingFloors = floorsByBuilding.get(String(nextBuildingId)) || [];
    setCustomFloor(buildingFloors.length === 0);
    setForm((current) => ({
      ...current,
      gedung_id: nextBuildingId,
      lantai: String(buildingFloors[0]?.nomor_lantai ?? (current.lantai || 1))
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        gedung_id: Number(form.gedung_id),
        nomor_kamar: form.nomor_kamar.trim(),
        lantai: Number(form.lantai),
        kapasitas: Number(form.kapasitas)
      };
      if (editing) await api.updateKamar(editing.id, payload);
      else await api.createKamar(payload);
      setNotice(editing ? 'Data kamar berhasil diperbarui.' : 'Kamar berhasil ditambahkan.');
      closeForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Data kamar gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const openFloorModal = (buildingId = '') => {
    const targetBuildingId = String(buildingId || buildingFilter || activeBuildings[0]?.id || '');
    const existing = floorsByBuilding.get(targetBuildingId) || [];
    const nextFloorNumber = existing.length
      ? Math.max(...existing.map((item) => Number(item.nomor_lantai))) + 1
      : 1;
    setError('');
    setNotice('');
    setFloorForm({
      gedung_id: targetBuildingId,
      nomor_lantai: String(nextFloorNumber),
      nama: ''
    });
    setFloorFormOpen(true);
  };

  const submitFloorForm = async (event) => {
    event.preventDefault();
    setFloorSaving(true);
    setError('');
    setNotice('');
    try {
      await api.createLantai({
        gedung_id: Number(floorForm.gedung_id),
        nomor_lantai: Number(floorForm.nomor_lantai),
        nama: floorForm.nama.trim() || null
      });
      setNotice(`Lantai ${floorForm.nomor_lantai} berhasil ditambahkan.`);
      setFloorFormOpen(false);
      await loadData();
    } catch (floorError) {
      setError(floorError.message || 'Lantai gagal ditambahkan.');
    } finally {
      setFloorSaving(false);
    }
  };

  const deleteFloor = async (floor) => {
    if (!floor?.id) return;
    if (!window.confirm(`Hapus Lantai ${floor.nomor_lantai}? Lantai yang masih memiliki kamar tidak dapat dihapus.`)) return;
    setError('');
    setNotice('');
    try {
      await api.deleteLantai(floor.id);
      setNotice(`Lantai ${floor.nomor_lantai} berhasil dihapus.`);
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Lantai gagal dihapus.');
    }
  };

  const deleteRoom = async (room) => {
    const roomName = room.nomor_kamar || room.no_kamar || 'kamar ini';
    if (!window.confirm(`Hapus ${roomName}? Kamar yang masih ditempati tidak dapat dihapus.`)) return;
    setError('');
    setNotice('');
    try {
      await api.deleteKamar(room.id);
      setNotice('Kamar berhasil dihapus.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Kamar gagal dihapus.');
    }
  };

  return (
    <div className="admin-management-page">
      <header className="admin-management-header">
        <div>
          <h1 className="text-page-title">Kelola Kamar Asrama</h1>
          <p className="text-body">Pilih gedung, kelola lantai tiap gedung, lalu tambahkan atau perbarui nomor kamar.</p>
        </div>
        <div className="admin-building-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
          <button type="button" className="admin-secondary-button" onClick={() => openFloorModal()}>
            Tambah lantai
          </button>
          <button type="button" className="admin-action-button" onClick={() => openForm()}>
            Tambah kamar
          </button>
        </div>
      </header>

      {notice && <p className="admin-management-notice" role="status">{notice}</p>}
      {error && !formOpen && !floorFormOpen && <p className="admin-management-error" role="alert">{error}</p>}

      {activeBuildings.length > 0 && (
        <Card hoverable={false}>
          <div className="admin-building-card-heading" style={{ marginBottom: '10px' }}>
            <div>
              <h2 className="text-card-title">Gedung &amp; Lantai Asrama</h2>
              <p className="text-small">Klik gedung untuk menyaring kamar dan mengelola lantainya.</p>
            </div>
            {buildingFilter && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => {
                  setBuildingFilter('');
                  setFloorFilter('');
                }}
              >
                Tampilkan semua gedung
              </button>
            )}
          </div>
          <div className="building-polygon-controls">
            {activeBuildings.map((building) => {
              const selected = String(building.id) === String(buildingFilter);
              const floors = floorsByBuilding.get(String(building.id)) || [];
              return (
                <button
                  key={building.id}
                  type="button"
                  className={`building-map-button ${selected ? 'primary' : ''}`}
                  onClick={() => {
                    setBuildingFilter(selected ? '' : String(building.id));
                    setFloorFilter('');
                  }}
                >
                  {building.nama} ({floors.length} lantai · {building.jumlah_kamar ?? 0} kamar)
                </button>
              );
            })}
          </div>

          {selectedBuilding && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <div className="admin-building-card-heading" style={{ marginBottom: '8px' }}>
                <strong style={{ fontSize: '13px' }}>
                  Daftar lantai di gedung {selectedBuilding.nama}
                </strong>
                <button
                  type="button"
                  className="building-map-button"
                  onClick={() => openFloorModal(selectedBuilding.id)}
                >
                  + Tambah lantai di {selectedBuilding.nama}
                </button>
              </div>
              <div className="building-polygon-controls">
                {(floorsByBuilding.get(String(selectedBuilding.id)) || []).map((floor) => {
                  const activeFloor = String(floor.nomor_lantai) === String(floorFilter);
                  const roomCountOnFloor = kamars.filter(
                    (room) => String(room.gedung_id) === String(selectedBuilding.id) &&
                      Number(room.lantai) === Number(floor.nomor_lantai)
                  ).length;
                  return (
                    <span key={`${selectedBuilding.id}-${floor.nomor_lantai}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        className={`building-map-button ${activeFloor ? 'primary' : ''}`}
                        onClick={() => setFloorFilter(activeFloor ? '' : String(floor.nomor_lantai))}
                      >
                        Lantai {floor.nomor_lantai}{floor.nama ? ` (${floor.nama})` : ''} · {roomCountOnFloor} kamar
                      </button>
                      {floor.id && roomCountOnFloor === 0 && (
                        <button
                          type="button"
                          className="building-map-button"
                          style={{ color: 'var(--color-error)', padding: '4px 8px' }}
                          title={`Hapus Lantai ${floor.nomor_lantai}`}
                          onClick={() => deleteFloor(floor)}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      <Card hoverable={false}>
        <div className="admin-room-filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label className="admin-form-field">
            Cari kamar
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nomor kamar atau nama gedung" />
          </label>
          <label className="admin-form-field">
            Filter gedung
            <select
              value={buildingFilter}
              onChange={(event) => {
                setBuildingFilter(event.target.value);
                setFloorFilter('');
              }}
            >
              <option value="">Semua gedung</option>
              {gedungs.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.nama}{building.is_active ? '' : ' (Nonaktif)'}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-form-field">
            Filter lantai
            <select value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
              <option value="">Semua lantai</option>
              {filterFloors.map((floor) => (
                <option key={floor.nomor_lantai} value={floor.nomor_lantai}>
                  Lantai {floor.nomor_lantai}{floor.nama ? ` - ${floor.nama}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {loading ? (
        <Card><p className="text-body">Memuat data kamar...</p></Card>
      ) : error && kamars.length === 0 ? (
        <Card><p className="text-body">Data kamar gagal dimuat. Periksa koneksi dan sesi login, lalu coba lagi.</p></Card>
      ) : visibleRooms.length === 0 ? (
        <Card>
          <p className="text-body">
            {kamars.length ? 'Tidak ada kamar yang sesuai dengan filter.' : 'Belum ada data kamar. Pilih gedung lalu klik Tambah kamar.'}
          </p>
        </Card>
      ) : (
        <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-room-table-wrap">
            <table className="admin-room-table">
              <thead>
                <tr>
                  <th>Nomor kamar</th>
                  <th>Gedung</th>
                  <th>Lantai</th>
                  <th>Kapasitas</th>
                  <th>Penghuni</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleRooms.map((room) => {
                  const occupants = Number(room.jumlah_penghuni ?? room.terisi ?? room.users_count ?? 0);
                  const capacity = Number(room.kapasitas || 0);
                  const buildingName = room.gedung?.nama || room.nama_gedung || room.gedung_nama || '-';
                  return (
                    <tr key={room.id}>
                      <td data-label="Nomor kamar"><strong>{room.nomor_kamar || room.no_kamar}</strong></td>
                      <td data-label="Gedung">{buildingName}</td>
                      <td data-label="Lantai">Lantai {room.lantai}</td>
                      <td data-label="Kapasitas">{capacity} orang</td>
                      <td data-label="Penghuni">
                        <Badge variant={occupants >= capacity ? 'error' : 'success'} size="sm">
                          {occupants} / {capacity}
                        </Badge>
                      </td>
                      <td data-label="Aksi">
                        <div className="admin-room-actions">
                          <button type="button" className="admin-secondary-button" onClick={() => openForm(room)}>Edit</button>
                          <button type="button" className="admin-secondary-button danger" onClick={() => deleteRoom(room)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {formOpen && (
        <div className="admin-management-backdrop">
          <section className="admin-management-dialog admin-room-dialog" role="dialog" aria-modal="true" aria-labelledby="room-form-title">
            <form onSubmit={submitForm}>
              <div className="admin-management-dialog-heading">
                <div>
                  <h2 id="room-form-title">{editing ? 'Edit kamar' : 'Tambah kamar'}</h2>
                  <p>Pilih gedung, pilih atau masukkan nomor lantai, lalu isi nomor kamar.</p>
                </div>
                <button type="button" className="admin-dialog-close" onClick={closeForm} aria-label="Tutup form">×</button>
              </div>
              <label className="admin-form-field">
                Gedung
                <select
                  required
                  value={form.gedung_id}
                  onChange={(event) => handleFormBuildingChange(event.target.value)}
                >
                  <option value="">Pilih gedung</option>
                  {gedungs.filter((building) => building.is_active || String(building.id) === form.gedung_id).map((building) => (
                    <option key={building.id} value={building.id}>{building.nama}</option>
                  ))}
                </select>
              </label>

              <div className="admin-room-form-row">
                <label className="admin-form-field">
                  Lantai
                  {!customFloor && formBuildingFloors.length > 0 ? (
                    <select
                      required
                      value={form.lantai}
                      onChange={(event) => {
                        if (event.target.value === '__new__') {
                          const maxFloor = Math.max(...formBuildingFloors.map((item) => Number(item.nomor_lantai)), 0);
                          setCustomFloor(true);
                          setForm({ ...form, lantai: String(maxFloor + 1) });
                        } else {
                          setForm({ ...form, lantai: event.target.value });
                        }
                      }}
                    >
                      {formBuildingFloors.map((floor) => (
                        <option key={floor.nomor_lantai} value={floor.nomor_lantai}>
                          Lantai {floor.nomor_lantai}{floor.nama ? ` (${floor.nama})` : ''}
                        </option>
                      ))}
                      <option value="__new__">+ Lantai baru...</option>
                    </select>
                  ) : (
                    <input
                      required
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      value={form.lantai}
                      onChange={(event) => setForm({ ...form, lantai: event.target.value })}
                      placeholder="Contoh: 1"
                    />
                  )}
                </label>

                <label className="admin-form-field">
                  Kapasitas (orang)
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={form.kapasitas}
                    onChange={(event) => setForm({ ...form, kapasitas: event.target.value })}
                  />
                </label>
              </div>

              <label className="admin-form-field">
                Nomor kamar
                <input
                  required
                  value={form.nomor_kamar}
                  onChange={(event) => setForm({ ...form, nomor_kamar: event.target.value })}
                  placeholder="Contoh: 101 atau RPX-101"
                />
              </label>

              {error && <p className="admin-management-error" role="alert">{error}</p>}
              <div className="admin-management-dialog-actions">
                <button type="button" className="admin-secondary-button" onClick={closeForm}>Batal</button>
                <button type="submit" className="admin-action-button" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan kamar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {floorFormOpen && (
        <div className="admin-management-backdrop">
          <section className="admin-management-dialog admin-room-dialog" role="dialog" aria-modal="true" aria-labelledby="floor-form-title">
            <form onSubmit={submitFloorForm}>
              <div className="admin-management-dialog-heading">
                <div>
                  <h2 id="floor-form-title">Tambah lantai gedung</h2>
                  <p>Tambahkan lantai baru pada gedung sebelum atau saat mengelola kamar.</p>
                </div>
                <button type="button" className="admin-dialog-close" onClick={() => setFloorFormOpen(false)} aria-label="Tutup form">×</button>
              </div>

              <label className="admin-form-field">
                Gedung
                <select
                  required
                  value={floorForm.gedung_id}
                  onChange={(event) => {
                    const nextBuildingId = event.target.value;
                    const existing = floorsByBuilding.get(String(nextBuildingId)) || [];
                    const nextFloor = existing.length
                      ? Math.max(...existing.map((item) => Number(item.nomor_lantai))) + 1
                      : 1;
                    setFloorForm({ ...floorForm, gedung_id: nextBuildingId, nomor_lantai: String(nextFloor) });
                  }}
                >
                  <option value="">Pilih gedung</option>
                  {activeBuildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.nama}</option>
                  ))}
                </select>
              </label>

              <div className="admin-room-form-row">
                <label className="admin-form-field">
                  Nomor lantai
                  <input
                    required
                    type="number"
                    min="0"
                    max="200"
                    step="1"
                    value={floorForm.nomor_lantai}
                    onChange={(event) => setFloorForm({ ...floorForm, nomor_lantai: event.target.value })}
                  />
                </label>
                <label className="admin-form-field">
                  Keterangan lantai (opsional)
                  <input
                    value={floorForm.nama}
                    onChange={(event) => setFloorForm({ ...floorForm, nama: event.target.value })}
                    placeholder="Contoh: Sayap Utara"
                  />
                </label>
              </div>

              {error && <p className="admin-management-error" role="alert">{error}</p>}
              <div className="admin-management-dialog-actions">
                <button type="button" className="admin-secondary-button" onClick={() => setFloorFormOpen(false)}>Batal</button>
                <button type="submit" className="admin-action-button" disabled={floorSaving}>
                  {floorSaving ? 'Menyimpan...' : 'Simpan lantai'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
