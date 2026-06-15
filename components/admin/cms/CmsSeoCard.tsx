export function CmsSeoCard({ score, checklist }: { score: number; checklist: Array<{ label: string; done: number; total: number }> }) {
  const label = score >= 80 ? 'Bon' : score >= 60 ? 'Moyen' : 'À améliorer';
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Performance SEO</h3>
      <div className="text-center mb-4">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-gray-400">/100</span>
        <p className={`text-sm font-medium ${color}`}>{label}</p>
      </div>
      <ul className="space-y-2 text-sm">
        {checklist.map((c) => (
          <li key={c.label} className="flex justify-between">
            <span>{c.label}</span>
            <span className="font-medium">{c.done}/{c.total}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
