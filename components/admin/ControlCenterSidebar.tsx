import { Icon } from '../Icon';

interface ControlCenterSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

interface NavItem {
  label: string;
  icon: string;
  badge?: number;
  live?: boolean;
  isNew?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const controlCenterSections: NavSection[] = [
  {
    title: 'PILOTAGE',
    items: [
      { label: 'Dashboard', icon: 'home' },
      { label: 'Truth Dashboard', icon: 'chartBar' },
      { label: 'Order Truth', icon: 'document-text' },
      { label: 'Anomalies', icon: 'warning', badge: 6 },
      { label: 'Investigate', icon: 'magnifying-glass-plus' },
      { label: 'Analytics', icon: 'chartBar' },
      { label: 'Activity Log', icon: 'clock-history' },
    ],
  },
  {
    title: 'MARKETPLACE',
    items: [
      { label: 'Partenaires', icon: 'building' },
      { label: 'Candidatures', icon: 'document', badge: 5 },
      { label: 'Services', icon: 'sparkles' },
      { label: 'Abonnements', icon: 'badge-check' },
    ],
  },
  {
    title: 'COMMANDES',
    items: [
      { label: 'Commandes', icon: 'shoppingBag', badge: 12 },
      { label: 'Litiges', icon: 'exclamation-circle' },
    ],
  },
  {
    title: 'LOGISTIQUE',
    items: [
      { label: 'Cockpit Dispatcher', icon: 'computer', live: true },
      { label: 'Missions', icon: 'truck' },
      { label: 'Chauffeurs', icon: 'user' },
      { label: 'Zones', icon: 'mapPin' },
      { label: 'SLA Center', icon: 'clock' },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Revenus', icon: 'currencyDollar' },
      { label: 'Commissions', icon: 'wallet' },
      { label: 'Remboursements', icon: 'arrow-path' },
      { label: 'Paiements', icon: 'credit-card' },
      { label: 'Revenue Leakage', icon: 'exclamation-circle' },
    ],
  },
  {
    title: 'CROISSANCE',
    items: [
      { label: 'Promotions', icon: 'gift', isNew: true },
      { label: 'Publicités', icon: 'megaphone' },
      { label: 'Fidélité', icon: 'heart' },
      { label: 'Parrainage', icon: 'users' },
      { label: 'Campagnes', icon: 'paper-plane' },
    ],
  },
  {
    title: 'CLIENTS',
    items: [
      { label: 'Utilisateurs', icon: 'users' },
      { label: 'Support', icon: 'lifebuoy', badge: 12 },
      { label: 'Avis & Notes', icon: 'star' },
      { label: 'Réclamations', icon: 'chatBubble' },
    ],
  },
  {
    title: 'CONTENU',
    items: [
      { label: 'Pages & CMS', icon: 'document-text' },
      { label: 'Bannières', icon: 'photo' },
      { label: 'Blog', icon: 'pencil' },
      { label: 'Notifications', icon: 'bell' },
    ],
  },
  {
    title: 'INTÉGRATIONS',
    items: [
      { label: 'Passerelles paiement', icon: 'credit-card' },
      { label: 'WhatsApp', icon: 'whatsapp' },
      { label: 'SMS', icon: 'device-phone-mobile' },
      { label: 'Email', icon: 'envelope' },
      { label: 'API & Webhooks', icon: 'code-bracket' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Gestion Admin', icon: 'shield-check' },
      { label: 'Permissions', icon: 'shield' },
      { label: 'Journal admin', icon: 'clock-history' },
    ],
  },
];

export const ControlCenterSidebar = ({ activeItem, onItemClick }: ControlCenterSidebarProps) => {
  return (
    <aside className="hidden lg:flex w-[260px] h-screen fixed left-0 top-0 bg-[#081A44] flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
          <Icon name="shield-check" className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-sm tracking-wide leading-tight">LAUNDRY EXPRESS</span>
          <span className="text-slate-400 text-[10px] tracking-wider">CONTROL CENTER</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3">
        {controlCenterSections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1 text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeItem === item.label;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => onItemClick(item.label)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon name={item.icon as any} className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {'badge' in item && item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-500/90 text-white min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                      {'live' in item && item.live && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-500/90 text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      )}
                      {'isNew' in item && item.isNew && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-500/90 text-white">
                          Nouveau
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};
