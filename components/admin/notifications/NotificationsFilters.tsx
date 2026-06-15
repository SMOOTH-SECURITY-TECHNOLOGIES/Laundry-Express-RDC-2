export function NotificationsFilters({ status, channel, event, audience, onStatus, onChannel, onEvent, onAudience }: {
  status: string; channel: string; event: string; audience: string;
  onStatus: (v: string) => void; onChannel: (v: string) => void; onEvent: (v: string) => void; onAudience: (v: string) => void;
}) {
  const sel = 'px-3 py-2 border rounded-xl text-sm bg-white';
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input type="date" className={sel} aria-label="Date début" />
      <span className="text-gray-400 text-sm">—</span>
      <input type="date" className={sel} aria-label="Date fin" />
      <select value={status} onChange={(e) => onStatus(e.target.value)} className={sel}><option value="all">Tous les statuts</option><option value="delivered">Livré</option><option value="pending">En attente</option><option value="failed">Échoué</option><option value="opened">Ouvert</option><option value="clicked">Cliqué</option></select>
      <select value={channel} onChange={(e) => onChannel(e.target.value)} className={sel}><option value="all">Tous les canaux</option><option value="push">Push</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option></select>
      <select value={event} onChange={(e) => onEvent(e.target.value)} className={sel}><option value="all">Tous les événements</option><option value="confirmation_commande">Confirmation commande</option><option value="chauffeur_affecte">Chauffeur affecté</option><option value="paiement_reussi">Paiement réussi</option><option value="promotion">Promotion</option></select>
      <select value={audience} onChange={(e) => onAudience(e.target.value)} className={sel}><option value="all">Toutes les audiences</option><option value="Clients">Clients</option><option value="Chauffeurs">Chauffeurs</option><option value="Partenaires">Partenaires</option></select>
    </div>
  );
}
