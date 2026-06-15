import { Icon } from '../../Icon';
import type { WhatsappKpis } from '../../../lib/admin/whatsapp-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

function fmtChange(n: number, suffix = '%') {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n}${suffix}`;
}

export function WhatsappKpiCards({ kpis }: { kpis: WhatsappKpis }) {
  const cards = [
    { label: 'Conversations ouvertes', value: kpis.openConversations.toLocaleString('fr-FR'), sub: fmtChange(kpis.openConversationsChange), icon: 'chatBubble' as const, color: '#3B82F6', bg: 'bg-blue-100', tc: 'text-blue-600', spark: kpis.openConversationsSparkline },
    { label: "Messages envoyés aujourd'hui", value: kpis.messagesToday.toLocaleString('fr-FR'), sub: fmtChange(kpis.messagesTodayChange), icon: 'paper-plane' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: kpis.messagesTodaySparkline },
    { label: 'Taux réponse', value: `${kpis.responseRate}%`, sub: fmtChange(kpis.responseRateChange), icon: 'check' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.responseRateSparkline },
    { label: 'Temps réponse moyen', value: kpis.avgResponseTime, sub: kpis.avgResponseTimeChange, icon: 'clock' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.avgResponseTimeSparkline },
    { label: 'Templates actifs', value: String(kpis.activeTemplates), sub: `+${kpis.activeTemplatesChange}`, icon: 'document-text' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: kpis.activeTemplatesSparkline },
    { label: "Coût WhatsApp aujourd'hui", value: `${kpis.costToday.toFixed(2)} $`, sub: fmtChange(kpis.costTodayChange), icon: 'currencyDollar' as const, color: '#EF4444', bg: 'bg-red-100', tc: 'text-red-600', spark: kpis.costTodaySparkline },
    { label: 'Conversations IA', value: `${kpis.aiConversationsPct}%`, sub: fmtChange(kpis.aiConversationsChange), icon: 'sparkles' as const, color: '#25D366', bg: 'bg-emerald-100', tc: 'text-emerald-600', spark: kpis.aiConversationsSparkline },
    { label: 'Satisfaction client', value: `${kpis.satisfaction}/5`, sub: `+${kpis.satisfactionChange}`, icon: 'star' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: kpis.satisfactionSparkline },
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
