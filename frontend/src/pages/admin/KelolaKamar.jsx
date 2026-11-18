import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Building2, Edit2, Trash2, Plus } from 'lucide-react';
import { api } from '../../services/api';

const EMPTY_FORM = { gedung_id: '', nomor_kamar: '', lantai: '', kapasitas: '4' };

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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

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
    setError('');
  };

  const handleFormBuildingChange = (nextBuildingId) => {
    const buildingFloors = floorsByBuilding.get(String(nextBuildingId)) || [];
    setForm((current) => ({
      ...current,
      gedung_id: nextBuildingId,
      lantai: String(buildingFloors[0]?.nomor_lantai ?? 1)
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
          <p className="text-body">Pilih gedung untuk menyaring kamar, lalu tambahkan atau perbarui nomor kamar.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => openForm()}>
          Tambah Kamar
        </Button>
      </header>

      {notice && <p className="admin-management-notice" role="status">{notice}</p>}
      {error && !formOpen && <p className="admin-management-error" role="alert">{error}</p>}

      {activeBuildings.length > 0 && (
        <div className="admin-room-summary-section">
          <div className="admin-building-card-heading" style={{ marginBottom: '12px' }}>
            <div>
              <h2 className="text-card-title">Ringkasan Gedung Asrama</h2>
              <p className="text-small">Klik kartu gedung untuk memfilter daftar kamar di bawah.</p>
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

          <div className="admin-room-building-cards">
            {activeBuildings.map((building) => {
              const selected = String(building.id) === String(buildingFilter);
              const floors = floorsByBuilding.get(String(building.id)) || [];
              const roomCount = kamars.filter((r) => String(r.gedung_id) === String(building.id)).length;
              return (
                <button
                  key={building.id}
                  type="button"
                  className={`admin-room-building-card ${selected ? 'selected' : ''}`}
                  onClick={() => {
                    setBuildingFilter(selected ? '' : String(building.id));
                    setFloorFilter('');
                  }}
                >
                  <div className="admin-room-building-card-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="admin-room-building-card-body">
                    <strong>{building.nama}</strong>
                    <span>{floors.length} Lantai · {roomCount} Kamar</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Card hoverable={false}>
        <div className="admin-room-filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label className="admin-form-field">
            Cari kamar
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nomor kamar atau nama gedung..." />
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
                  Lantai {floor.nomor_lantai}
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
            {kamars.length ? 'Tidak ada kamar yang sesuai dengan filter.' : 'Belum ada data kamar. Pilih gedung lalu klik Tambah Kamar.'}
          </p>
        </Card>
      ) : (
        <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-room-table-wrap">
            <table className="admin-room-table">
              <thead>
                <tr>
                  <th>Nomor Kamar</th>
                  <th>Gedung</th>
                  <th>Lantai</th>
                  <th>Kapasitas</th>
                  <th>Penghuni</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleRooms.map((room) => {
                  const occupants = Number(room.jumlah_penghuni ?? room.terisi ?? room.users_count ?? 0);
                  const capacity = Number(room.kapasitas || 0);
                  const buildingName = room.gedung?.nama || room.nama_gedung || room.gedung_nama || '-';
                  return (
                    <tr key={room.id}>
                      <td data-label="Nomor Kamar"><strong>{room.nomor_kamar || room.no_kamar}</strong></td>
                      <td data-label="Gedung">{buildingName}</td>
                      <td data-label="Lantai" style={{ color: 'var(--color-neutral)' }}>Lantai {room.lantai}</td>
                      <td data-label="Kapasitas" style={{ color: 'var(--color-neutral)' }}>{capacity} orang</td>
                      <td data-label="Penghuni">
                        <Badge variant={occupants >= capacity ? 'error' : 'success'} size="sm">
                          {occupants} / {capacity}
                        </Badge>
                      </td>
                      <td data-label="Aksi" style={{ textAlign: 'center' }}>
                        <div className="admin-inline-actions">
                          <Button size="sm" variant="ghost" icon={Edit2} onClick={() => openForm(room)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Trash2}
                            style={{ color: 'var(--color-error)' }}
                            onClick={() => deleteRoom(room)}
                          >
                            Hapus
                          </Button>
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
                  <h2 id="room-form-title">{editing ? 'Edit Kamar' : 'Tambah Kamar Baru'}</h2>
                  <p>Pilih gedung dan lantai, lalu masukkan nomor kamar serta kapasitas penghuninya.</p>
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
                  {formBuildingFloors.length > 0 ? (
                    <select
                      required
                      value={form.lantai}
                      onChange={(event) => setForm({ ...form, lantai: event.target.value })}
                    >
                      {formBuildingFloors.map((floor) => (
                        <option key={floor.nomor_lantai} value={floor.nomor_lantai}>
                          Lantai {floor.nomor_lantai}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="number"
                      min="1"
                      max="50"
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
                Nomor Kamar
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
                  {saving ? 'Menyimpan...' : 'Simpan Kamar'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
