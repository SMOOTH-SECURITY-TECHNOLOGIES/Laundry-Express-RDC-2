import { Icon } from '../../Icon';

export function ReviewsFilters({ typeFilter, statusFilter, channelFilter, cityFilter, partnerFilter, driverFilter, onFilter }: {
  typeFilter: string; statusFilter: string; channelFilter: string; cityFilter: string;
  partnerFilter: string; driverFilter: string; onFilter: (t: string, v: string) => void;
}) {
  const sel = 'px-3 py-2 rounded-xl border text-xs bg-white';
  return (
    <div className="flex flex-wrap gap-2">
      <input readOnly value="01/06/2026 - 07/06/2026" className={`${sel} w-44`} />
      <select value={typeFilter} onChange={(e) => onFilter('type', e.target.value)} className={sel}><option value="all">Tous les types</option><option value="order">Commande</option><option value="driver">Chauffeur</option><option value="delivery">Livraison</option><option value="payment">Paiement</option></select>
      <select value={statusFilter} onChange={(e) => onFilter('status', e.target.value)} className={sel}><option value="all">Tous les statuts</option><option value="public">Public</option><option value="pending">En attente</option><option value="flagged">Signalé</option><option value="investigation">Enquête</option></select>
      <select value={channelFilter} onChange={(e) => onFilter('channel', e.target.value)} className={sel}><option value="all">Tous les canaux</option><option value="whatsapp">WhatsApp</option><option value="app">Application</option><option value="web">Site web</option></select>
      <select value={cityFilter} onChange={(e) => onFilter('city', e.target.value)} className={sel}><option value="all">Toutes les villes</option><option value="kinshasa">Kinshasa</option></select>
      <select value={partnerFilter} onChange={(e) => onFilter('partner', e.target.value)} className={sel}><option value="all">Partenaire</option></select>
      <select value={driverFilter} onChange={(e) => onFilter('driver', e.target.value)} className={sel}><option value="all">Chauffeur</option></select>
      <button type="button" className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs"><Icon name="settings" className="w-3.5 h-3.5" /> Filtres avancés</button>
    </div>
  );
}
