import type { EmailBounce } from '../../../lib/admin/email-types';

export function BounceCenter({ bounces }: { bounces: EmailBounce[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b"><h3 className="font-semibold">Bounce Center</h3></div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500"><tr><th className="px-4 py-3">Email</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Raison</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actions</th></tr></thead>
        <tbody>{bounces.map((b) => (
          <tr key={b.id} className="border-t">
            <td className="px-4 py-3">{b.email}</td><td className="px-4 py-3">{b.bounceTypeLabel}</td><td className="px-4 py-3 text-gray-500">{b.reason}</td>
            <td className="px-4 py-3 font-mono text-xs">{b.providerCode}</td><td className="px-4 py-3 text-xs">{b.occurredAt}</td>
            <td className="px-4 py-3 text-xs text-blue-600">Exclure</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
