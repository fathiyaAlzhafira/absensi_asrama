import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
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
        setError(fasilResult.reason?.message || 'Daftar fasil tidak dapat dimuat.');
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
    if (!editing && geoJsonFeatures.length > 0) {
      setError('Gunakan tombol simpan semua area GeoJSON agar tidak membuat gedung ganda.');
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
      for (const feature of geoJsonFeatures) {
        const name = String(feature.properties?.nama || feature.properties?.name || '').trim();
        const normalizedName = name.toLocaleLowerCase();
        if (!name) {
          failures.push('Ada area tanpa nama; area dilewati.');
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
          <p className="text-body">Atur nama gedung, penanggung jawab, dan batas presensi pada peta.</p>
        </div>
        <button type="button" className="admin-action-button" onClick={() => openForm()}>
          Tambah gedung
        </button>
      </header>

      {notice && <p className="admin-management-notice" role="status">{notice}</p>}
      {error && !formOpen && <p className="admin-management-error" role="alert">{error}</p>}
      {loading ? (
        <Card><p className="text-body">Memuat data gedung...</p></Card>
      ) : error && gedungs.length === 0 ? (
        <Card><p className="text-body">Data gedung gagal dimuat. Periksa koneksi dan sesi login, lalu coba lagi.</p></Card>
      ) : gedungs.length === 0 ? (
        <Card><p className="text-body">Belum ada gedung. Tambahkan gedung untuk mulai mengatur batas presensi.</p></Card>
      ) : (
        <div className="admin-building-grid">
          {gedungs.map((building) => {
            const active = Boolean(building.is_active);
            const roomCount = Number(building.jumlah_kamar ?? building.kamars_count ?? building.kamars?.length ?? 0);
            const floorCount = Number(building.jumlah_lantai ?? building.lantais?.length ?? 0);
            const polygonPoints = building.geofence_geojson?.coordinates?.[0]?.length
              ? Math.max(0, building.geofence_geojson.coordinates[0].length - 1)
              : 0;
            return (
              <Card key={building.id} hoverable={false}>
                <div className="admin-building-card-heading">
                  <div>
                    <h2 className="text-card-title">{building.nama}</h2>
                    <Badge variant={active ? 'success' : 'neutral'} size="sm">
                      {active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <span className="admin-building-room-count">
                    {floorCount} lantai · {roomCount} kamar
                  </span>
                </div>
                <p className="admin-building-description">
                  Penanggung jawab: {building.fasil?.nama || building.user?.nama || building.nama_fasil || 'Belum ditentukan'}
                </p>
                <p className="admin-building-description">
                  {building.geofence_geojson || building.polygon_geojson
                    ? `Batas poligon aktif${polygonPoints ? ` (${polygonPoints} titik koordinat)` : ''}.`
                    : 'Batas presensi belum diatur.'}
                </p>
                {building.keterangan && <p className="admin-building-description">{building.keterangan}</p>}
                <div className="admin-building-actions">
                  <button type="button" className="admin-secondary-button" onClick={() => openForm(building)}>
                    Edit
                  </button>
                  <button type="button" className="admin-secondary-button" onClick={() => toggleBuilding(building)}>
                    {active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  {roomCount === 0 && (
                    <button type="button" className="admin-secondary-button danger" onClick={() => deleteBuilding(building)}>
                      Hapus
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="admin-management-backdrop">
          <section className="admin-management-dialog" role="dialog" aria-modal="true" aria-labelledby="building-form-title">
            <form onSubmit={submitForm}>
              <div className="admin-management-dialog-heading">
                <div>
                  <h2 id="building-form-title">{editing ? 'Edit gedung' : 'Tambah gedung'}</h2>
                  <p>Atur data gedung dan area poligon untuk validasi presensi.</p>
                </div>
                <button type="button" className="admin-dialog-close" onClick={closeForm} aria-label="Tutup form">×</button>
              </div>

              <label className="admin-form-field">
                Nama gedung
                <input
                  required
                  value={form.nama}
                  onChange={(event) => setForm({ ...form, nama: event.target.value })}
                  placeholder="Contoh: Asrama Putra A"
                />
              </label>

              <label className="admin-form-field">
                Fasil penanggung jawab
                <select
                  value={form.id_user}
                  onChange={(event) => setForm({ ...form, id_user: event.target.value })}
                >
                  <option value="">Belum ditentukan</option>
                  {fasilitators.map((fasil) => (
                    <option key={fasil.id} value={fasil.id}>{fasil.nama} {fasil.email ? `(${fasil.email})` : ''}</option>
                  ))}
                </select>
              </label>

              {!editing && (
                <label className="admin-form-field">
                  Jumlah lantai awal
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
              )}

              <label className="admin-form-field">
                Keterangan
                <textarea
                  rows="2"
                  value={form.keterangan}
                  onChange={(event) => setForm({ ...form, keterangan: event.target.value })}
                  placeholder="Keterangan gedung (opsional)"
                />
              </label>

              <fieldset className="admin-polygon-fieldset">
                <legend>Batas area presensi</legend>
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
                {geoJsonFeatures.length > 0 && !editing && (
                  <div className="building-geojson-import">
                    <p className="text-body">
                      {geoJsonFeatures.length} area terdeteksi. Nama area dicocokkan persis dengan gedung yang sudah ada; area tanpa pasangan akan dibuat sebagai gedung baru.
                    </p>
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={importGeoJsonBuildings}
                      disabled={saving}
                    >
                      {saving ? 'Menyimpan area...' : `Simpan semua ${geoJsonFeatures.length} area ke database`}
                    </button>
                    {geoImportResult && <p className="admin-management-notice" role="status">{geoImportResult}</p>}
                  </div>
                )}
              </fieldset>

              {error && <p className="admin-management-error" role="alert">{error}</p>}
              <div className="admin-management-dialog-actions">
                <button type="button" className="admin-secondary-button" onClick={closeForm}>Batal</button>
                <button
                  type="submit"
                  className="admin-action-button"
                  disabled={saving || (!editing && geoJsonFeatures.length > 0)}
                >
                  {saving ? 'Menyimpan...' : 'Simpan gedung'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
