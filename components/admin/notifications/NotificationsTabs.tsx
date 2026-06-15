const TABS = ['all', 'push', 'whatsapp', 'sms', 'email'] as const;
const LABELS: Record<string, string> = { all: 'Toutes les notifications', push: 'Push', whatsapp: 'WhatsApp', sms: 'SMS', email: 'Email' };

export function NotificationsTabs({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
      {TABS.map((t) => (
        <button key={t} type="button" onClick={() => onChange(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold ${active === t ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
