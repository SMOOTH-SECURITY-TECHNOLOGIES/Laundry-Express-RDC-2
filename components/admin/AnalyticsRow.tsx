import React from 'react';

const revenueData = [
  { x: 11, y: 60 }, { x: 13, y: 55 }, { x: 16, y: 72 },
  { x: 19, y: 65 }, { x: 23, y: 80 }, { x: 26, y: 75 },
  { x: 31, y: 90 }, { x: 3, y: 85 }, { x: 4, y: 95 },
  { x: 7, y: 88 }, { x: 10, y: 100 },
];

const ordersData = [
  { label: '4 juin', value: 180 },
  { label: '5 juin', value: 220 },
  { label: '6 juin', value: 200 },
  { label: '7 juin', value: 260 },
  { label: '8 juin', value: 240 },
  { label: '9 juin', value: 290 },
  { label: '10 juin', value: 310 },
];

const servicesData = [
  { label: 'Lessive', pct: 45, color: '#3b82f6' },
  { label: 'Nettoyage à sec', pct: 35, color: '#8b5cf6' },
  { label: 'Cordonnerie', pct: 20, color: '#22c55e' },
];

const usersData = [
  { x: 0, y: 60 }, { x: 3, y: 55 }, { x: 6, y: 70 },
  { x: 9, y: 65 }, { x: 12, y: 75 }, { x: 15, y: 80 },
  { x: 18, y: 72 }, { x: 21, y: 85 }, { x: 24, y: 88 },
  { x: 27, y: 92 }, { x: 30, y: 100 },
];

function LineChartSVG() {
  const w = 280, h = 100, pad = 10;
  const maxY = 105, minY = 50;
  const toX = (i: number) => pad + (i / (revenueData.length - 1)) * (w - 2 * pad);
  const toY = (v: number) => h - pad - ((v - minY) / (maxY - minY)) * (h - 2 * pad);

  const linePoints = revenueData.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');
  const areaPoints = `${toX(0)},${h - pad} ${linePoints} ${toX(revenueData.length - 1)},${h - pad}`;

  const xLabels = ['11 mai', '16 mai', '23 mai', '31 mai', '4 juin', '10 juin'];
  const xPositions = [0, 2, 5, 7, 9, 10];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 mt-3">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#lineGrad)" />
      <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {xLabels.map((label, i) => (
        <text key={label} x={toX(xPositions[i])} y={h - 1} textAnchor="middle" className="fill-gray-400" fontSize="7">
          {label}
        </text>
      ))}
    </svg>
  );
}

function BarChartSVG() {
  const w = 280, h = 120, padL = 24, padB = 18, padT = 4;
  const chartH = h - padT - padB;
  const maxVal = 320;
  const barW = 28, gap = 8;
  const yTicks = [150, 200, 250, 300];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36 mt-3">
      {yTicks.map((tick) => {
        const y = padT + chartH - (tick / maxVal) * chartH;
        return (
          <g key={tick}>
            <line x1={padL - 4} y1={y} x2={w} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-400" fontSize="7">
              {tick}
            </text>
          </g>
        );
      })}
      {ordersData.map((d, i) => {
        const x = padL + 8 + i * (barW + gap);
        const barH = (d.value / maxVal) * chartH;
        const y = padT + chartH - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill="#3b82f6" />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" className="fill-gray-400" fontSize="6.5">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChartSVG() {
  const size = 120, cx = size / 2, cy = size / 2, r = 42, stroke = 14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = servicesData.map((s) => {
    const dash = (s.pct / 100) * circumference;
    const gap = circumference - dash;
    const seg = { ...s, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28 mx-auto mt-3">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
      {segments.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy - 2} textAnchor="middle" className="fill-gray-900" fontSize="14" fontWeight="700">
        100%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-400" fontSize="7">
        services
      </text>
    </svg>
  );
}

function AreaChartSVG() {
  const w = 280, h = 100, pad = 10;
  const maxY = 105, minY = 50;
  const toX = (i: number) => pad + (i / (usersData.length - 1)) * (w - 2 * pad);
  const toY = (v: number) => h - pad - ((v - minY) / (maxY - minY)) * (h - 2 * pad);

  const linePoints = usersData.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');
  const areaPoints = `${toX(0)},${h - pad} ${linePoints} ${toX(usersData.length - 1)},${h - pad}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 mt-3">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#areaGrad)" />
      <polyline points={linePoints} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

interface ChartCardProps {
  title: string;
  period?: string;
  value: string;
  change: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, period, value, change, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {period && (
        <span className="text-xs text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">{period}</span>
      )}
    </div>
    <p className="text-2xl font-extrabold text-gray-900 mt-2">{value}</p>
    <p className="text-xs text-green-600 font-medium mt-0.5">{change}</p>
    {children}
  </div>
);

export const AnalyticsRow: React.FC = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <ChartCard title="Revenus" period="30 jours" value="11 000 $" change="+12% vs période précédente">
        <LineChartSVG />
      </ChartCard>

      <ChartCard title="Commandes par jour" period="7 jours" value="1 254" change="+8% vs période précédente">
        <BarChartSVG />
      </ChartCard>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900">Répartition par service</h3>
        <DonutChartSVG />
        <div className="mt-3 space-y-1.5">
          {servicesData.map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-gray-600">{s.label}</span>
              </div>
              <span className="font-medium text-gray-900">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <ChartCard title="Utilisateurs actifs" period="30 jours" value="12 584" change="+15% vs période précédente">
        <AreaChartSVG />
      </ChartCard>
    </div>
  );
};
