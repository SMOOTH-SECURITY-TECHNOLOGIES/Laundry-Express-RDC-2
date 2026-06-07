import React, { useMemo } from 'react';
import { Icon } from '../Icon';

interface DispatchMapProps {
  drivers: Array<{ id: string; name: string; lat: number; lng: number; status: string }>;
  missions: Array<{ id: string; pickup: { lat: number; lng: number }; delivery: { lat: number; lng: number }; status: string }>;
}

const MAP_WIDTH = 600;
const MAP_HEIGHT = 340;

const statusColors: Record<string, { dot: string; ring: string; label: string }> = {
  available: { dot: '#10b981', ring: 'rgba(16,185,129,0.3)', label: 'Disponible' },
  mission: { dot: '#3b82f6', ring: 'rgba(59,130,246,0.3)', label: 'En mission' },
  pickup: { dot: '#f97316', ring: 'rgba(249,115,22,0.3)', label: 'Collecte' },
  delayed: { dot: '#ef4444', ring: 'rgba(239,68,68,0.3)', label: 'Retard' },
};

const defaultDrivers = [
  { id: '1', name: 'Jean Mbuyi', lat: -4.32, lng: 15.31, status: 'available' },
  { id: '2', name: 'Kabongo Tshi', lat: -4.35, lng: 15.28, status: 'mission' },
  { id: '3', name: 'Patrice Ngoy', lat: -4.30, lng: 15.33, status: 'pickup' },
  { id: '4', name: 'Samuel Lukusa', lat: -4.37, lng: 15.30, status: 'delayed' },
  { id: '5', name: 'David Kasongo', lat: -4.33, lng: 15.26, status: 'available' },
  { id: '6', name: 'Paul Mbala', lat: -4.29, lng: 15.35, status: 'mission' },
];

const defaultMissions = [
  { id: 'm1', pickup: { lat: -4.31, lng: 15.29 }, delivery: { lat: -4.36, lng: 15.32 }, status: 'active' },
  { id: 'm2', pickup: { lat: -4.34, lng: 15.31 }, delivery: { lat: -4.28, lng: 15.34 }, status: 'active' },
];

const mapToSvg = (lat: number, lng: number) => {
  const minLat = -4.40;
  const maxLat = -4.25;
  const minLng = 15.22;
  const maxLng = 15.40;
  const x = ((lng - minLng) / (maxLng - minLng)) * (MAP_WIDTH - 80) + 40;
  const y = ((maxLat - lat) / (maxLat - minLat)) * (MAP_HEIGHT - 60) + 30;
  return { x, y };
};

export const DispatchMap: React.FC<DispatchMapProps> = ({ drivers = defaultDrivers, missions = defaultMissions }) => {
  const driverPositions = useMemo(
    () => drivers.map((d) => ({ ...d, ...mapToSvg(d.lat, d.lng) })),
    [drivers]
  );

  const missionPaths = useMemo(
    () =>
      missions.map((m) => ({
        ...m,
        pickup: mapToSvg(m.pickup.lat, m.pickup.lng),
        delivery: mapToSvg(m.delivery.lat, m.delivery.lng),
      })),
    [missions]
  );

  const legendItems = [
    { color: '#10b981', label: 'Disponible' },
    { color: '#3b82f6', label: 'En mission' },
    { color: '#f97316', label: 'Collecte' },
    { color: '#ef4444', label: 'Retard' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="map" className="w-4 h-4 text-brand-blue" />
          <h3 className="text-sm font-bold text-gray-900">Vue en temps réel</h3>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-blue transition-colors px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-lightblue/20">
          <Icon name="map" className="w-3.5 h-3.5" />
          Plein écran
        </button>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-gray-100">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full">
          {/* Water / River */}
          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="#e0f2fe" />

          {/* Kinshasa land mass - simplified shape */}
          <path
            d="M50,280 C60,260 80,240 100,225 C130,205 160,195 200,185 C240,175 280,168 320,165 C360,162 400,163 440,168 C480,173 510,185 530,200 C545,210 555,225 560,245 C563,260 558,275 550,285 C540,298 520,305 495,308 C460,312 420,310 380,305 C340,300 300,292 260,288 C220,284 180,282 140,285 C110,288 80,290 50,280 Z"
            fill="#f1f5f9"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Road lines */}
          <path d="M120,260 C180,240 260,220 380,210 C440,205 500,215 540,240" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,4" />
          <path d="M200,185 C220,210 250,240 280,280" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,4" />
          <path d="M350,170 C360,200 370,240 375,290" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,4" />

          {/* Mission lines */}
          {missionPaths.map((mp) => (
            <g key={mp.id}>
              <line
                x1={mp.pickup.x}
                y1={mp.pickup.y}
                x2={mp.delivery.x}
                y2={mp.delivery.y}
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4,3"
                opacity="0.6"
              />
              <polygon
                points={`${mp.pickup.x},${mp.pickup.y - 5} ${mp.pickup.x - 4},${mp.pickup.y + 3} ${mp.pickup.x + 4},${mp.pickup.y + 3}`}
                fill="#f97316"
              />
              <circle cx={mp.delivery.x} cy={mp.delivery.y} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
            </g>
          ))}

          {/* Driver markers */}
          {driverPositions.map((d) => {
            const c = statusColors[d.status] || statusColors.available;
            return (
              <g key={d.id}>
                <circle cx={d.x} cy={d.y} r="12" fill={c.ring} />
                <circle cx={d.x} cy={d.y} r="6" fill={c.dot} stroke="white" strokeWidth="2" />
                <text x={d.x} y={d.y - 16} textAnchor="middle" className="fill-gray-700" fontSize="8" fontWeight="600">
                  {d.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Icon name="clock" className="w-3.5 h-3.5" />
          Dernière mise à jour: il y a 2 min
        </div>
        <div className="text-xs text-gray-400">
          {drivers.length} chauffeurs · {missions.length} missions actives
        </div>
      </div>
    </div>
  );
};
