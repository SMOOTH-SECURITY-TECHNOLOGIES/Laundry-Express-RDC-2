import type { InvoiceKpis } from '../../../lib/admin/subscriptions-types';

const cards = [
  { key: 'issued', label: 'Factures émises', icon: 'document-text', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'paid', label: 'Payées', icon: 'check', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'overdue', label: 'En retard', icon: 'warning', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'collected', label: 'Montant recouvré', icon: 'currencyDollar', color: 'text-amber-600', bg: 'bg-amber-50' },
] as const;

function formatValue(key: string, value: number): string {
  if (key === 'collected') return `$${value.toLocaleString()}`;
  return value.toLocaleString();
}

export function InvoiceWidget({ data }: { data: InvoiceKpis }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">Facturation</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.key} className="flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${c.color}`}>
                {c.icon === 'document-text' && <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />}
                {c.icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />}
                {c.icon === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.374c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />}
                {c.icon === 'currencyDollar' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182.95-.715 2.37-.927 3.684-.577m-2.182.359v.003c.537.318 1.15.535 1.8.535h.001c.65 0 1.262-.217 1.762-.608-.484.343-1.017.535-1.586.535h-.001c-.65 0-1.262-.217-1.762-.608z" />}
              </svg>
            </div>
            <span className="text-xs text-gray-500">{c.label}</span>
            <span className="text-xl font-bold text-gray-900">{formatValue(c.key, data[c.key as keyof InvoiceKpis])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
