import React from 'react';
import { Icon } from '../Icon';

const topPerformers = [
  { nom: 'Koffi A.', score: 94, note: 4.9, sla: '98%' },
  { nom: 'Grace B.', score: 91, note: 4.8, sla: '96%' },
  { nom: 'David M.', score: 88, note: 4.7, sla: '95%' },
  { nom: 'Patrick N.', score: 85, note: 4.6, sla: '92%' },
  { nom: 'Aline K.', score: 82, note: 4.5, sla: '90%' },
];

const aSurveiller = [
  { nom: 'Jean K.', score: 71, incidents: 3 },
  { nom: 'Patrick M.', score: 68, incidents: 4 },
];

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const ChauffeurPerformance: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Top performers</h3>
          <button type="button" onClick={() => notifyAdminAction('Classement complet des chauffeurs ouvert.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Nom</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Note</th>
              <th className="pb-2 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers.map((d) => (
              <tr key={d.nom} className="border-b last:border-b-0">
                <td className="py-3 font-medium text-gray-900">{d.nom}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-8 h-1.5 rounded-full bg-green-500" />
                    {d.score}
                  </span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 text-yellow-500">
                    <Icon name="star" className="w-4 h-4" />
                    {d.note}
                  </span>
                </td>
                <td className="py-3 text-green-600 font-medium">{d.sla}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">À surveiller</h3>
          <button type="button" onClick={() => notifyAdminAction('Liste des chauffeurs à surveiller ouverte.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Nom</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Incidents</th>
            </tr>
          </thead>
          <tbody>
            {aSurveiller.map((d) => (
              <tr key={d.nom} className="border-b last:border-b-0">
                <td className="py-3 font-medium text-gray-900">{d.nom}</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-8 h-1.5 rounded-full bg-orange-400" />
                    {d.score}
                  </span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                    <Icon name="exclamation-circle" className="w-4 h-4" />
                    {d.incidents}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
