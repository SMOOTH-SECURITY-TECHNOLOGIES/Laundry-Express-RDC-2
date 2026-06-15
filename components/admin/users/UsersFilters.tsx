import { Icon } from '../../Icon';

interface Props {
  statusFilter: string;
  roleFilter: string;
  zoneFilter: string;
  partnerFilter: string;
  loyaltyFilter: string;
  channelFilter: string;
  onFilter: (type: string, value: string) => void;
}

export function UsersFilters({ statusFilter, roleFilter, zoneFilter, partnerFilter, loyaltyFilter, channelFilter, onFilter }: Props) {
  const sel = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 text-xs bg-white dark:bg-slate-800';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="text" readOnly value="01/06/2026 - 07/06/2026" className={`${sel} w-44`} />
      <select value={statusFilter} onChange={(e) => onFilter('status', e.target.value)} className={sel}>
        <option value="all">Tous les statuts</option>
        <option value="active">Actif</option>
        <option value="inactive">Inactif</option>
        <option value="suspended">Suspendu</option>
        <option value="pending_verification">En attente</option>
      </select>
      <select value={roleFilter} onChange={(e) => onFilter('role', e.target.value)} className={sel}>
        <option value="all">Tous les rôles</option>
        <option value="customer">Client</option>
        <option value="partner_owner">Partenaire</option>
        <option value="driver">Chauffeur</option>
        <option value="admin">Admin</option>
        <option value="logistics_manager">Logistique</option>
      </select>
      <select value={zoneFilter} onChange={(e) => onFilter('zone', e.target.value)} className={sel}>
        <option value="all">Toutes les zones</option>
        <option value="gombe">Kinshasa / Gombe</option>
        <option value="ngaliema">Kinshasa / Ngaliema</option>
        <option value="limete">Kinshasa / Limete</option>
      </select>
      <select value={partnerFilter} onChange={(e) => onFilter('partner', e.target.value)} className={sel}>
        <option value="all">Tous les partenaires</option>
      </select>
      <select value={loyaltyFilter} onChange={(e) => onFilter('loyalty', e.target.value)} className={sel}>
        <option value="all">Fidélité</option>
        <option value="with_points">Avec points</option>
        <option value="without_points">Sans points</option>
      </select>
      <select value={channelFilter} onChange={(e) => onFilter('channel', e.target.value)} className={sel}>
        <option value="all">Canal acquisition</option>
        <option value="app">Application</option>
        <option value="web">Web</option>
        <option value="referral">Parrainage</option>
      </select>
      <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-medium hover:bg-gray-50">
        <Icon name="settings" className="w-3.5 h-3.5" /> Filtres avancés
      </button>
    </div>
  );
}
