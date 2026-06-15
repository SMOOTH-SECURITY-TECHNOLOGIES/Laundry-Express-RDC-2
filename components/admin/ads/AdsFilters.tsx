import type { AdsFilters } from '../../../lib/admin/ads-types';

export function AdsFiltersBar({ filters, onChange }: { filters: AdsFilters; onChange: (f: Partial<AdsFilters>) => void }) {
  const sel = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs';
  return (
    <div className="sticky top-[140px] z-[9] bg-[#F8FAFC] dark:bg-slate-950 py-2 -mx-6 px-6 flex flex-wrap gap-2 items-center">
      <input type="date" value={filters.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} className={sel} aria-label="Date début" />
      <span className="text-gray-400 text-xs">—</span>
      <input type="date" value={filters.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} className={sel} aria-label="Date fin" />
      <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className={sel} aria-label="Statut">
        <option>Tous les statuts</option><option>Actif</option><option>Pause</option><option>Brouillon</option><option>Archivé</option>
      </select>
      <select value={filters.type} onChange={(e) => onChange({ type: e.target.value })} className={sel} aria-label="Type">
        <option>Tous les types</option><option>Image</option><option>Vidéo</option><option>Carousel</option>
      </select>
      <select value={filters.zone} onChange={(e) => onChange({ zone: e.target.value })} className={sel} aria-label="Zone">
        <option>Toutes les zones</option><option>Gombe</option><option>Ngaliema</option><option>Limete</option><option>Masina</option><option>Bandalungwa</option><option>Kintambo</option><option>Kalamu</option>
      </select>
      <select value={filters.partner} onChange={(e) => onChange({ partner: e.target.value })} className={sel} aria-label="Partenaire">
        <option>Tous les partenaires</option>
      </select>
      <select value={filters.channel} onChange={(e) => onChange({ channel: e.target.value })} className={sel} aria-label="Canal">
        <option>Tous les canaux</option><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>WhatsApp</option><option>Google</option><option>Email</option><option>SMS</option>
      </select>
      <select value={filters.campaign} onChange={(e) => onChange({ campaign: e.target.value })} className={sel} aria-label="Campagne">
        <option>Toutes les campagnes</option>
      </select>
    </div>
  );
}
