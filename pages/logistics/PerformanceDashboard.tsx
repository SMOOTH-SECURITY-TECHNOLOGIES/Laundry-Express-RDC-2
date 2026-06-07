import React from 'react';
import { Icon } from '../../components/Icon';

interface PerformanceData {
  missionsPerDay: { day: string; count: number }[];
  avgCollectionTime: number;
  avgDeliveryTime: number;
  revenue: number;
  onTimeRate: number;
  totalMissions: number;
  completionRate: number;
}

interface PerformanceDashboardProps {
  data: PerformanceData;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ data }) => {
  const maxCount = Math.max(...data.missionsPerDay.map((d) => d.count));

  return (
    <div>
      <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2 mb-6">
        <Icon name="chartBar" className="w-5 h-5 text-brand-blue" />
        Tableau de performance
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-gray-500 font-medium">Total missions</p>
          <p className="text-2xl font-extrabold text-brand-dark mt-1">{data.totalMissions}</p>
        </div>
        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
          <p className="text-xs text-gray-500 font-medium">Taux complétion</p>
          <p className="text-2xl font-extrabold text-green-600 mt-1">{data.completionRate}%</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
          <p className="text-xs text-gray-500 font-medium">Revenu estimé</p>
          <p className="text-2xl font-extrabold text-orange-600 mt-1">{data.revenue.toLocaleString()} $</p>
        </div>
        <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
          <p className="text-xs text-gray-500 font-medium">Ponctualité</p>
          <p className="text-2xl font-extrabold text-violet-600 mt-1">{data.onTimeRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-4">Missions par jour</h3>
          <div className="flex items-end gap-2 h-40">
            {data.missionsPerDay.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-600">{day.count}</span>
                <div
                  className="w-full bg-brand-blue rounded-t-lg transition-all"
                  style={{ height: `${(day.count / maxCount) * 100}%`, minHeight: 4 }}
                />
                <span className="text-xs text-gray-500 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-4">Temps moyens</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Icon name="clock" className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">Collecte</p>
                  <p className="text-xs text-gray-500">Temps moyen</p>
                </div>
              </div>
              <p className="text-xl font-extrabold text-brand-blue">{data.avgCollectionTime} min</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                  <Icon name="truck" className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">Livraison</p>
                  <p className="text-xs text-gray-500">Temps moyen</p>
                </div>
              </div>
              <p className="text-xl font-extrabold text-green-600">{data.avgDeliveryTime} min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
