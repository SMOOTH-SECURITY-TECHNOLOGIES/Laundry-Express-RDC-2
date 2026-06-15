import type { RootCause } from '../../../lib/admin/claims-types';

export function RootCausesTable({ causes }: { causes: RootCause[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Analyse des causes racines</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-2">Problème</th><th className="text-right py-2">Occurrences</th><th className="text-right py-2">Tendance</th><th className="text-right py-2">Impact</th></tr></thead>
        <tbody className="divide-y">
          {causes.map((c) => (
            <tr key={c.cause}>
              <td className="py-2">{c.cause}</td>
              <td className="text-right">{c.occurrences}</td>
              <td className={`text-right ${c.trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>{c.trend >= 0 ? '+' : ''}{c.trend}%</td>
              <td className="text-right"><span className={`px-2 py-0.5 rounded text-xs ${c.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.impact}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
