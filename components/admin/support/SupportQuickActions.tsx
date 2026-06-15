import { Icon } from '../../Icon';

const ACTIONS = [
  { icon: 'plus', label: 'Nouveau ticket' },
  { icon: 'chatBubble', label: 'Réponse rapide' },
  { icon: 'users', label: 'Assigner automatiquement' },
  { icon: 'clock', label: 'Voir tickets en retard', danger: true },
];

export function SupportQuickActions({ onNewTicket }: { onNewTicket?: () => void }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4"><Icon name="sparkles" className="w-5 h-5 text-amber-500" /><h3 className="text-sm font-semibold">Actions rapides</h3></div>
      <div className="space-y-2">{ACTIONS.map((a) => (
        <button key={a.label} type="button" onClick={a.label === 'Nouveau ticket' ? onNewTicket : undefined} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 text-left ${a.danger ? 'text-red-600' : ''}`}>
          <Icon name={a.icon as 'plus'} className="w-4 h-4" /> {a.label}
        </button>
      ))}</div>
    </div>
  );
}
