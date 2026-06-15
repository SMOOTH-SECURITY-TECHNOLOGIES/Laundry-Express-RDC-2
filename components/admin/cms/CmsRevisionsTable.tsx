import type { CmsRevision } from '../../../lib/admin/cms-types';

export function CmsRevisionsTable({ revisions }: { revisions: CmsRevision[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Révisions récentes</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-500 uppercase border-b"><th className="text-left py-2">Page</th><th className="text-left py-2">Action</th><th className="text-left py-2">Utilisateur</th><th className="text-right py-2">Date</th></tr></thead>
        <tbody className="divide-y">
          {revisions.map((r) => (
            <tr key={r.id}><td className="py-2">{r.pageTitle}</td><td className="py-2">{r.action}</td><td className="py-2">{r.userName}</td><td className="py-2 text-right text-xs text-gray-500">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '—'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
