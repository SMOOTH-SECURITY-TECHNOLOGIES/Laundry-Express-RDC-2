import type { PromoFilters } from '../../../lib/admin/promotions-types';

export function PromotionsFiltersBar({ filters, onChange }: { filters: PromoFilters; onChange: (f: Partial<PromoFilters>) => void }) {
  const sel = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs';
  return (
    <div className="sticky top-[140px] z-[9] bg-[#F8FAFC] dark:bg-slate-950 py-2 -mx-6 px-6 flex flex-wrap gap-2 items-center">
      <input type="date" value={filters.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} className={sel} />
      <span className="text-gray-400 text-xs">—</span>
      <input type="date" value={filters.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} className={sel} />
      <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={sel}><option>Tous les statuts</option><option>Actif</option><option>Pause</option><option>Expiré</option></select>
      <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })} className={sel}><option>Tous les types</option><option>Pourcentage</option><option>Montant fixe</option><option>Livraison</option><option>Cashback</option></select>
      <select value={filters.zone} onChange={(e) => onChange({ zone: e.target.value })} className={sel}><option>Toutes les zones</option><option>Gombe</option><option>Limete</option><option>Ngaliema</option></select>
      <select value={filters.segment} onChange={(e) => onChange({ segment: e.target.value })} className={sel}><option>Tous les segments</option><option>Nouveaux</option><option>VIP</option><option>Dormants</option></select>
      <select value={filters.channel} onChange={(e) => onChange({ channel: e.target.value })} className={sel}><option>Tous les canaux</option><option>WhatsApp</option><option>SMS</option><option>Email</option></select>
    </div>
  );
}
