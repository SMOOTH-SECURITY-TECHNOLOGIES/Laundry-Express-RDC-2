import React from 'react';
import { Icon } from '../Icon';

const backlog = [
  { id: 'M-7845', client: 'Jean Tshibangu', time: '10:45', driver: 'Koffi A. (1.2 km)', commune: 'Gombe' },
  { id: 'M-7846', client: 'Marie Kambale', time: '11:00', driver: 'Grace B. (2.1 km)', commune: 'Kintambo' },
  { id: 'M-7847', client: 'David Mulumba', time: '11:15', driver: 'Patrick N. (1.8 km)', commune: 'Bandalungwa' },
  { id: 'M-7848', client: 'Sarah Mwangi', time: '11:30', driver: 'David M. (2.3 km)', commune: 'Masina' },
  { id: 'M-7849', client: 'Patrick Nzinga', time: '11:45', driver: 'Aline K. (1.5 km)', commune: 'Limete' },
];

const activeMissions = [
  { id: 'M-7839', driver: 'Koffi A.', status: 'En route', statusColor: 'bg-blue-100 text-blue-700', eta: '15 min' },
  { id: 'M-7840', driver: 'Grace B.', status: 'Collecte', statusColor: 'bg-orange-100 text-orange-700', eta: '8 min' },
  { id: 'M-7841', driver: 'Jean K.', status: 'Retard 12 min', statusColor: 'bg-red-100 text-red-700', eta: '20 min' },
  { id: 'M-7842', driver: 'David M.', status: 'Livraison', statusColor: 'bg-purple-100 text-purple-700', eta: '5 min' },
  { id: 'M-7843', driver: 'Patrick N.', status: 'En route', statusColor: 'bg-blue-100 text-blue-700', eta: '18 min' },
];

const kpis = [
  { label: 'Missions ouvertes', value: '24', sub: 'À assigner', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Missions actives', value: '38', sub: '63% du flux', color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Chauffeurs dispo', value: '18/32', sub: 'Réseau actif', color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Gains estimés', value: '2 450 $', sub: '92% à temps', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export function CockpitDispatcher() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon name="map" className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-900">Cockpit Dispatcher</h2>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-xl p-4 ${kpi.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Backlog */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Backlog à dispatcher</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                24
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Mission</th>
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Heure</th>
                  <th className="pb-2 font-medium">Chauffeur recommandé</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {backlog.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-mono text-xs font-semibold text-gray-900">{item.id}</td>
                    <td className="py-3 text-gray-700">{item.client}</td>
                    <td className="py-3 text-gray-500">{item.time}</td>
                    <td className="py-3 text-gray-600 text-xs">{item.driver}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => notifyAdminAction(`Mission ${item.id} assignée à ${item.driver}.`)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Assigner
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => notifyAdminAction('Vue Missions ouverte depuis le cockpit dispatcher.')}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Voir toutes les missions ouvertes →
          </button>
        </div>

        {/* Right: Active Missions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Missions actives</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Mission</th>
                  <th className="pb-2 font-medium">Chauffeur</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">ETA</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeMissions.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-mono text-xs font-semibold text-gray-900">{item.id}</td>
                    <td className="py-3 text-gray-700">{item.driver}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{item.eta}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => notifyAdminAction(`Contact chauffeur demandé pour ${item.driver}.`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Contacter"
                        >
                          <Icon name="phone" className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => notifyAdminAction(`Réassignation préparée pour ${item.id}.`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Réassigner"
                        >
                          <Icon name="arrow-path" className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => notifyAdminAction(`Localisation ouverte pour ${item.id}.`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Voir"
                        >
                          <Icon name="mapPin" className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
