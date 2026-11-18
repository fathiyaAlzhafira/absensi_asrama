import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pencil, Upload, ClipboardPaste, ExternalLink, RotateCcw, Search, Trash2, MapPin, LocateFixed } from 'lucide-react';

const CAMPUS_CENTER = [-0.9169, 100.4538];

const CAMPUS_PRESETS = [
  { label: 'Kawasan Asrama Unand (Pusat Semua Gedung)', category: 'Asrama Unand', keywords: 'asrama unand limau manis pusat semua gedung', lat: -0.9169, lng: 100.4538, zoom: 18 },
  { label: 'Gedung RPX Asrama Unand', category: 'Gedung Asrama', keywords: 'rpx asrama putra putri gedung rpx', lat: -0.916515, lng: 100.454460, zoom: 19 },
  { label: 'Gedung Rusunawa Asrama Unand', category: 'Gedung Asrama', keywords: 'rusunawa asrama unand gedung rusunawa', lat: -0.916415, lng: 100.454180, zoom: 19 },
  { label: 'Gedung Pupera Asrama Unand', category: 'Gedung Asrama', keywords: 'pupera asrama unand gedung pupera', lat: -0.916305, lng: 100.453802, zoom: 19 },
  { label: 'Gedung Menpera Asrama Unand', category: 'Gedung Asrama', keywords: 'menpera asrama unand gedung menpera', lat: -0.916488, lng: 100.453448, zoom: 19 },
  { label: 'Gedung RMS Asrama Unand', category: 'Gedung Asrama', keywords: 'rms asrama unand gedung rms', lat: -0.916470, lng: 100.453106, zoom: 19 },
  { label: 'Gedung Hijau Asrama Unand', category: 'Gedung Asrama', keywords: 'hijau asrama unand gedung hijau', lat: -0.917768, lng: 100.453646, zoom: 19 },
  { label: 'Gedung Oren Asrama Unand', category: 'Gedung Asrama', keywords: 'oren orange asrama unand gedung oren', lat: -0.917725, lng: 100.453180, zoom: 19 },
  { label: 'Gedung Inter (Internasional) Asrama Unand', category: 'Gedung Asrama', keywords: 'inter internasional asrama unand gedung inter', lat: -0.917734, lng: 100.454000, zoom: 19 },
  { label: 'Fakultas Farmasi & FTI Unand', category: 'Kampus Unand', keywords: 'fti farmasi teknologi informasi fakultas', lat: -0.9159, lng: 100.4545, zoom: 18 },
  { label: 'Auditorium Universitas Andalas', category: 'Kampus Unand', keywords: 'auditorium unand gedung auditorium', lat: -0.9152, lng: 100.4512, zoom: 18 },
  { label: 'Pusat Kegiatan Mahasiswa (PKM) Unand', category: 'Kampus Unand', keywords: 'pkm pusat kegiatan mahasiswa lapangan', lat: -0.9163, lng: 100.4552, zoom: 18 },
  { label: 'Masjid Nurul Ilmi Unand', category: 'Kampus Unand', keywords: 'masjid nurul ilmi mushalla kampus', lat: -0.9158, lng: 100.4578, zoom: 18 },
  { label: 'Rektorat Universitas Andalas', category: 'Kampus Unand', keywords: 'rektorat unand universitas andalas', lat: -0.9145, lng: 100.4582, zoom: 17 },
  { label: 'Rumah Sakit Unand (RS Unand)', category: 'Kampus Unand', keywords: 'rs rumah sakit unand klinik', lat: -0.9205, lng: 100.4565, zoom: 17 },
  { label: 'Limau Manis, Kec. Pauh, Kota Padang', category: 'Area Sekitar', keywords: 'limau manis pauh padang pasar baru', lat: -0.9185, lng: 100.4605, zoom: 16 }
];

function validPosition(position) {
  return Array.isArray(position) && position.length >= 2 &&
    Number.isFinite(position[0]) && Number.isFinite(position[1]) &&
    position[0] >= -180 && position[0] <= 180 &&
    position[1] >= -90 && position[1] <= 90;
}

function validPolygonCoordinates(type, coordinates) {
  const validRing = (ring) => Array.isArray(ring) && ring.length >= 4 &&
    ring.every(validPosition) &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1];
  if (type === 'Polygon') {
    return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(validRing);
  }
  return Array.isArray(coordinates) && coordinates.length > 0 &&
    coordinates.every((polygon) => Array.isArray(polygon) && polygon.length > 0 && polygon.every(validRing));
}

function getGeometry(value) {
  if (!value) return null;
  if (typeof value !== 'string') return value.type === 'Feature' ? value.geometry : value;
  try {
    const parsed = JSON.parse(value);
    return parsed.type === 'Feature' ? parsed.geometry : parsed;
  } catch {
    return null;
  }
}

function getPolygonFeatures(data) {
  const features = data?.type === 'FeatureCollection'
    ? data.features
    : data?.type === 'Feature'
      ? [data]
      : [{ type: 'Feature', properties: {}, geometry: data }];
  if (!Array.isArray(features)) return [];
  return features.filter((feature) =>
    ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type) &&
    validPolygonCoordinates(feature.geometry.type, feature.geometry.coordinates)
  );
}

export default function BuildingPolygonEditor({ value, onChange, onNameSuggestion, onImportFeatures }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const savedLayerRef = useRef(null);
  const draftLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const searchBoxRef = useRef(null);
  const drawingRef = useRef(false);
  const draftPointsRef = useRef([]);
  const onChangeRef = useRef(onChange);
  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [importedFeatures, setImportedFeatures] = useState([]);
  const [importedIndex, setImportedIndex] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState('');

  const geometry = useMemo(() => getGeometry(value), [value]);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CAMPUS_PRESETS.slice(0, 9);
    return CAMPUS_PRESETS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.includes(q)
    );
  }, [searchQuery]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined;
    const map = L.map(mapElementRef.current, { scrollWheelZoom: true }).setView(CAMPUS_CENTER, 18);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', (event) => {
      if (!drawingRef.current) return;
      const current = [...draftPointsRef.current, [event.latlng.lat, event.latlng.lng]];
      draftPointsRef.current = current;
      setDraftPoints(current);
    });

    mapRef.current = map;
    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (savedLayerRef.current) map.removeLayer(savedLayerRef.current);
    savedLayerRef.current = null;
    if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) return;

    savedLayerRef.current = L.geoJSON(geometry, {
      style: { color: '#13854a', weight: 3, fillColor: '#1DB954', fillOpacity: 0.18 }
    }).addTo(map);
    const bounds = savedLayerRef.current.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.35), { maxZoom: 19 });
  }, [geometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (draftLayerRef.current) map.removeLayer(draftLayerRef.current);
    draftLayerRef.current = null;
    if (draftPoints.length > 0) {
      draftLayerRef.current = L.polyline(draftPoints, {
        color: '#d97706',
        weight: 3,
        dashArray: '6 6'
      }).addTo(map);
    }
  }, [draftPoints]);

  const focusLocation = (lat = CAMPUS_CENTER[0], lng = CAMPUS_CENTER[1], zoom = 18, label = '') => {
    const map = mapRef.current;
    if (!map) return;
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }
    map.setView([lat, lng], zoom, { animate: true });
    if (label) {
      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#13854a',
        weight: 3,
        fillColor: '#1DB954',
        fillOpacity: 0.9
      }).addTo(map);
      marker.bindPopup(`<strong>${label}</strong>`).openPopup();
      searchMarkerRef.current = marker;
    }
  };

  const handleLocateMe = () => {
    setError('');
    setDropdownOpen(false);
    if (!navigator.geolocation) {
      setError('Browser ini tidak mendukung akses lokasi.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        focusLocation(
          coords.latitude,
          coords.longitude,
          19,
          `Lokasi Anda (${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)})`
        );
      },
      () => {
        setError('Gagal mengambil lokasi GPS perangkat. Pastikan izin lokasi browser aktif.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  };

  const handleSelectSuggestion = (item) => {
    setError('');
    setSearchQuery(item.label);
    setDropdownOpen(false);
    focusLocation(item.lat, item.lng, item.zoom || 18, item.label);
  };

  const handleSearchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setDropdownOpen(true);
      return;
    }
    setError('');

    const coordMatch = query.match(/^\s*(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      const lat = Number(coordMatch[1]);
      const lng = Number(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setDropdownOpen(false);
        focusLocation(lat, lng, 19, `Koordinat ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        return;
      }
    }

    if (filteredPresets.length > 0) {
      const best = filteredPresets[0];
      focusLocation(best.lat, best.lng, best.zoom || 19, best.label);
      setDropdownOpen(false);
      return;
    }

    setSearching(true);
    try {
      // Prioritaskan pencarian di area Padang / Sumatera Barat terlebih dahulu
      const padangQuery = query.toLowerCase().includes('padang') || query.toLowerCase().includes('unand')
        ? query
        : `${query} Padang`;
      const viewboxUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=id&viewbox=100.30,-0.80,100.58,-1.05&q=${encodeURIComponent(padangQuery)}`;
      let res = await fetch(viewboxUrl, { headers: { Accept: 'application/json' } });
      let results = await res.json();

      if (!Array.isArray(results) || results.length === 0) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=id&q=${encodeURIComponent(query)}`;
        res = await fetch(fallbackUrl, { headers: { Accept: 'application/json' } });
        results = await res.json();
      }

      if (Array.isArray(results) && results.length > 0) {
        const mapped = results.map((r) => ({
          label: r.display_name.split(',').slice(0, 3).join(','),
          category: 'OpenStreetMap',
          lat: Number(r.lat),
          lng: Number(r.lon),
          zoom: 18
        }));
        setRemoteResults(mapped);
        focusLocation(mapped[0].lat, mapped[0].lng, 18, mapped[0].label);
        setDropdownOpen(mapped.length > 1);
      } else {
        setRemoteResults([]);
        setError('Lokasi tidak ditemukan. Pilih gedung dari daftar saran atau klik "Ke Posisi Asrama".');
      }
    } catch {
      setError('Pencarian lokasi gagal. Pilih gedung dari daftar saran atau klik "Ke Posisi Asrama".');
    } finally {
      setSearching(false);
    }
  };

  const beginDrawing = () => {
    setError('');
    draftPointsRef.current = [];
    setDraftPoints([]);
    drawingRef.current = true;
    setDrawing(true);
  };

  const cancelDrawing = () => {
    drawingRef.current = false;
    setDrawing(false);
    draftPointsRef.current = [];
    setDraftPoints([]);
  };

  const finishDrawing = () => {
    if (draftPointsRef.current.length < 3) {
      setError('Batas gedung perlu minimal tiga titik.');
      return;
    }
    const ring = [...draftPointsRef.current, draftPointsRef.current[0]]
      .map(([latitude, longitude]) => [longitude, latitude]);
    onChangeRef.current?.({ type: 'Polygon', coordinates: [ring] });
    setImportedIndex('');
    cancelDrawing();
  };

  const applyGeoJsonObject = (parsed) => {
    const features = getPolygonFeatures(parsed);
    if (!features.length) throw new Error('GeoJSON tidak berisi Polygon atau MultiPolygon yang valid.');
    setImportedFeatures(features);
    setImportedIndex('0');
    // Hanya aktifkan mode impor massal jika ada lebih dari 1 poligon
    onImportFeatures?.(features.length > 1 ? features : []);
    onChangeRef.current?.(features[0].geometry);
    onNameSuggestion?.(String(features[0].properties?.nama || features[0].properties?.name || ''));
  };

  const handleGeoJsonFile = async (event) => {
    setError('');
    setImportedFeatures([]);
    setImportedIndex('');
    onImportFeatures?.([]);
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran file GeoJSON maksimal 10 MB.');
      const parsed = JSON.parse(await file.text());
      applyGeoJsonObject(parsed);
    } catch (fileError) {
      setError(fileError.message || 'File GeoJSON tidak dapat dibaca.');
    } finally {
      event.target.value = '';
    }
  };

  const handleApplyPastedGeoJson = () => {
    setError('');
    try {
      const parsed = JSON.parse(pasteText.trim());
      applyGeoJsonObject(parsed);
      setPasteOpen(false);
      setPasteText('');
    } catch (pasteErr) {
      setError(pasteErr.message || 'Teks JSON tidak valid. Salin JSON dari geojson.io lalu tempelkan di sini.');
    }
  };

  const selectImportedFeature = (event) => {
    const index = Number(event.target.value);
    const feature = importedFeatures[index];
    setImportedIndex(event.target.value);
    if (!feature) return;
    onChangeRef.current?.(feature.geometry);
    onNameSuggestion?.(String(feature.properties?.nama || feature.properties?.name || ''));
  };

  const combinedSuggestions = [...filteredPresets, ...remoteResults];

  return (
    <div className="building-polygon-editor">
      {/* Bar 1: Pencarian Daerah Cepat & Tombol Kembali ke Posisi Asrama */}
      <div className="building-map-search-row" ref={searchBoxRef}>
        <div className="building-map-search-input-wrap">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setRemoteResults([]);
              setDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchLocation();
              } else if (e.key === 'Escape') {
                setDropdownOpen(false);
              }
            }}
            placeholder="Ketik nama gedung (mis. RPX, Hijau, PKM) atau koordinat..."
          />
          {dropdownOpen && combinedSuggestions.length > 0 && (
            <div className="building-map-search-dropdown" role="listbox">
              {combinedSuggestions.map((item, idx) => (
                <button
                  type="button"
                  key={`${item.label}-${idx}`}
                  className="building-map-search-option"
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <MapPin size={14} className="building-map-search-option-icon" />
                  <span className="building-map-search-option-text">
                    <strong>{item.label}</strong>
                    <small>{item.category}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="building-map-button" onClick={handleSearchLocation} disabled={searching}>
          <Search size={14} style={{ marginRight: '5px' }} />
          {searching ? 'Mencari...' : 'Cari'}
        </button>
        <button
          type="button"
          className="building-map-button"
          onClick={handleLocateMe}
          title="Lihat titik koordinat GPS perangkat Anda saat ini"
        >
          <LocateFixed size={14} style={{ marginRight: '5px' }} />
          Lokasi Saya
        </button>
        <button
          type="button"
          className="building-map-button"
          onClick={() => {
            setError('');
            setDropdownOpen(false);
            focusLocation(CAMPUS_CENTER[0], CAMPUS_CENTER[1], 18, 'Kawasan Asrama Unand');
          }}
          title="Kembali ke titik tengah Asrama Unand"
        >
          <RotateCcw size={14} style={{ marginRight: '5px' }} />
          Ke Posisi Asrama
        </button>
      </div>

      {/* Bar 2: Alat Gambar & Integrasi geojson.io yang Rapi */}
      <div className="building-polygon-controls">
        <button type="button" className="building-map-button" onClick={beginDrawing} disabled={drawing}>
          <Pencil size={14} style={{ marginRight: '5px' }} />
          Gambar di Peta
        </button>
        {drawing && (
          <>
            <button type="button" className="building-map-button primary" onClick={finishDrawing}>
              Selesai Gambar ({draftPoints.length} titik)
            </button>
            <button type="button" className="building-map-button" onClick={cancelDrawing}>
              Batal
            </button>
          </>
        )}
        <label className="building-map-upload">
          <Upload size={14} style={{ marginRight: '5px' }} />
          Unggah GeoJSON
          <input type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={handleGeoJsonFile} />
        </label>
        <button
          type="button"
          className={`building-map-button ${pasteOpen ? 'primary' : ''}`}
          onClick={() => setPasteOpen((open) => !open)}
        >
          <ClipboardPaste size={14} style={{ marginRight: '5px' }} />
          Tempel dari geojson.io
        </button>
        <a
          href="https://geojson.io/#map=18/-0.9169/100.4538"
          target="_blank"
          rel="noopener noreferrer"
          className="building-map-button"
        >
          <ExternalLink size={14} style={{ marginRight: '5px' }} />
          Buka geojson.io
        </a>
        {geometry && !drawing && (
          <button
            type="button"
            className="building-map-button"
            style={{ color: 'var(--color-error)' }}
            onClick={() => {
              onChangeRef.current?.(null);
              setImportedFeatures([]);
              setImportedIndex('');
              onImportFeatures?.([]);
            }}
          >
            <Trash2 size={14} style={{ marginRight: '5px' }} />
            Hapus Poligon
          </button>
        )}
      </div>

      {pasteOpen && (
        <div className="building-geojson-import">
          <p className="text-small">
            Salin kode JSON dari panel kanan <strong>geojson.io</strong>, tempelkan di bawah ini, lalu klik <strong>Gunakan Poligon Ini</strong>:
          </p>
          <textarea
            rows="4"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='{"type": "FeatureCollection", "features": [...]}'
            style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-code)' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="building-map-button primary" onClick={handleApplyPastedGeoJson}>
              Gunakan Poligon Ini
            </button>
            <button type="button" className="building-map-button" onClick={() => setPasteOpen(false)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {importedFeatures.length > 1 && (
        <label className="building-map-feature-select">
          Pilih area dari file ({importedFeatures.length} area)
          <select value={importedIndex} onChange={selectImportedFeature}>
            {importedFeatures.map((feature, index) => (
              <option value={index} key={`${index}-${feature.properties?.nama || feature.properties?.name || 'polygon'}`}>
                {feature.properties?.nama || feature.properties?.name || `Area ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="building-map-canvas" ref={mapElementRef} aria-label="Peta untuk mengatur batas poligon gedung" />

      {geometry?.coordinates?.[0]?.length > 3 ? (
        <p className="building-map-hint" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          ✓ Poligon gedung siap disimpan ({geometry.coordinates[0].length - 1} titik sudut). Klik tombol &ldquo;Simpan gedung&rdquo; di kanan bawah.
        </p>
      ) : (
        <p className="building-map-attribution">
          Belum ada poligon. Klik &ldquo;Gambar di Peta&rdquo; atau tempel JSON dari geojson.io.
        </p>
      )}
      {error && <p className="resident-history-error" role="alert">{error}</p>}
    </div>
  );
}
