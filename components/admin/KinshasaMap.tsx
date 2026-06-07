import React from 'react';

const chauffeurDots = [
  { cx: 120, cy: 100 },
  { cx: 180, cy: 80 },
  { cx: 250, cy: 110 },
  { cx: 300, cy: 90 },
  { cx: 140, cy: 150 },
  { cx: 210, cy: 140 },
  { cx: 270, cy: 160 },
  { cx: 330, cy: 130 },
];

const collectDots = [
  { cx: 160, cy: 120 },
  { cx: 230, cy: 100 },
  { cx: 290, cy: 130 },
];

const livraisonDots = [
  { cx: 190, cy: 160 },
  { cx: 260, cy: 150 },
  { cx: 310, cy: 170 },
];

const incidentDots = [
  { cx: 220, cy: 180 },
];

const clusters = [
  { label: '18', x: 176, y: 98, color: '#0B5FFF', ring: '#dbeafe' },
  { label: '11', x: 270, y: 126, color: '#22c55e', ring: '#dcfce7' },
  { label: '7', x: 145, y: 162, color: '#f97316', ring: '#ffedd5' },
];

const cityLabels = [
  { name: 'Gombe', x: 170, y: 60 },
  { name: 'Ngaliema', x: 100, y: 130 },
  { name: 'Limete', x: 260, y: 80 },
  { name: 'Masina', x: 310, y: 110 },
  { name: 'Bandalungwa', x: 150, y: 170 },
  { name: 'Kalamu', x: 220, y: 200 },
  { name: 'Kintambo', x: 130, y: 180 },
];

const zoneStats = [
  { name: 'Gombe', revenue: '4 850 $', eta: '38 min', tone: 'bg-blue-50 text-blue-700' },
  { name: 'Limete', revenue: '3 120 $', eta: '44 min', tone: 'bg-green-50 text-green-700' },
  { name: 'Ngaliema', revenue: '2 740 $', eta: '52 min', tone: 'bg-orange-50 text-orange-700' },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const KinshasaMap: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">Carte opérationnelle – Kinshasa</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
        <button
          type="button"
          onClick={() => notifyAdminAction('Carte opérationnelle ouverte en vue détaillée.')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Plein écran"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          <rect x="0" y="0" width="400" height="300" fill="#f9f7f3" rx="12" />
          <defs>
            <radialGradient id="fleetHeat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B5FFF" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#22C55E" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <polygon
            points="60,50 180,30 320,50 370,100 380,180 350,240 280,260 200,270 120,260 60,220 30,160 40,90"
            fill="#e8e4db"
            stroke="#d4cfc4"
            strokeWidth="1.5"
          />

          <ellipse cx="175" cy="110" rx="85" ry="58" fill="url(#fleetHeat)" />
          <ellipse cx="288" cy="135" rx="64" ry="48" fill="url(#fleetHeat)" />

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

          {chauffeurDots.map((dot, i) => (
            <circle key={`chauffeur-${i}`} cx={dot.cx} cy={dot.cy} r="5" fill="#22c55e" opacity="0.85" />
          ))}
          {collectDots.map((dot, i) => (
            <circle key={`collect-${i}`} cx={dot.cx} cy={dot.cy} r="5" fill="#f97316" opacity="0.85" />
          ))}
          {livraisonDots.map((dot, i) => (
            <circle key={`livraison-${i}`} cx={dot.cx} cy={dot.cy} r="5" fill="#a855f7" opacity="0.85" />
          ))}
          {incidentDots.map((dot, i) => (
            <circle key={`incident-${i}`} cx={dot.cx} cy={dot.cy} r="5" fill="#ef4444" opacity="0.85" />
          ))}

          {clusters.map((cluster) => (
            <g key={cluster.label}>
              <circle cx={cluster.x} cy={cluster.y} r="17" fill={cluster.ring} stroke={cluster.color} strokeWidth="2" opacity="0.94" />
              <text x={cluster.x} y={cluster.y + 4} textAnchor="middle" fill={cluster.color} style={{ fontSize: '11px', fontWeight: 800 }}>
                {cluster.label}
              </text>
            </g>
          ))}

          {cityLabels.map((city) => (
            <text
              key={city.name}
              x={city.x}
              y={city.y}
              textAnchor="middle"
              className="fill-gray-600"
              style={{ fontSize: '8px', fontWeight: 600 }}
            >
              {city.name}
            </text>
          ))}
        </svg>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-500">Chauffeurs · 8</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-[10px] text-gray-500">Collectes · 3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-[10px] text-gray-500">Livraisons · 3</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[10px] text-gray-500">Incidents · 1</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {zoneStats.map((zone) => (
            <button
              key={zone.name}
              type="button"
              onClick={() => notifyAdminAction(`Zone ${zone.name} ouverte avec rentabilité et SLA.`)}
              className={`rounded-xl px-3 py-2 text-left ${zone.tone}`}
            >
              <p className="text-xs font-extrabold">{zone.name}</p>
              <p className="text-[10px] opacity-80">{zone.revenue} · ETA {zone.eta}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
