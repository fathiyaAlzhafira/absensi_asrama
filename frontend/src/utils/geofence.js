function isPointOnSegment(point, start, end) {
  const [longitude, latitude] = point;
  const [startLongitude, startLatitude] = start;
  const [endLongitude, endLatitude] = end;
  const cross = (longitude - startLongitude) * (endLatitude - startLatitude) -
    (latitude - startLatitude) * (endLongitude - startLongitude);

  if (Math.abs(cross) > 1e-10) return false;

  return longitude >= Math.min(startLongitude, endLongitude) - 1e-10 &&
    longitude <= Math.max(startLongitude, endLongitude) + 1e-10 &&
    latitude >= Math.min(startLatitude, endLatitude) - 1e-10 &&
    latitude <= Math.max(startLatitude, endLatitude) + 1e-10;
}

function isPointInRing(point, ring) {
  let inside = false;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];

    if (!Array.isArray(currentPoint) || !Array.isArray(previousPoint)) return false;
    if (isPointOnSegment(point, previousPoint, currentPoint)) return true;

    const [longitude, latitude] = point;
    const [currentLongitude, currentLatitude] = currentPoint;
    const [previousLongitude, previousLatitude] = previousPoint;
    const crossesLatitude = (currentLatitude > latitude) !== (previousLatitude > latitude);
    const longitudeAtLatitude = ((previousLongitude - currentLongitude) *
      (latitude - currentLatitude)) / (previousLatitude - currentLatitude) + currentLongitude;

    if (crossesLatitude && longitude < longitudeAtLatitude) inside = !inside;
  }

  return inside;
}

function distanceToRingMeters(point, ring) {
  if (!Array.isArray(ring) || ring.length < 2) return Infinity;
  const [lng, lat] = point;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const metersPerDegLng = 111320 * cosLat;
  const metersPerDegLat = 110540;

  let minDistance = Infinity;
  for (let i = 0, prev = ring.length - 1; i < ring.length; prev = i, i += 1) {
    const p1 = ring[prev];
    const p2 = ring[i];
    if (!Array.isArray(p1) || !Array.isArray(p2)) continue;

    const x1 = (p1[0] - lng) * metersPerDegLng;
    const y1 = (p1[1] - lat) * metersPerDegLat;
    const x2 = (p2[0] - lng) * metersPerDegLng;
    const y2 = (p2[1] - lat) * metersPerDegLat;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / lenSq));
    }
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    const dist = Math.hypot(cx, cy);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
}

function isPointInPolygonCoordinates(point, rings, toleranceMeters = 0) {
  if (!Array.isArray(rings) || !rings.length) return false;
  const inHole = rings.slice(1).some((hole) => isPointInRing(point, hole));
  if (inHole) return false;
  if (isPointInRing(point, rings[0])) return true;
  if (toleranceMeters > 0 && distanceToRingMeters(point, rings[0]) <= toleranceMeters) {
    return true;
  }
  return false;
}

export function isPointInGeoJsonPolygon(latitude, longitude, geoJson, toleranceMeters = 35) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !geoJson) return false;
  let parsed = geoJson;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return false;
    }
  }
  const geometry = parsed.type === 'Feature' ? parsed.geometry : parsed;
  const point = [longitude, latitude];

  if (geometry?.type === 'Polygon') {
    return isPointInPolygonCoordinates(point, geometry.coordinates, toleranceMeters);
  }
  if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.some((polygon) => isPointInPolygonCoordinates(point, polygon, toleranceMeters));
  }
  return false;
}
