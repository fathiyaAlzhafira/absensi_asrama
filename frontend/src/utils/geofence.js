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

function isPointInPolygonCoordinates(point, rings) {
  if (!Array.isArray(rings) || !rings.length || !isPointInRing(point, rings[0])) return false;
  return !rings.slice(1).some((hole) => isPointInRing(point, hole));
}

export function isPointInGeoJsonPolygon(latitude, longitude, geoJson) {
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
    return isPointInPolygonCoordinates(point, geometry.coordinates);
  }
  if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.some((polygon) => isPointInPolygonCoordinates(point, polygon));
  }
  return false;
}
