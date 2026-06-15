import React, { useMemo, useState } from 'react';
import { Icon } from '../../Icon';
import type { MapCluster, MapPoint, MapZoneKpi } from '../../../lib/admin/dispatcher-types';

interface DispatchMapProps {
  points: MapPoint[];
  clusters: MapCluster[];
  zoneKpis: MapZoneKpi[];
}

const MAP_WIDTH = 400;
const MAP_HEIGHT = 300;

const CITY_LABELS = [
  { name: 'Gombe', x: 170, y: 60 },
  { name: 'Ngaliema', x: 100, y: 130 },
  { name: 'Limete', x: 260, y: 80 },
  { name: 'Masina', x: 310, y: 110 },
  { name: 'Bandalungwa', x: 150, y: 170 },
  { name: 'Kalamu', x: 220, y: 200 },
];

const POINT_COLORS: Record<string, string> = {
  driver: '#22c55e',
  pickup: '#f97316',
  delivery: '#8b5cf6',
  incident: '#ef4444',
};

function mapToSvg(lat: number, lng: number) {
  const minLat = -4.4;
  const maxLat = -4.25;
  const minLng = 15.22;
  const maxLng = 15.4;
  const x = ((lng - minLng) / (maxLng - minLng)) * (MAP_WIDTH - 80) + 40;
  const y = ((maxLat - lat) / (maxLat - minLat)) * (MAP_HEIGHT - 60) + 30;
  return { x, y };
}

export function DispatchMap({ points, clusters, zoneKpis }: DispatchMapProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const mappedPoints = useMemo(
    () => points.map((p) => ({ ...p, ...mapToSvg(p.lat, p.lng) })),
    [points]
  );

  const wrapperClass = fullscreen
    ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto'
    : 'bg-white rounded-2xl border border-gray-100 shadow-sm';

  return (
    <div className={wrapperClass}>
      <div className={`${fullscreen ? '' : 'px-6 py-4 border-b border-gray-100'} flex items-center justify-between mb-4`}>
        <div className="flex items-center gap-3">
          <Icon name="map" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Carte opérationnelle - Kinshasa</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="text-xs font-medium text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
        >
          {fullscreen ? 'Fermer' : 'Plein écran'}
        </button>
      </div>

      <div className={fullscreen ? '' : 'p-4'}>
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-auto rounded-xl border border-gray-100">
          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="#f9f7f3" rx="12" />
          <polygon
            points="60,50 180,30 320,50 370,100 380,180 350,240 280,260 200,270 120,260 60,220 30,160 40,90"
            fill="#e8e4db"
            stroke="#d4cfc4"
            strokeWidth="1.5"
          />
          <path d="M30,250 Q120,230 200,245 Q280,260 380,240" fill="none" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

          {CITY_LABELS.map((city) => (
            <text key={city.name} x={city.x} y={city.y} textAnchor="middle" className="fill-gray-500" style={{ fontSize: '8px', fontWeight: 600 }}>
              {city.name}
            </text>
          ))}

          {mappedPoints.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="8" fill={POINT_COLORS[p.type]} opacity="0.25" />
              <circle cx={p.x} cy={p.y} r="4" fill={POINT_COLORS[p.type]} stroke="#fff" strokeWidth="1.5" />
            </g>
          ))}

          {clusters.map((cluster, i) => (
            <g key={`cluster-${i}`}>
              <circle cx={cluster.x} cy={cluster.y} r="18" fill={cluster.color} opacity="0.15" />
              <circle cx={cluster.x} cy={cluster.y} r="14" fill={cluster.color} opacity="0.85" />
              <text x={cluster.x} y={cluster.y + 4} textAnchor="middle" fill="#fff" style={{ fontSize: '10px', fontWeight: 700 }}>
                {cluster.count}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
          {[
            { color: POINT_COLORS.driver, label: 'Chauffeurs' },
            { color: POINT_COLORS.pickup, label: 'Collectes' },
            { color: POINT_COLORS.delivery, label: 'Livraisons' },
            { color: POINT_COLORS.incident, label: 'Incidents' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {zoneKpis.map((zone) => (
            <div key={zone.name} className="rounded-xl bg-gray-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold text-gray-700">{zone.name}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {zone.revenue.toLocaleString('fr-FR')} $
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">ETA {zone.etaMinutes} min</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
