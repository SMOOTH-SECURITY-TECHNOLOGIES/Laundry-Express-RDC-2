import { Icon } from '../../Icon';
import type { CampaignAnalytics } from '../../../lib/admin/campaigns-types';

export function CampaignAnalyticsDrawer({ data, onClose }: { data: CampaignAnalytics | null; onClose: () => void }) {
  if (!data) return null;
  const metrics = [
    { label: 'Messages envoyés', value: data.messagesSent.toLocaleString('fr-FR') },
    { label: 'Ouvertures', value: `${data.opens} (${data.openRate}%)` },
    { label: 'Clics', value: `${data.clicks} (${data.clickRate}%)` },
    { label: 'Conversions', value: `${data.conversions} (${data.conversionRate}%)` },
    { label: 'Revenus', value: `${data.revenue.toLocaleString('fr-FR')} $` },
    { label: 'ROI', value: `${data.roi}x` },
  ];
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-xl overflow-y-auto p-6">
        <div className="flex justify-between mb-6"><h2 className="text-lg font-bold">Analytics — {data.name}</h2><button type="button" onClick={onClose}><Icon name="xmark" className="w-5 h-5" /></button></div>
        <div className="grid grid-cols-2 gap-3">{metrics.map((m) => <div key={m.label} className="p-3 rounded-xl bg-gray-50 text-xs"><p className="text-gray-500">{m.label}</p><p className="font-bold mt-1">{m.value}</p></div>)}</div>
      </div>
    </div>
  );
}
