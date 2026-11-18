import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { Edit2, Trash2, Power, Plus } from 'lucide-react';
import { api } from '../../services/api';

const BuildingPolygonEditor = lazy(() => import('../../components/admin/BuildingPolygonEditor'));

const EMPTY_FORM = {
  nama: '',
  id_user: '',
  jumlah_lantai: '1',
  keterangan: '',
  geofence_geojson: null,
  is_active: true
};

function getData(response, label) {
  if (!Array.isArray(response?.data)) {
    throw new Error(`Data ${label} dari server tidak sesuai format.`);
  }
  return response.data;
}

export default function KelolaGedung() {
  const [gedungs, setGedungs] = useState([]);
  const [fasilitators, setFasilitators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [geoJsonFeatures, setGeoJsonFeatures] = useState([]);
  const [geoImportResult, setGeoImportResult] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [buildingResult, fasilResult] = await Promise.allSettled([
        api.getGedungs(),
        api.getUsers('fasil')
      ]);
      if (buildingResult.status === 'rejected') throw buildingResult.reason;
      setGedungs(getData(buildingResult.value, 'gedung'));
      if (fasilResult.status === 'fulfilled') {
        setFasilitators(getData(fasilResult.value, 'fasil'));
      } else {
        setFasilitators([]);
      }
    } catch (loadError) {
      setError(loadError.message || 'Data gedung gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleBuildings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gedungs.filter((building) => {
      const active = Boolean(building.is_active);
      if (statusFilter === 'active' && !active) return false;
      if (statusFilter === 'inactive' && active) return false;
      if (!query) return true;
      const supervisor = building.fasil?.nama || building.user?.nama || building.nama_fasil || '';
      return `${building.nama || ''} ${supervisor} ${building.keterangan || ''}`
        .toLowerCase()
        .includes(query);
    });
  }, [gedungs, search, statusFilter]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setGeoJsonFeatures([]);
    setGeoImportResult('');
    setError('');
  };

  const openForm = (building = null) => {
    setFormOpen(true);
    setEditing(building);
    setForm(building ? {
      nama: building.nama || '',
      id_user: building.id_user ? String(building.id_user) : '',
      jumlah_lantai: String(building.jumlah_lantai || building.lantais?.length || 1),
      keterangan: building.keterangan || '',
      geofence_geojson: building.geofence_geojson || building.polygon_geojson || null,
      is_active: Boolean(building.is_active)
    } : EMPTY_FORM);
    setGeoJsonFeatures([]);
    setGeoImportResult('');
    setError('');
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.nama.trim()) {
      setError('Nama gedung wajib diisi.');
      return;
    }
    if (!form.geofence_geojson) {
      setError('Silakan gambar poligon di peta atau tempel JSON dari geojson.io terlebih dahulu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        nama: form.nama.trim(),
        id_user: form.id_user || null,
        jumlah_lantai: Number(form.jumlah_lantai || 1)
      };
      if (editing) await api.updateGedung(editing.id, payload);
      else await api.createGedung(payload);
      setNotice(editing ? 'Data gedung berhasil diperbarui.' : 'Gedung berhasil ditambahkan.');
      closeForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Data gedung gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const importGeoJsonBuildings = async () => {
    setSaving(true);
    setError('');
    setGeoImportResult('');
    const knownBuildings = new Map(
      gedungs.map((building) => [String(building.nama || '').trim().toLocaleLowerCase(), building])
    );
    const processed = new Set();
    const failures = [];
    let updated = 0;
    let created = 0;

    try {
      for (let idx = 0; idx < geoJsonFeatures.length; idx += 1) {
        const feature = geoJsonFeatures[idx];
        const fallbackName = geoJsonFeatures.length === 1
          ? form.nama.trim()
          : (form.nama.trim() ? `${form.nama.trim()} ${idx + 1}` : `Gedung Baru ${idx + 1}`);
        const name = String(feature.properties?.nama || feature.properties?.name || fallbackName).trim();
        const normalizedName = name.toLocaleLowerCase();
        if (!name) {
          failures.push('Ada area tanpa nama; isi Nama Gedung terlebih dahulu.');
          continue;
        }
        if (processed.has(normalizedName)) continue;
        processed.add(normalizedName);

        try {
          const existing = knownBuildings.get(normalizedName);
          if (existing) {
            await api.updateGedung(existing.id, { geofence_geojson: feature.geometry });
            updated += 1;
          } else {
            const response = await api.createGedung({
              nama: name,
              geofence_geojson: feature.geometry,
              jumlah_lantai: Number(form.jumlah_lantai || 1),
              is_active: true
            });
            created += 1;
            if (response?.data?.id) knownBuildings.set(normalizedName, response.data);
          }
        } catch (importError) {
          failures.push(`${name}: ${importError.message || 'gagal disimpan'}`);
        }
      }

      const summary = `${updated} gedung diperbarui, ${created} gedung baru ditambahkan.`;
      setGeoImportResult(failures.length
        ? `${summary} Gagal: ${failures.slice(0, 4).join(' ')}`
        : `${summary} Semua poligon berhasil disimpan.`);
      if (!failures.length) {
        setNotice('Data gedung dari GeoJSON berhasil disimpan.');
      }
      await loadData();
      if (!failures.length) closeForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleBuilding = async (building) => {
    const nextActive = !Boolean(building.is_active);
    setError('');
    setNotice('');
    try {
      await api.updateGedungStatus(building.id, nextActive);
      setNotice(nextActive ? 'Gedung berhasil diaktifkan.' : 'Gedung dinonaktifkan.');
      await loadData();
    } catch (updateError) {
      setError(updateError.message || 'Status gedung gagal diperbarui.');
    }
  };

  const deleteBuilding = async (building) => {
    if (!window.confirm(`Hapus gedung "${building.nama}"? Penghapusan hanya diizinkan jika gedung belum memiliki kamar.`)) return;
    setError('');
    setNotice('');
    try {
      await api.deleteGedung(building.id);
      setNotice('Gedung berhasil dihapus.');
      await loadData();
    } catch (deleteError) {
      setError(deleteError.message || 'Gedung gagal dihapus.');
    }
  };

  return (
    <div className="admin-management-page">
      <header className="admin-management-header">
        <div>
          <h1 className="text-page-title">Kelola Gedung Asrama</h1>
          <p className="text-body">Kelola gedung asrama, jumlah lantai, fasilitator penanggung jawab, dan area presensi.</p>
        </div>
        <Button variant="primary" size="md" icon={Plus} onClick={() => openForm()}>
          Tambah Gedung
        </Button>
      </header>

      {notice && <p className="admin-management-notice" role="status">{notice}</p>}
      {error && !formOpen && <p className="admin-management-error" role="alert">{error}</p>}

      <Card hoverable={false}>
        <div className="admin-room-filters">
          <label className="admin-form-field">
            Cari gedung
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama gedung atau nama fasilitator..."
            />
          </label>
          <label className="admin-form-field">
            Filter status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Semua status ({gedungs.length})</option>
              <option value="active">Aktif ({gedungs.filter((b) => b.is_active).length})</option>
              <option value="inactive">Nonaktif ({gedungs.filter((b) => !b.is_active).length})</option>
            </select>
          </label>
        </div>
      </Card>

      {loading ? (
        <Card><p className="text-body">Memuat data gedung...</p></Card>
      ) : error && gedungs.length === 0 ? (
        <Card><p className="text-body">Data gedung gagal dimuat. Periksa koneksi dan sesi login, lalu coba lagi.</p></Card>
      ) : visibleBuildings.length === 0 ? (
        <Card>
          <p className="text-body">
            {gedungs.length ? 'Tidak ada gedung yang sesuai dengan pencarian.' : 'Belum ada gedung. Tambahkan gedung untuk mulai mengatur batas presensi.'}
          </p>
        </Card>
      ) : (
        <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
          <div className="admin-room-table-wrap">
            <table className="admin-room-table">
              <thead>
                <tr>
                  <th>Nama Gedung</th>
                  <th>Status</th>
                  <th>Lantai &amp; Kamar</th>
                  <th>Penanggung Jawab</th>
                  <th>Jumlah Penghuni</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleBuildings.map((building) => {
                  const active = Boolean(building.is_active);
                  const roomCount = Number(building.jumlah_kamar ?? building.kamars_count ?? building.kamars?.length ?? 0);
                  const floorCount = Number(building.jumlah_lantai ?? building.lantais?.length ?? 0);
                  const residentCount = Number(building.jumlah_penghuni ?? 0);

                  return (
                    <tr key={building.id}>
                      <td data-label="Nama Gedung">
                        <strong style={{ fontSize: '14px' }}>{building.nama}</strong>
                      </td>
                      <td data-label="Status">
                        <Badge variant={active ? 'success' : 'neutral'} size="sm">
                          {active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td data-label="Lantai & Kamar" style={{ color: 'var(--color-neutral)' }}>
                        {floorCount} lantai · {roomCount} kamar
                      </td>
                      <td data-label="Penanggung Jawab" style={{ color: 'var(--color-neutral)' }}>
                        {building.fasil?.nama || building.user?.nama || building.nama_fasil || 'Belum ditentukan'}
                      </td>
                      <td data-label="Jumlah Penghuni">
                        <Badge variant={residentCount > 0 ? 'success' : 'neutral'} size="sm">
                          {residentCount} mahasiswa
                        </Badge>
                      </td>
                      <td data-label="Aksi" style={{ textAlign: 'center' }}>
                        <div className="admin-inline-actions">
                          <Button size="sm" variant="ghost" icon={Edit2} onClick={() => openForm(building)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Power}
                            style={{ color: active ? 'var(--color-warning)' : 'var(--color-primary)' }}
                            onClick={() => toggleBuilding(building)}
                          >
                            {active ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          {roomCount === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Trash2}
                              style={{ color: 'var(--color-error)' }}
                              onClick={() => deleteBuilding(building)}
                            >
                              Hapus
                            </Button>
                          )}
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
          <section className="admin-management-dialog" role="dialog" aria-modal="true" aria-labelledby="building-form-title">
            <form onSubmit={submitForm}>
              <div className="admin-management-dialog-heading">
                <div>
                  <h2 id="building-form-title">{editing ? 'Edit Gedung Asrama' : 'Tambah Gedung Baru'}</h2>
                  <p>Isi identitas gedung di bawah ini, lalu tentukan batas poligon gedung pada peta.</p>
                </div>
                <button type="button" className="admin-dialog-close" onClick={closeForm} aria-label="Tutup form">×</button>
              </div>

              <div className="admin-form-grid-3">
                <label className="admin-form-field">
                  <span>Nama Gedung <em style={{ color: 'var(--color-primary)', fontStyle: 'normal' }}>*</em></span>
                  <input
                    required
                    value={form.nama}
                    onChange={(event) => setForm({ ...form, nama: event.target.value })}
                    placeholder="Contoh: RPX atau Rusunawa"
                  />
                </label>

                <label className="admin-form-field">
                  <span>Jumlah Lantai <em style={{ color: 'var(--color-primary)', fontStyle: 'normal' }}>*</em></span>
                  <input
                    required
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={form.jumlah_lantai}
                    onChange={(event) => setForm({ ...form, jumlah_lantai: event.target.value })}
                  />
                </label>

                <label className="admin-form-field">
                  <span>Fasil Penanggung Jawab</span>
                  <select
                    value={form.id_user}
                    onChange={(event) => setForm({ ...form, id_user: event.target.value })}
                  >
                    <option value="">Belum ditentukan</option>
                    {fasilitators.map((fasil) => (
                      <option key={fasil.id} value={fasil.id}>{fasil.nama}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="admin-form-field">
                Keterangan Gedung (Opsional)
                <input
                  value={form.keterangan}
                  onChange={(event) => setForm({ ...form, keterangan: event.target.value })}
                  placeholder="Contoh: Gedung asrama mahasiswa putra"
                />
              </label>

              <fieldset className="admin-polygon-fieldset">
                <legend>Area Poligon Presensi Gedung</legend>
                <Suspense fallback={<p className="text-body">Memuat editor peta...</p>}>
                  <BuildingPolygonEditor
                    value={form.geofence_geojson}
                    onChange={(geometry) => setForm((current) => ({ ...current, geofence_geojson: geometry }))}
                    onImportFeatures={setGeoJsonFeatures}
                    onNameSuggestion={(name) => {
                      if (name && !form.nama.trim()) setForm((current) => ({ ...current, nama: name }));
                    }}
                  />
                </Suspense>
                {geoJsonFeatures.length > 1 && !editing && (
                  <div className="building-geojson-import">
                    <p className="text-body">
                      File berisi {geoJsonFeatures.length} area poligon sekaligus. Anda dapat menyimpan area yang sedang dipilih dengan tombol <strong>Simpan Gedung</strong>, atau mengimpor semuanya sekaligus:
                    </p>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={importGeoJsonBuildings}
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan area...' : `Impor sekaligus ${geoJsonFeatures.length} gedung`}
                    </button>
                    {geoImportResult && <p className="admin-management-notice" role="status">{geoImportResult}</p>}
                  </div>
                )}
              </fieldset>

              {error && <p className="admin-management-error" role="alert">{error}</p>}
              <div className="admin-management-dialog-actions">
                <button type="button" className="admin-secondary-button" onClick={closeForm}>Batal</button>
                <button type="submit" className="admin-action-button" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Gedung'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
