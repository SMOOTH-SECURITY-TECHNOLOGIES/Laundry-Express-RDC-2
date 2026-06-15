import React from 'react';
import { Icon } from '../../Icon';
import type { OrderMapZone } from '../../../lib/admin/orders-types';

interface OrderMapProps {
  zones: OrderMapZone[];
}

export function OrderMap({ zones }: OrderMapProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="map" className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">Carte des zones – Kinshasa</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="p-4">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          <rect x="0" y="0" width="400" height="300" fill="#f9f7f3" rx="12" />

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
          <path
            d="M30,250 Q120,230 200,245 Q280,260 380,240"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text x="200" y="290" textAnchor="middle" className="fill-blue-400" style={{ fontSize: '9px', fontWeight: 500 }}>
            Fleuve Congo
          </text>

          {zones.map((zone, i) => (
            <g key={`${zone.name}-${i}`}>
              <circle cx={zone.x} cy={zone.y} r="14" fill={zone.color} opacity="0.2" />
              <circle cx={zone.x} cy={zone.y} r="6" fill={zone.color} stroke="#fff" strokeWidth="2" />
              <text
                x={zone.x}
                y={zone.y - 18}
                textAnchor="middle"
                className="fill-gray-700"
                style={{ fontSize: '8px', fontWeight: 600 }}
              >
                {zone.name}
              </text>
              <text
                x={zone.x}
                y={zone.y + 22}
                textAnchor="middle"
                className="fill-gray-500"
                style={{ fontSize: '7px' }}
              >
                {zone.count} cmd
              </text>
            </g>
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
          {zones.map((zone) => (
            <div key={zone.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="text-[10px] text-gray-500">{zone.name} · {zone.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
