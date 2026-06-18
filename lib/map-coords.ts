export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function latLngToPercent(lat: number, lng: number, bounds: MapBounds) {
  const latRange = bounds.maxLat - bounds.minLat || 0.01;
  const lngRange = bounds.maxLng - bounds.minLng || 0.01;
  const x = ((lng - bounds.minLng) / lngRange) * 100;
  const y = 100 - ((lat - bounds.minLat) / latRange) * 100;
  return {
    left: Math.min(92, Math.max(8, x)),
    top: Math.min(88, Math.max(12, y)),
  };
}

export function latLngToSvg(
  lat: number,
  lng: number,
  bounds: MapBounds,
  width = 400,
  height = 300,
) {
  const latRange = bounds.maxLat - bounds.minLat || 0.01;
  const lngRange = bounds.maxLng - bounds.minLng || 0.01;
  const x = ((lng - bounds.minLng) / lngRange) * width;
  const y = height - ((lat - bounds.minLat) / latRange) * height;
  return {
    x: Math.min(width - 20, Math.max(20, x)),
    y: Math.min(height - 20, Math.max(20, y)),
  };
}

export function buildRoutePolyline(
  points: Array<{ lat: number; lng: number } | undefined>,
  bounds: MapBounds,
): string {
  return points
    .filter((point): point is { lat: number; lng: number } => Boolean(point))
    .map((point) => {
      const { x, y } = latLngToSvg(point.lat, point.lng, bounds);
      return `${x},${y}`;
    })
    .join(' ');
}
