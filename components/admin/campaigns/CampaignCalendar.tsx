import { Icon } from '../../Icon';
import type { CampaignCalendarEvent } from '../../../lib/admin/campaigns-types';

export function CampaignCalendar({ events, view = 'week' }: { events: CampaignCalendarEvent[]; view?: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Icon name="calendar" className="w-5 h-5 text-blue-600" /><h3 className="text-sm font-semibold">Campagnes programmées</h3></div>
        <span className="text-[10px] text-gray-400 capitalize">Vue {view}</span>
      </div>
      {events.length === 0 ? <p className="text-xs text-gray-500">Aucune campagne programmée.</p> : (
        <div className="space-y-2">{events.map((e) => (
          <div key={e.id} className="flex items-center gap-3 text-xs p-2 rounded-lg border">
            <div className="text-center w-12"><p className="font-bold">{e.date.slice(8)}</p><p className="text-gray-400">{e.date.slice(5, 7)}</p></div>
            <div className="flex-1"><p className="font-medium">{e.title}</p><p className="text-gray-400">{e.time} • {e.channel} • {e.audience}</p></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
