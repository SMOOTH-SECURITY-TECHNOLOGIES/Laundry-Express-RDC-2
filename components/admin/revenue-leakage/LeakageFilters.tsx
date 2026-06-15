import type { LeakageFilters } from '../../../lib/admin/revenue-leakage-types';

export function LeakageFiltersBar({ filters, onChange }: { filters: LeakageFilters; onChange: (f: Partial<LeakageFilters>) => void }) {
  const sel = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs';
  return (
    <div className="sticky top-[140px] z-[9] bg-[#F8FAFC] dark:bg-slate-950 py-2 -mx-6 px-6 flex flex-wrap gap-2 items-center">
      <input type="date" value={filters.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} className={sel} />
      <span className="text-gray-400 text-xs">—</span>
      <input type="date" value={filters.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} className={sel} />
      <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={sel}><option>Tous les statuts</option><option>Open</option><option>Investigating</option><option>Resolved</option></select>
      <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })} className={sel}><option>Tous les types</option><option>Paiement orphelin</option><option>Commission manquante</option><option>Collecte non facturée</option></select>
      <select value={filters.zone} onChange={(e) => onChange({ zone: e.target.value })} className={sel}><option>Toutes les zones</option><option>Gombe</option><option>Limete</option><option>Ngaliema</option></select>
      <select value={filters.partner} onChange={(e) => onChange({ partner: e.target.value })} className={sel}><option>Tous les partenaires</option><option>Prestige Pressing</option><option>Clean Express</option></select>
      <input placeholder="Montant min" value={filters.minAmount} onChange={(e) => onChange({ minAmount: e.target.value })} className={`${sel} w-24`} />
      <input placeholder="Montant max" value={filters.maxAmount} onChange={(e) => onChange({ maxAmount: e.target.value })} className={`${sel} w-24`} />
      <input placeholder="Order ID" value={filters.orderId} onChange={(e) => onChange({ orderId: e.target.value })} className={`${sel} w-28`} />
      <input placeholder="Payment ID" value={filters.paymentId} onChange={(e) => onChange({ paymentId: e.target.value })} className={`${sel} w-28`} />
    </div>
  );
}
