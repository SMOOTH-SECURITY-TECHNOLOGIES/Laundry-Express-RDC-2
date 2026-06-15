import React, { useState } from 'react';
import { Icon } from '../../components/Icon';
import { logisticsCard } from './logistics-ui';

const PERIODS = ['Cette semaine', 'Ce mois', 'Ce trimestre'] as const;

const KPI_DATA = [
  { label: 'Missions complétées', value: '242', sub: '+12% vs semaine dernière', icon: 'check' as const, tone: 'bg-green-50 text-green-600' },
  { label: 'Temps moyen', value: '23 min', sub: '-3 min vs semaine dernière', icon: 'clock' as const, tone: 'bg-blue-50 text-brand-blue' },
  { label: 'Revenu total', value: '2 450 $', sub: '+8% vs semaine dernière', icon: 'currencyDollar' as const, tone: 'bg-orange-50 text-orange-600' },
  { label: 'Ponctualité', value: '92%', sub: 'Objectif: 95%', icon: 'hand-thumb-up' as const, tone: 'bg-purple-50 text-purple-600' },
];

const DAILY_DATA = [
  { day: 'Lun', value: 32 },
  { day: 'Mar', value: 28 },
  { day: 'Mer', value: 41 },
  { day: 'Jeu', value: 36 },
  { day: 'Ven', value: 45 },
  { day: 'Sam', value: 38 },
  { day: 'Dim', value: 22 },
];

const COMMUNE_DATA = [
  { name: 'Gombe', value: 48 },
  { name: 'Lingwala', value: 35 },
  { name: 'Barumbu', value: 28 },
  { name: 'Kinshasa', value: 42 },
  { name: 'Ngiri-Ngiri', value: 31 },
  { name: 'Bandalungwa', value: 26 },
];

const COLLECT_TIME_DATA = [
  { day: 'Lun', value: 22 },
  { day: 'Mar', value: 25 },
  { day: 'Mer', value: 19 },
  { day: 'Jeu', value: 23 },
  { day: 'Ven', value: 21 },
  { day: 'Sam', value: 24 },
  { day: 'Dim', value: 20 },
];

const REVENUE_DATA = [
  { day: 'Lun', value: 320 },
  { day: 'Mar', value: 280 },
  { day: 'Mer', value: 410 },
  { day: 'Jeu', value: 360 },
  { day: 'Ven', value: 450 },
  { day: 'Sam', value: 380 },
  { day: 'Dim', value: 220 },
];

function LineChart({ data, color }: { data: typeof DAILY_DATA; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const width = 400;
  const height = 160;
  const padding = 20;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - ((d.value / maxVal) * (height - padding * 2)),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
        <line key={i} x1={padding} y1={height - padding - (tick * (height - padding * 2))} x2={width - padding} y2={height - padding - (tick * (height - padding * 2))} stroke="#f0f0f0" strokeWidth="1" />
      ))}
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={padding + i * stepX} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400">{d.day}</text>
      ))}
    </svg>
  );
}

function BarChart({ data, color }: { data: typeof COMMUNE_DATA; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const barHeight = 24;
  const gap = 12;
  const maxBarWidth = 200;

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 text-right">{d.name}</span>
          <div className="flex-1 bg-surface-muted rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 w-8">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function AreaChart({ data, color }: { data: typeof COLLECT_TIME_DATA; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const width = 400;
  const height = 140;
  const padding = 20;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: height - padding - ((d.value / maxVal) * (height - padding * 2)),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <defs>
        <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#area-${color})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={padding + i * stepX} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400">{d.day}</text>
      ))}
    </svg>
  );
}

function RevenueChart({ data, color }: { data: typeof REVENUE_DATA; color: string }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const width = 400;
  const height = 160;
  const padding = 30;
  const barWidth = ((width - padding * 2) / data.length) * 0.6;
  const barGap = ((width - padding * 2) / data.length) * 0.4;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
        <g key={i}>
          <line x1={padding} y1={height - padding - (tick * (height - padding * 2))} x2={width - padding} y2={height - padding - (tick * (height - padding * 2))} stroke="#f0f0f0" strokeWidth="1" />
          <text x={padding - 5} y={height - padding - (tick * (height - padding * 2)) + 3} textAnchor="end" className="text-[9px] fill-gray-400">${Math.round(maxVal * tick)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = padding + i * (barWidth + barGap) + barGap / 2;
        const barH = (d.value / maxVal) * (height - padding * 2);
        return (
          <g key={i}>
            <rect x={x} y={height - padding - barH} width={barWidth} height={barH} rx="4" fill={color} opacity="0.85" />
            <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="text-[10px] fill-gray-400">{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const LogisticsPerformance: React.FC = () => {
  const [period, setPeriod] = useState<string>('Cette semaine');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-primary">Performance opérationnelle</h1>
          <p className="text-sm text-gray-500 mt-1">Analysez les indicateurs clés de vos opérations</p>
        </div>
        <div className="flex bg-surface-muted rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-surface-card text-content-primary shadow-sm'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DATA.map(kpi => (
          <div key={kpi.label} className={`${logisticsCard} p-5`}>
            <div className="flex items-center gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${kpi.tone}`}>
                <Icon name={kpi.icon} className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-extrabold text-content-primary">{kpi.value}</p>
                <p className="mt-0.5 text-xs font-medium text-content-muted">{kpi.sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-sm font-bold text-content-primary mb-4">Missions par jour</h3>
          <div className="h-48">
            <LineChart data={DAILY_DATA} color="#2563EB" />
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-sm font-bold text-content-primary mb-4">Livraisons par commune</h3>
          <div className="h-48">
            <BarChart data={COMMUNE_DATA} color="#F97316" />
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-sm font-bold text-content-primary mb-4">Temps moyen collecte (min)</h3>
          <div className="h-44">
            <AreaChart data={COLLECT_TIME_DATA} color="#8B5CF6" />
          </div>
        </div>
        <div className={`${logisticsCard} p-5`}>
          <h3 className="text-sm font-bold text-content-primary mb-4">Revenus quotidiens ($)</h3>
          <div className="h-48">
            <RevenueChart data={REVENUE_DATA} color="#10B981" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsPerformance;
