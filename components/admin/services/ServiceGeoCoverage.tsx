import { useState } from 'react';
import { AdminServiceGeoZone } from '../../../lib/admin/services-types';
import { formatCurrency, formatPercent } from '../../../lib/admin/services-formatters';
import { Icon } from '../../Icon';

interface ServiceGeoCoverageProps {
  zones: AdminServiceGeoZone[];
}

const zoneColors = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EF4444', '#06B6D4', '#F59E0B'];

export default function ServiceGeoCoverage({ zones }: ServiceGeoCoverageProps) {
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="map" className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-900">Couverture géographique</h3>
      </div>
      <div className="relative">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          <rect x="0" y="0" width="400" height="300" fill="#f9f7f3" rx="12" />
          <defs>
            <radialGradient id="geoHeat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <polygon
            points="60,50 180,30 320,50 370,100 380,180 350,240 280,260 200,270 120,260 60,220 30,160 40,90"
            fill="#e8e4db"
            stroke="#d4cfc4"
            strokeWidth="1.5"
          />
          <path
            d="M30,250 Q120,230 200,245 Q280,260 380,240"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.5"
          />
          <text x="200" y="290" textAnchor="middle" className="fill-blue-400" style={{ fontSize: '9px', fontWeight: 500 }}>
            Fleuve Congo
          </text>
          {zones.map((zone, i) => {
            const color = zoneColors[i % zoneColors.length];
            const isHovered = hoveredZone === i;
            return (
              <g
                key={zone.name}
                onMouseEnter={() => setHoveredZone(i)}
                onMouseLeave={() => setHoveredZone(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={isHovered ? 18 : 14}
                  fill={color}
                  opacity={isHovered ? 0.25 : 0.15}
                  className="transition-all duration-200"
                />
                <circle
                  cx={zone.x}
                  cy={zone.y}
                  r={isHovered ? 8 : 6}
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                {isHovered && (
                  <g>
                    <rect
                      x={zone.x - 60}
                      y={zone.y - 68}
                      width="120"
                      height="52"
                      rx="6"
                      fill="white"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                    />
                    <text x={zone.x} y={zone.y - 52} textAnchor="middle" style={{ fontSize: '9px', fontWeight: 700 }} className="fill-gray-900">
                      {zone.name}
                    </text>
                    <text x={zone.x} y={zone.y - 40} textAnchor="middle" style={{ fontSize: '7px' }} className="fill-gray-500">
                      {zone.partners} partenaires · {zone.services} services
                    </text>
                    <text x={zone.x} y={zone.y - 28} textAnchor="middle" style={{ fontSize: '7px' }} className="fill-gray-500">
                      {formatCurrency(zone.revenue)} · SLA {formatPercent(zone.sla)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-4">
        {zones.map((zone, i) => (
          <div key={zone.name} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zoneColors[i % zoneColors.length] }} />
            <span className="text-[10px] text-gray-500">{zone.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
