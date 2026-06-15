import { Icon } from '../../Icon';
import type { AdminMgmtKpis } from '../../../lib/admin/admin-mgmt-types';

function Spark({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const w = 50; const h = 20; const max = Math.max(...data); const min = Math.min(...data); const r = max - min || 1;
  const pts = data.map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((v - min) / r) * h}`).join(' ');
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" /></svg>;
}

export function AdminKpiCards({ kpis }: { kpis: AdminMgmtKpis }) {
  const cards = [
    { label: 'Total admins', value: String(kpis.totalAdmins), sub: `+${kpis.totalAdminsChange}%`, icon: 'users' as const, color: '#8B5CF6', bg: 'bg-violet-100', tc: 'text-violet-600', spark: kpis.totalAdminsSparkline },
    { label: 'Super Admins', value: String(kpis.superAdmins), sub: '', icon: 'shield' as const, color: '#7C3AED', bg: 'bg-purple-100', tc: 'text-purple-600', spark: [] },
    { label: 'Admins actifs', value: String(kpis.activeAdmins), sub: `+${kpis.activeAdminsChange}%`, icon: 'check' as const, color: '#22C55E', bg: 'bg-green-100', tc: 'text-green-600', spark: [] },
    { label: 'Rôles disponibles', value: String(kpis.rolesCount), sub: '', icon: 'document' as const, color: '#F59E0B', bg: 'bg-amber-100', tc: 'text-amber-600', spark: [] },
    { label: 'Sessions actives', value: String(kpis.activeSessions), sub: `+${kpis.activeSessionsChange}%`, icon: 'shield-check' as const, color: '#06B6D4', bg: 'bg-cyan-100', tc: 'text-cyan-600', spark: [] },
    { label: 'Invitations en attente', value: String(kpis.pendingInvitations), sub: '', icon: 'envelope' as const, color: '#EC4899', bg: 'bg-pink-100', tc: 'text-pink-600', spark: [] },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
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
