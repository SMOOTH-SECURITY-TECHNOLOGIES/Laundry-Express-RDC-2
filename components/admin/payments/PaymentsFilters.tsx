import { Icon } from '../../Icon';
import type { PaymentFilters } from '../../../lib/admin/payments-types';

const STATUSES = ['Tous les statuts', 'Réussi', 'En attente', 'Echoué', 'Remboursé', 'Contesté'];
const METHODS = ['Tous les moyens', 'Mobile Money', 'Carte bancaire', 'Espèces', 'Paiement chauffeur'];
const ZONES = ['Toutes les zones', 'Gombe', 'Limete', 'Ngaliema', 'Kintambo', 'Bandalungwa', 'Masina'];
const PARTNERS = ['Tous les partenaires', 'Prestige Pressing', 'Eco Wash', 'Clean Express'];

export function PaymentsFiltersBar({ filters, onChange }: { filters: PaymentFilters; onChange: (f: Partial<PaymentFilters>) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Icon name="calendar" className="w-4 h-4 text-gray-400" />
        <input type="date" value={filters.dateStart} onChange={(e) => onChange({ dateStart: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
        <span className="text-gray-400 text-xs">—</span>
        <input type="date" value={filters.dateEnd} onChange={(e) => onChange({ dateEnd: e.target.value })} className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
      </div>
      <select value={filters.status} onChange={(e) => onChange({ status: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={filters.method} onChange={(e) => onChange({ method: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">{METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
      <select value={filters.zone} onChange={(e) => onChange({ zone: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">{ZONES.map((z) => <option key={z} value={z}>{z}</option>)}</select>
      <select value={filters.partner} onChange={(e) => onChange({ partner: e.target.value })} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs">{PARTNERS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
      <input type="number" placeholder="Min $" value={filters.minAmount} onChange={(e) => onChange({ minAmount: e.target.value })} className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
      <input type="number" placeholder="Max $" value={filters.maxAmount} onChange={(e) => onChange({ maxAmount: e.target.value })} className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
      <input placeholder="Référence" value={filters.reference} onChange={(e) => onChange({ reference: e.target.value })} className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
      <input placeholder="Order ID" value={filters.orderId} onChange={(e) => onChange({ orderId: e.target.value })} className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs" />
    </div>
  );
}
