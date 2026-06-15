const cls = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-purple-500';

interface Props {
  days: number; status: string; channel: string; partner: string; zone: string; segment: string;
  onDaysChange: (d: number) => void; onStatusChange: (v: string) => void; onChannelChange: (v: string) => void;
  onPartnerChange: (v: string) => void; onZoneChange: (v: string) => void; onSegmentChange: (v: string) => void;
}

export function CampaignFilters(p: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <select value={p.days} onChange={(e) => p.onDaysChange(Number(e.target.value))} className={cls} aria-label="Période">
        <option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option><option value={365}>12 mois</option>
      </select>
      <select value={p.status} onChange={(e) => p.onStatusChange(e.target.value)} className={cls}><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="paused">Pause</option><option value="scheduled">Programmé</option><option value="completed">Terminé</option><option value="draft">Brouillon</option></select>
      <select value={p.channel} onChange={(e) => p.onChannelChange(e.target.value)} className={cls}><option value="all">Tous les canaux</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option><option value="push">Push</option></select>
      <select value={p.partner} onChange={(e) => p.onPartnerChange(e.target.value)} className={cls}><option value="all">Tous les partenaires</option><option value="platform">Plateforme</option></select>
      <select value={p.zone} onChange={(e) => p.onZoneChange(e.target.value)} className={cls}><option value="all">Toutes les zones</option><option value="kinshasa">Kinshasa</option><option value="lubumbashi">Lubumbashi</option></select>
      <select value={p.segment} onChange={(e) => p.onSegmentChange(e.target.value)} className={cls}><option value="all">Tous les segments</option><option value="new_users">Nouveaux</option><option value="active">Actifs</option><option value="vip">VIP</option></select>
    </div>
  );
}
