import { Icon } from '../../Icon';
import type { FinanceFilters } from '../../../lib/admin/finance-types';

const SERVICES = ['Tous les services', 'Lavage', 'Collecte', 'Livraison', 'Express', 'Abonnement'];
const ZONES = ['Toutes les zones', 'Gombe', 'Ngaliema', 'Limete', 'Masina', 'Kalamu', 'Bandalungwa', 'Kintambo'];
const PARTNERS = ['Tous les partenaires', 'Prestige Pressing', 'Eco Wash', 'Clean Express', 'Laverie Smart', 'Wash Pro'];

interface FinanceFiltersBarProps {
  filters: FinanceFilters;
  onChange: (f: Partial<FinanceFilters>) => void;
  onAdvanced: () => void;
}

export function FinanceFiltersBar({ filters, onChange, onAdvanced }: FinanceFiltersBarProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Icon name="calendar" className="w-4 h-4 text-gray-400" />
        <input type="date" value={filters.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
        <span className="text-gray-400 text-xs">—</span>
        <input type="date" value={filters.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
      </div>
      <select value={filters.service} onChange={(e) => onChange({ service: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">
        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.zone} onChange={(e) => onChange({ zone: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">
        {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
      </select>
      <select value={filters.partner} onChange={(e) => onChange({ partner: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">
        {PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <button type="button" onClick={onAdvanced} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800">
        <Icon name="settings" className="w-3.5 h-3.5" /> Filtres avancés
      </button>
    </div>
  );
}
