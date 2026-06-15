import type { DriverDocument } from '../../../lib/admin/drivers-types';

const STATUS_STYLES = {
  valid: 'bg-green-100 text-green-700',
  expired: 'bg-red-100 text-red-700',
  renew: 'bg-orange-100 text-orange-700',
};

export function DriverDocumentsPanel({ documents }: { documents: DriverDocument[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Documents</h4>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">{doc.label}</p>
              <p className="text-[10px] text-gray-400">Expire : {doc.expiryDate}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[doc.status]}`}>
              {doc.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
