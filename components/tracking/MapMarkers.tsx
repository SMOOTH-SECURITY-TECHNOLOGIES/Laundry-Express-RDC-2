import React from 'react';
import { Icon } from '../Icon';
import { STATUS_COLORS, type StatusTone } from '../ui/tokens';

/* ─── Types ─── */
export type MarkerKind = 'driver' | 'pickup' | 'delivery';

export interface MapMarker {
  id: string;
  kind: MarkerKind;
  label: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

interface MapMarkersProps {
  markers: MapMarker[];
  /** Centre de la carte (pour calculer les positions relatives) */
  center: { lat: number; lng: number };
  /** Bounds de la carte */
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** Callback quand on clique sur un marker */
  onMarkerClick?: (marker: MapMarker) => void;
}

/* ─── Config ─── */
const MARKER_CONFIG: Record<MarkerKind, { icon: string; tone: StatusTone; zIndex: number }> = {
  driver: { icon: 'truck', tone: 'info', zIndex: 30 },
  pickup: { icon: 'mapPin', tone: 'warning', zIndex: 20 },
  delivery: { icon: 'check', tone: 'success', zIndex: 10 },
};

/* ─── Helpers ─── */
const toRelativePosition = (
  lat: number,
  lng: number,
  bounds: MapMarkersProps['bounds']
) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const x = ((lng - minLng) / lngRange) * 100;
  const y = 100 - ((lat - minLat) / latRange) * 100;

  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(88, Math.max(12, y))}%`,
  };
};

/* ─── Component ─── */
export const MapMarkers: React.FC<MapMarkersProps> = ({
  markers,
  bounds,
  onMarkerClick,
}) => {
  return (
    <>
      {markers.map((marker) => {
        const config = MARKER_CONFIG[marker.kind];
        const colors = STATUS_COLORS[config.tone];
        const position = toRelativePosition(marker.latitude, marker.longitude, bounds);

        return (
          <button
            key={marker.id}
            type="button"
            onClick={() => onMarkerClick?.(marker)}
            className={`absolute flex min-h-[36px] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border-2 border-white px-2.5 py-1.5 text-[10px] font-black shadow-lg transition-transform ${
              marker.isActive ? 'scale-110 ring-4 ring-brand-blue/30' : ''
            } ${colors.bg} ${colors.text}`}
            style={{
              left: position.left,
              top: position.top,
              zIndex: marker.isActive ? config.zIndex + 10 : config.zIndex,
            }}
            aria-label={`${marker.label} - ${config.tone}`}
          >
            <Icon name={config.icon as any} className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{marker.label}</span>
          </button>
        );
      })}
    </>
  );
};

export default MapMarkers;
