import React from 'react';

const partners = [
  { partenaire: 'Prestige Pressing', score: 92, sla: '98%', note: 4.9, delai: '2h15', litiges: 1 },
  { partenaire: 'Speed Clean', score: 88, sla: '95%', note: 4.7, delai: '1h50', litiges: 2 },
  { partenaire: 'Eco Pressing', score: 85, sla: '92%', note: 4.6, delai: '2h30', litiges: 2 },
  { partenaire: 'Quick Wash', score: 78, sla: '88%', note: 4.5, delai: '3h00', litiges: 3 },
  { partenaire: 'Fresh Laundry', score: 64, sla: '79%', note: 4.1, delai: '3h35', litiges: 5 },
];

const getScoreTone = (score: number) => {
  if (score >= 90) return { bar: 'bg-green-500', chip: 'bg-green-100 text-green-700', label: 'Excellent' };
  if (score >= 70) return { bar: 'bg-orange-500', chip: 'bg-orange-100 text-orange-700', label: 'À surveiller' };
  return { bar: 'bg-red-500', chip: 'bg-red-100 text-red-700', label: 'Critique' };
};

const notifyAdminAction = (message: string) => {
  window.dispatchEvent(new CustomEvent('admin-action', { detail: message }));
};

export const PartnerHealthScore: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Partner Health (Top 5)</h3>
        <button type="button" onClick={() => notifyAdminAction('Liste complète des partenaires ouverte.')} className="text-sm text-brand-blue hover:underline">Voir tout</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2 font-medium">Partenaire</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">SLA</th>
              <th className="pb-2 font-medium">Note</th>
              <th className="pb-2 font-medium">Délai moyen</th>
              <th className="pb-2 font-medium">Litiges</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => {
              const tone = getScoreTone(p.score);
              return (
                <tr key={p.partenaire} className="border-b last:border-b-0">
                  <td className="py-3 font-medium text-gray-900">{p.partenaire}</td>
                  <td className="py-3">
                    <div className="flex min-w-[190px] items-center gap-2">
                      <span className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${p.score}%` }} />
                      </span>
                      <span className="text-xs font-bold text-gray-700">{p.score}/100</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.chip}`}>{tone.label}</span>
                    </div>
                  </td>
                  <td className={`py-3 font-medium ${p.score >= 90 ? 'text-green-600' : p.score >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{p.sla}</td>
                  <td className="py-3 text-yellow-500 font-medium">{p.note}</td>
                  <td className="py-3 text-gray-700">{p.delai}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${p.litiges <= 1 ? 'bg-green-100 text-green-700' : p.litiges <= 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {p.litiges}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
