import { Icon } from '../../Icon';
import type { IntegrationsKpis } from '../../../lib/admin/integrations-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function chg(n: number, suffix = '%') { return `${n >= 0 ? '+' : ''}${n}${suffix}`; }

export function ApiKpiCards({ kpis }: { kpis: IntegrationsKpis }) {
  const cards = [
    { label: 'API Calls Today', value: kpis.apiCallsToday.toLocaleString('fr-FR'), sub: chg(kpis.apiCallsTodayChange), icon: 'code-bracket' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.apiCallsTodaySparkline },
    { label: 'Webhooks Received', value: kpis.webhooksReceived.toLocaleString('fr-FR'), sub: chg(kpis.webhooksReceivedChange), icon: 'arrow-down-tray' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.webhooksReceivedSparkline },
    { label: 'Webhooks Sent', value: kpis.webhooksSent.toLocaleString('fr-FR'), sub: chg(kpis.webhooksSentChange), icon: 'paper-plane' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.webhooksSentSparkline },
    { label: 'Success Rate', value: `${kpis.successRate}%`, sub: chg(kpis.successRateChange), icon: 'check' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.successRateSparkline },
    { label: 'Failed Events', value: String(kpis.failedEvents), sub: chg(kpis.failedEventsChange), icon: 'warning' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.failedEventsSparkline },
    { label: 'Active Integrations', value: String(kpis.activeIntegrations), sub: `+${kpis.activeIntegrationsChange}`, icon: 'settings' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.activeIntegrationsSparkline },
    { label: 'API Keys', value: String(kpis.apiKeysCount), sub: `+${kpis.apiKeysChange}`, icon: 'shield' as const, color: '#EC4899', bg: 'bg-pink-100', tc: 'text-pink-600', spark: kpis.apiKeysSparkline },
    { label: 'Avg Response Time', value: `${kpis.avgResponseTimeMs} ms`, sub: `+${kpis.avgResponseTimeChange} ms`, icon: 'clock' as const, color: '#EAB308', bg: 'bg-yellow-100', tc: 'text-yellow-600', spark: kpis.avgResponseTimeSparkline },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-2xl border shadow-sm p-4">
          <div className="flex justify-between mb-2">
            <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center`}><Icon name={c.icon} className={`w-4 h-4 ${c.tc}`} /></div>
            <Spark data={c.spark} color={c.color} />
          </div>
          <p className="text-lg font-bold">{c.value}</p>
          <p className="text-[10px] text-gray-500">{c.label}</p>
          {c.sub && <span className="text-[10px] text-gray-400">{c.sub}</span>}
        </div>
      ))}
    </div>
  );
}
