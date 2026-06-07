import React from 'react';
import { Icon } from '../Icon';

const fleetHeatmap = [
  { zone: 'Gombe', load: 92, drivers: 14, tone: 'bg-blue-600' },
  { zone: 'Limete', load: 78, drivers: 11, tone: 'bg-green-500' },
  { zone: 'Ngaliema', load: 66, drivers: 8, tone: 'bg-orange-500' },
  { zone: 'Bandal', load: 54, drivers: 6, tone: 'bg-cyan-500' },
  { zone: 'Masina', load: 41, drivers: 4, tone: 'bg-slate-400' },
];

const profitableZones = [
  { zone: 'Gombe', revenue: '4 850 $', margin: '31%' },
  { zone: 'Limete', revenue: '3 120 $', margin: '26%' },
  { zone: 'Ngaliema', revenue: '2 740 $', margin: '22%' },
];

const communeTimes = [
  { commune: 'Gombe', time: '38 min', status: 'OK' },
  { commune: 'Limete', time: '44 min', status: 'OK' },
  { commune: 'Bandalungwa', time: '57 min', status: 'Tendu' },
  { commune: 'Masina', time: '1h12', status: 'Risque' },
];

const partnerRanking = [
  { partner: 'Prestige Pressing', revenue: '12 450 $', share: 29 },
  { partner: 'Speed Clean', revenue: '9 820 $', share: 23 },
  { partner: 'Eco Pressing', revenue: '7 340 $', share: 17 },
  { partner: 'Quick Wash', revenue: '5 910 $', share: 14 },
];

const statusTone = (status: string) => {
  if (status === 'OK') return 'bg-green-100 text-green-700';
  if (status === 'Tendu') return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

export const OperationsIntelligence: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="fire" className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-gray-900">Fleet Heatmap</h3>
        </div>
        <div className="space-y-3">
          {fleetHeatmap.map((item) => (
            <div key={item.zone}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-bold text-gray-700">{item.zone}</span>
                <span className="text-gray-500">{item.drivers} chauffeurs</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="trophy" className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold text-gray-900">Top zones rentables</h3>
        </div>
        <div className="space-y-3">
          {profitableZones.map((zone, index) => (
            <div key={zone.zone} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-extrabold text-blue-600">{index + 1}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{zone.zone}</p>
                  <p className="text-[10px] text-gray-500">Marge {zone.margin}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-900">{zone.revenue}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="clock" className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-gray-900">Temps par commune</h3>
        </div>
        <div className="space-y-2">
          {communeTimes.map((item) => (
            <div key={item.commune} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{item.commune}</p>
                <p className="text-[10px] text-gray-500">Moyenne pickup + delivery</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-gray-900">{item.time}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone(item.status)}`}>{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Icon name="chartBar" className="h-5 w-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">Partner Revenue Ranking</h3>
        </div>
        <div className="space-y-3">
          {partnerRanking.map((partner) => (
            <div key={partner.partner}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-bold text-gray-700">{partner.partner}</span>
                <span className="text-gray-900 font-extrabold">{partner.revenue}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${partner.share * 3}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
