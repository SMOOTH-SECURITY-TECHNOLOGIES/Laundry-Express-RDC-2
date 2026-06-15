import type { TopEvent } from '../../../lib/admin/notifications-types';

export function TopEventsTable({ events }: { events: TopEvent[] }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Top événements</h3>
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-gray-500 uppercase"><th className="text-left pb-2">Événement</th><th className="text-right pb-2">Envois</th></tr></thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.eventType} className="border-t"><td className="py-2">{e.label}</td><td className="py-2 text-right font-semibold">{e.sends.toLocaleString('fr-FR')}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
