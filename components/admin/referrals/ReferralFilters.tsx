interface Props {
  days: number;
  status: string;
  channel: string;
  zone: string;
  partner: string;
  onDaysChange: (d: number) => void;
  onStatusChange: (v: string) => void;
  onChannelChange: (v: string) => void;
  onZoneChange: (v: string) => void;
  onPartnerChange: (v: string) => void;
}

const selectCls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-purple-500';

export function ReferralFilters({ days, status, channel, zone, partner, onDaysChange, onStatusChange, onChannelChange, onZoneChange, onPartnerChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <select value={days} onChange={(e) => onDaysChange(Number(e.target.value))} className={selectCls} aria-label="Période">
        <option value={7}>7 derniers jours</option>
        <option value={30}>30 derniers jours</option>
        <option value={90}>90 derniers jours</option>
      </select>
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectCls} aria-label="Statut">
        <option value="all">Tous les statuts</option>
        <option value="converted">Converti</option>
        <option value="pending">En attente</option>
        <option value="suspect">Suspect</option>
        <option value="rejected">Rejeté</option>
      </select>
      <select value={channel} onChange={(e) => onChannelChange(e.target.value)} className={selectCls} aria-label="Canal">
        <option value="all">Tous les canaux</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="email">Email</option>
        <option value="sms">SMS</option>
        <option value="social">Réseau social</option>
        <option value="link">Lien direct</option>
      </select>
      <select value={zone} onChange={(e) => onZoneChange(e.target.value)} className={selectCls} aria-label="Zone">
        <option value="all">Toutes les zones</option>
        <option value="kinshasa">Kinshasa</option>
        <option value="lubumbashi">Lubumbashi</option>
        <option value="goma">Goma</option>
      </select>
      <select value={partner} onChange={(e) => onPartnerChange(e.target.value)} className={selectCls} aria-label="Partenaire">
        <option value="all">Tous les partenaires</option>
        <option value="platform">Plateforme</option>
        <option value="partner">Partenaires tiers</option>
      </select>
    </div>
  );
}
