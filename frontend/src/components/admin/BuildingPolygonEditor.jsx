import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CAMPUS_CENTER = [-0.9166, 100.4536];

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
  const drawingRef = useRef(false);
  const draftPointsRef = useRef([]);
  const onChangeRef = useRef(onChange);
  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState([]);
  const [importedFeatures, setImportedFeatures] = useState([]);
  const [importedIndex, setImportedIndex] = useState('');
  const [error, setError] = useState('');

  const geometry = useMemo(() => getGeometry(value), [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined;
    const map = L.map(mapElementRef.current, { scrollWheelZoom: true }).setView(CAMPUS_CENTER, 17);
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
      const features = getPolygonFeatures(parsed);
      if (!features.length) throw new Error('GeoJSON tidak berisi Polygon atau MultiPolygon.');
      setImportedFeatures(features);
      setImportedIndex('0');
      onImportFeatures?.(features);
      onChangeRef.current?.(features[0].geometry);
      onNameSuggestion?.(String(features[0].properties?.nama || features[0].properties?.name || ''));
    } catch (fileError) {
      setError(fileError.message || 'File GeoJSON tidak dapat dibaca.');
    } finally {
      event.target.value = '';
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

  return (
    <div className="building-polygon-editor">
      <div className="building-polygon-controls">
        <button type="button" className="building-map-button" onClick={beginDrawing} disabled={drawing}>
          Gambar batas di peta
        </button>
        {drawing && (
          <>
            <button type="button" className="building-map-button primary" onClick={finishDrawing}>
              Simpan gambar
            </button>
            <button type="button" className="building-map-button" onClick={cancelDrawing}>
              Batal
            </button>
            <span className="building-map-hint">Klik peta untuk menambah titik ({draftPoints.length})</span>
          </>
        )}
        {geometry && !drawing && (
          <button
            type="button"
            className="building-map-button"
            onClick={() => {
              onChangeRef.current?.(null);
              setImportedIndex('');
            }}
          >
            Hapus batas
          </button>
        )}
        <label className="building-map-upload">
          Muat GeoJSON
          <input type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={handleGeoJsonFile} />
        </label>
      </div>
      {importedFeatures.length > 1 && (
        <label className="building-map-feature-select">
          Pilih area dari file
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
      {geometry?.coordinates?.[0]?.length > 3 && (
        <p className="building-map-hint">
          Poligon tersimpan ({geometry.coordinates[0].length - 1} titik) · contoh koordinat:{' '}
          {Number(geometry.coordinates[0][0][1]).toFixed(6)}, {Number(geometry.coordinates[0][0][0]).toFixed(6)}
        </p>
      )}
      <p className="building-map-attribution">Peta dari OpenStreetMap. Titik poligon disimpan pada data gedung.</p>
      {error && <p className="resident-history-error" role="alert">{error}</p>}
    </div>
  );
}
