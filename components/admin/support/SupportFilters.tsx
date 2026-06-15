import { Icon } from '../../Icon';

interface Props {
  statusFilter: string; priorityFilter: string; categoryFilter: string;
  agentFilter: string; channelFilter: string; partnerFilter: string; slaFilter: string;
  onFilter: (type: string, value: string) => void;
}

export function SupportFilters(p: Props) {
  const sel = 'px-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-800';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="text" readOnly value="01/06/2026 - 07/06/2026" className={`${sel} w-44`} />
      <select value={p.statusFilter} onChange={(e) => p.onFilter('status', e.target.value)} className={sel}><option value="all">Tous les statuts</option><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="escalated">Escaladé</option><option value="resolved">Résolu</option></select>
      <select value={p.priorityFilter} onChange={(e) => p.onFilter('priority', e.target.value)} className={sel}><option value="all">Priorité</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Critical</option></select>
      <select value={p.categoryFilter} onChange={(e) => p.onFilter('category', e.target.value)} className={sel}><option value="all">Catégorie</option><option value="delivery">Livraison</option><option value="payment">Paiement</option><option value="refund">Remboursement</option><option value="quality">Qualité</option></select>
      <select value={p.agentFilter} onChange={(e) => p.onFilter('agent', e.target.value)} className={sel}><option value="all">Agent</option></select>
      <select value={p.channelFilter} onChange={(e) => p.onFilter('channel', e.target.value)} className={sel}><option value="all">Canal</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="app">App</option></select>
      <select value={p.partnerFilter} onChange={(e) => p.onFilter('partner', e.target.value)} className={sel}><option value="all">Partenaire</option></select>
      <select value={p.slaFilter} onChange={(e) => p.onFilter('sla', e.target.value)} className={sel}><option value="all">SLA</option><option value="within">Dans SLA</option><option value="at_risk">À risque</option><option value="breached">Hors SLA</option></select>
      <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium"><Icon name="settings" className="w-3.5 h-3.5" /> Filtres avancés</button>
    </div>
  );
}
