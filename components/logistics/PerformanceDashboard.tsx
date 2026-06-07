import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';

interface PerformanceDashboardProps {
  formatPrice: (price: number) => string;
}

const weekData = [
  { day: '24/05', completed: 45, assigned: 60, cancelled: 3, revenue: 850 },
  { day: '25/05', completed: 52, assigned: 65, cancelled: 2, revenue: 920 },
  { day: '26/05', completed: 48, assigned: 58, cancelled: 5, revenue: 780 },
  { day: '27/05', completed: 55, assigned: 70, cancelled: 1, revenue: 1050 },
  { day: '28/05', completed: 60, assigned: 72, cancelled: 4, revenue: 1100 },
  { day: '29/05', completed: 58, assigned: 68, cancelled: 2, revenue: 980 },
  { day: '30/05', completed: 50, assigned: 65, cancelled: 3, revenue: 920 },
];

const LINE_CHART_WIDTH = 400;
const LINE_CHART_HEIGHT = 160;
const LINE_CHART_PADDING = { top: 10, right: 10, bottom: 30, left: 30 };

const BAR_CHART_WIDTH = 400;
const BAR_CHART_HEIGHT = 160;
const BAR_CHART_PADDING = { top: 10, right: 10, bottom: 30, left: 30 };

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ formatPrice }) => {
  const [revenuePeriod, setRevenuePeriod] = useState<'week' | 'month'>('week');

  const missionsChart = useMemo(() => {
    const data = weekData;
    const maxVal = 80;
    const chartW = LINE_CHART_WIDTH - LINE_CHART_PADDING.left - LINE_CHART_PADDING.right;
    const chartH = LINE_CHART_HEIGHT - LINE_CHART_PADDING.top - LINE_CHART_PADDING.bottom;

    const getX = (i: number) => LINE_CHART_PADDING.left + (i / (data.length - 1)) * chartW;
    const getY = (v: number) => LINE_CHART_PADDING.top + (1 - v / maxVal) * chartH;

    const toPath = (key: 'completed' | 'assigned' | 'cancelled') =>
      data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d[key])}`).join(' ');

    const toAreaPath = (key: 'completed' | 'assigned' | 'cancelled') =>
      `${toPath(key)} L${getX(data.length - 1)},${LINE_CHART_PADDING.top + chartH} L${getX(0)},${LINE_CHART_PADDING.top + chartH} Z`;

    return { data, getX, getY, maxVal, chartW, chartH, toPath, toAreaPath };
  }, []);

  const revenueChart = useMemo(() => {
    const data = weekData;
    const maxVal = 1500;
    const chartW = BAR_CHART_WIDTH - BAR_CHART_PADDING.left - BAR_CHART_PADDING.right;
    const chartH = BAR_CHART_HEIGHT - BAR_CHART_PADDING.top - BAR_CHART_PADDING.bottom;
    const barWidth = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;

    return { data, maxVal, chartW, chartH, barWidth, gap };
  }, []);

  const areaChart = useMemo(() => {
    const data = [
      { val: 15 }, { val: 18 }, { val: 14 }, { val: 20 }, { val: 16 }, { val: 19 }, { val: 18 },
    ];
    const maxVal = 30;
    const chartW = LINE_CHART_WIDTH - LINE_CHART_PADDING.left - LINE_CHART_PADDING.right;
    const chartH = LINE_CHART_HEIGHT - LINE_CHART_PADDING.top - LINE_CHART_PADDING.bottom;

    const getX = (i: number) => LINE_CHART_PADDING.left + (i / (data.length - 1)) * chartW;
    const getY = (v: number) => LINE_CHART_PADDING.top + (1 - v / maxVal) * chartH;

    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.val)}`).join(' ');
    const areaPath = `${linePath} L${getX(data.length - 1)},${LINE_CHART_PADDING.top + chartH} L${getX(0)},${LINE_CHART_PADDING.top + chartH} Z`;

    return { data, getX, getY, maxVal, chartW, chartH, linePath, areaPath };
  }, []);

  const deliveryChart = useMemo(() => {
    const data = [
      { val: 22 }, { val: 28 }, { val: 25 }, { val: 30 }, { val: 26 }, { val: 29 }, { val: 28 },
    ];
    const maxVal = 45;
    const chartW = LINE_CHART_WIDTH - LINE_CHART_PADDING.left - LINE_CHART_PADDING.right;
    const chartH = LINE_CHART_HEIGHT - LINE_CHART_PADDING.top - LINE_CHART_PADDING.bottom;

    const getX = (i: number) => LINE_CHART_PADDING.left + (i / (data.length - 1)) * chartW;
    const getY = (v: number) => LINE_CHART_PADDING.top + (1 - v / maxVal) * chartH;

    const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.val)}`).join(' ');
    const areaPath = `${linePath} L${getX(data.length - 1)},${LINE_CHART_PADDING.top + chartH} L${getX(0)},${LINE_CHART_PADDING.top + chartH} Z`;

    return { data, getX, getY, maxVal, chartW, chartH, linePath, areaPath };
  }, []);

  const yTicks = (max: number, step: number) => {
    const ticks = [];
    for (let v = 0; v <= max; v += step) ticks.push(v);
    return ticks;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Chart 1: Missions par jour */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Missions par jour (7 derniers jours)</h3>
          <Icon name="chartBar" className="w-4 h-4 text-gray-400" />
        </div>
        <svg viewBox={`0 0 ${LINE_CHART_WIDTH} ${LINE_CHART_HEIGHT}`} className="w-full">
          {yTicks(80, 20).map((v) => (
            <g key={v}>
              <text x={LINE_CHART_PADDING.left - 5} y={missionsChart.getY(v) + 3} textAnchor="end" className="fill-gray-400" fontSize="9">
                {v}
              </text>
              <line
                x1={LINE_CHART_PADDING.left}
                y1={missionsChart.getY(v)}
                x2={LINE_CHART_WIDTH - LINE_CHART_PADDING.right}
                y2={missionsChart.getY(v)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </g>
          ))}
          {missionsChart.data.map((d, i) => (
            <text key={i} x={missionsChart.getX(i)} y={LINE_CHART_HEIGHT - 5} textAnchor="middle" className="fill-gray-400" fontSize="9">
              {d.day}
            </text>
          ))}
          <path d={missionsChart.toPath('completed')} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={missionsChart.toPath('assigned')} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={missionsChart.toPath('cancelled')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {missionsChart.data.map((d, i) => (
            <g key={i}>
              <circle cx={missionsChart.getX(i)} cy={missionsChart.getY(d.completed)} r="3" fill="#10b981" />
              <circle cx={missionsChart.getX(i)} cy={missionsChart.getY(d.assigned)} r="3" fill="#3b82f6" />
              <circle cx={missionsChart.getX(i)} cy={missionsChart.getY(d.cancelled)} r="3" fill="#ef4444" />
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs text-gray-500">Terminées</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-xs text-gray-500">Assignées</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="text-xs text-gray-500">Annulées</span>
          </div>
        </div>
      </div>

      {/* Chart 2: Temps moyen collecte */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Temps moyen collecte</h3>
          <Icon name="clock" className="w-4 h-4 text-gray-400" />
        </div>
        <div className="mb-2">
          <span className="text-3xl font-extrabold text-gray-900">18 min</span>
          <span className="ml-2 text-sm font-medium text-emerald-500">-8% vs hier</span>
        </div>
        <svg viewBox={`0 0 ${LINE_CHART_WIDTH} ${LINE_CHART_HEIGHT}`} className="w-full">
          <defs>
            <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks(30, 10).map((v) => (
            <g key={v}>
              <text x={LINE_CHART_PADDING.left - 5} y={areaChart.getY(v) + 3} textAnchor="end" className="fill-gray-400" fontSize="9">
                {v}
              </text>
              <line
                x1={LINE_CHART_PADDING.left}
                y1={areaChart.getY(v)}
                x2={LINE_CHART_WIDTH - LINE_CHART_PADDING.right}
                y2={areaChart.getY(v)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </g>
          ))}
          {areaChart.data.map((_, i) => (
            <text key={i} x={areaChart.getX(i)} y={LINE_CHART_HEIGHT - 5} textAnchor="middle" className="fill-gray-400" fontSize="9">
              {weekData[i].day}
            </text>
          ))}
          <path d={areaChart.areaPath} fill="url(#collectGrad)" />
          <path d={areaChart.linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {areaChart.data.map((d, i) => (
            <circle key={i} cx={areaChart.getX(i)} cy={areaChart.getY(d.val)} r="3" fill="#10b981" />
          ))}
        </svg>
      </div>

      {/* Chart 3: Temps moyen livraison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Temps moyen livraison</h3>
          <Icon name="truck" className="w-4 h-4 text-gray-400" />
        </div>
        <div className="mb-2">
          <span className="text-3xl font-extrabold text-gray-900">28 min</span>
          <span className="ml-2 text-sm font-medium text-red-500">+5% vs hier</span>
        </div>
        <svg viewBox={`0 0 ${LINE_CHART_WIDTH} ${LINE_CHART_HEIGHT}`} className="w-full">
          <defs>
            <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks(45, 15).map((v) => (
            <g key={v}>
              <text x={LINE_CHART_PADDING.left - 5} y={deliveryChart.getY(v) + 3} textAnchor="end" className="fill-gray-400" fontSize="9">
                {v}
              </text>
              <line
                x1={LINE_CHART_PADDING.left}
                y1={deliveryChart.getY(v)}
                x2={LINE_CHART_WIDTH - LINE_CHART_PADDING.right}
                y2={deliveryChart.getY(v)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </g>
          ))}
          {deliveryChart.data.map((_, i) => (
            <text key={i} x={deliveryChart.getX(i)} y={LINE_CHART_HEIGHT - 5} textAnchor="middle" className="fill-gray-400" fontSize="9">
              {weekData[i].day}
            </text>
          ))}
          <path d={deliveryChart.areaPath} fill="url(#deliveryGrad)" />
          <path d={deliveryChart.linePath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {deliveryChart.data.map((d, i) => (
            <circle key={i} cx={deliveryChart.getX(i)} cy={deliveryChart.getY(d.val)} r="3" fill="#f97316" />
          ))}
        </svg>
      </div>

      {/* Chart 4: Revenus estimés */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Revenus estimés</h3>
          <select
            value={revenuePeriod}
            onChange={(e) => setRevenuePeriod(e.target.value as 'week' | 'month')}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-extrabold text-gray-900">{formatPrice(2450)}</span>
          <span className="ml-2 text-sm font-medium text-emerald-500">+12% vs semaine dernière</span>
        </div>
        <svg viewBox={`0 0 ${BAR_CHART_WIDTH} ${BAR_CHART_HEIGHT}`} className="w-full">
          {yTicks(1500, 500).map((v) => (
            <g key={v}>
              <text x={BAR_CHART_PADDING.left - 5} y={LINE_CHART_PADDING.top + (1 - v / 1500) * (BAR_CHART_HEIGHT - BAR_CHART_PADDING.top - BAR_CHART_PADDING.bottom) + 3} textAnchor="end" className="fill-gray-400" fontSize="9">
                {v >= 1000 ? `${v / 1000}K` : v}
              </text>
              <line
                x1={BAR_CHART_PADDING.left}
                y1={LINE_CHART_PADDING.top + (1 - v / 1500) * (BAR_CHART_HEIGHT - BAR_CHART_PADDING.top - BAR_CHART_PADDING.bottom)}
                x2={BAR_CHART_WIDTH - BAR_CHART_PADDING.right}
                y2={LINE_CHART_PADDING.top + (1 - v / 1500) * (BAR_CHART_HEIGHT - BAR_CHART_PADDING.top - BAR_CHART_PADDING.bottom)}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </g>
          ))}
          {revenueChart.data.map((d, i) => {
            const barH = (d.revenue / revenueChart.maxVal) * revenueChart.chartH;
            const x = BAR_CHART_PADDING.left + i * (revenueChart.barWidth + revenueChart.gap) + revenueChart.gap / 2;
            const y = BAR_CHART_PADDING.top + revenueChart.chartH - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={revenueChart.barWidth} height={barH} rx="3" fill="#3b82f6" />
                <text x={x + revenueChart.barWidth / 2} y={BAR_CHART_HEIGHT - 5} textAnchor="middle" className="fill-gray-400" fontSize="9">
                  {d.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
