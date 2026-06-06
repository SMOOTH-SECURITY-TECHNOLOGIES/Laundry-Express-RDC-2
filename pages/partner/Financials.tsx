import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { OrderStatus, PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';

interface FinancialsProps { setSection?: (section: PartnerSection) => void; }

/* ─── SVG Donut ─── */
const Donut: React.FC<{ segments: { value: number; color: string; label: string }[]; size?: number }> = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 40;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const offset = circumference - (pct / 100) * circumference;
          const dash = (pct / 100) * circumference;
          const prev = cumulative;
          cumulative += pct;
          return <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="10" strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-prev / 100 * circumference} />;
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-600">{seg.label}</span>
            <span className="font-bold text-[#0F172A]">{total > 0 ? Math.round((seg.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── MAIN FINANCIALS ─── */
export const Financials: React.FC<FinancialsProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, formatPrice } = useAppContext();
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);
  const allOrders = useMemo(() => user?.partnerId ? getOrdersForPartner(user.partnerId) : [], [user, getOrdersForPartner]);
  const completedOrders = useMemo(() => allOrders.filter(o => o.status === OrderStatus.COMPLETED), [allOrders]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const grossRevenue = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
    const commission = Math.round(grossRevenue * 0.06);
    const netRevenue = grossRevenue - commission;
    const collected = Math.round(netRevenue * 0.88);
    const pending = netRevenue - collected;
    const available = Math.round(collected * 0.85);
    const dailyAvg = completedOrders.length > 0 ? grossRevenue / Math.max(new Set(completedOrders.map(o => o.createdAt.slice(0, 10))).size, 1) : 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dayOfMonth = new Date().getDate();
    const forecast = Math.round(dailyAvg * (daysInMonth - dayOfMonth) + grossRevenue);
    const healthScore = Math.min(100, Math.round(85 + (collected / Math.max(netRevenue, 1)) * 15));
    return { grossRevenue, netRevenue, commission, collected, pending, available, dailyAvg, forecast, healthScore };
  }, [completedOrders]);

  /* ─── Revenue Chart Data ─── */
  const revenueData = useMemo(() => {
    const days = 30;
    const result: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayOrders = completedOrders.filter(o => o.createdAt.startsWith(ds));
      const gross = dayOrders.reduce((s, o) => s + o.totalPrice, 0);
      result.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        values: [
          { name: 'Revenus bruts', value: gross, color: '#0077B6' },
          { name: 'Revenus nets', value: Math.round(gross * 0.94), color: '#22C55E' },
          { name: 'En attente', value: Math.round(gross * 0.12), color: '#FF7A00' },
        ],
      });
    }
    return result;
  }, [completedOrders]);

  /* ─── Top Clients ─── */
  const topClients = useMemo(() => {
    const clients: Record<string, { count: number; total: number }> = {};
    completedOrders.forEach(o => {
      const name = o.clientDetails?.name || 'Client';
      clients[name] = clients[name] || { count: 0, total: 0 };
      clients[name].count++;
      clients[name].total += o.totalPrice;
    });
    return Object.entries(clients).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [completedOrders]);

  /* ─── Top Services ─── */
  const topServices = useMemo(() => {
    const services: Record<string, { count: number; revenue: number }> = {};
    completedOrders.forEach(o => {
      o.serviceItems?.forEach(si => {
        const name = si.service.title || 'Service';
        services[name] = services[name] || { count: 0, revenue: 0 };
        services[name].count++;
        services[name].revenue += o.totalPrice;
      });
    });
    return Object.entries(services).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completedOrders]);

  /* ─── Payment Methods ─── */
  const paymentMethods = useMemo(() => [
    { value: 45, color: '#0077B6', label: 'Airtel Money' },
    { value: 30, color: '#FF7A00', label: 'Orange Money' },
    { value: 15, color: '#22C55E', label: 'M-Pesa' },
    { value: 8, color: '#8B5CF6', label: 'Cash' },
    { value: 2, color: '#64748B', label: 'Carte bancaire' },
  ], []);

  /* ─── Payout History ─── */
  const payouts = useMemo(() => [
    { ref: 'PAY-2048', date: '05 Juin 2026', amount: 120, canal: 'Airtel Money', status: 'Effectue' },
    { ref: 'PAY-2047', date: '01 Juin 2026', amount: 80, canal: 'Banque', status: 'Effectue' },
    { ref: 'PAY-2046', date: '28 Mai 2026', amount: 150, canal: 'Orange Money', status: 'Effectue' },
    { ref: 'PAY-2045', date: '25 Mai 2026', amount: 100, canal: 'Airtel Money', status: 'En cours' },
    { ref: 'PAY-2044', date: '20 Mai 2026', amount: 90, canal: 'M-Pesa', status: 'Effectue' },
  ], []);

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Finances & Paiements</h1>
          <p className="text-sm text-slate-500 mt-1">Suivez vos revenus, retraits, commissions et paiements marketplace.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"><Icon name="arrow-down-tray" className="w-3.5 h-3.5" />Exporter</button>
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"><Icon name="document-text" className="w-3.5 h-3.5" />PDF</button>
          <button className="px-4 py-2 bg-[#0077B6] text-white text-xs font-bold rounded-xl hover:bg-[#005f8f] transition">Demander un retrait</button>
        </div>
      </div>

      {/* ─── Wallet + KPIs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Wallet Principal */}
        <div className="bg-gradient-to-br from-[#22C55E] to-[#1a9c4a] rounded-2xl p-6 text-white lg:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-white/80">Disponible a retirer</p>
            <Icon name="search" className="w-3.5 h-3.5 text-white/60" />
          </div>
          <p className="text-3xl font-extrabold mb-1">{formatPrice(stats.available)}</p>
          <p className="text-[10px] text-white/60 mb-4">Mis a jour il y a 2 min</p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Icon name="check" className="w-3.5 h-3.5 text-white/80" />
                <div><p className="text-[10px] font-bold text-white">Retrait #245</p><p className="text-[9px] text-white/60">03 Juin</p></div>
              </div>
              <span className="text-xs font-bold text-white/90">{formatPrice(120)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition">Mobile Money</button>
            <button className="flex-1 py-2.5 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition">Banque</button>
          </div>
          <button className="w-full mt-3 py-2 text-[10px] font-bold text-white/80 hover:text-white transition">Historique retraits →</button>
        </div>

        {/* KPI Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Revenus bruts', value: formatPrice(stats.grossRevenue), change: '+18%', icon: 'currencyDollar', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
            { label: 'Revenus nets', value: formatPrice(stats.netRevenue), change: '+15%', icon: 'wallet', bg: 'bg-green-50', color: 'text-[#22C55E]' },
            { label: 'En attente', value: formatPrice(stats.pending), sub: 'En attente de versement', icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
            { label: 'Commissions', value: formatPrice(stats.commission), sub: '6% de commission', icon: 'chartBar', bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Retraits effectues', value: formatPrice(490), change: '+22%', icon: 'arrow-down-tray', bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Prochain versement', value: '05 Juin', sub: 'Dans 2 jours', icon: 'calendar', bg: 'bg-cyan-50', color: 'text-cyan-600' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${kpi.bg}`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
                {kpi.change && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-[#22C55E]">{kpi.change}</span>}
              </div>
              <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
              <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
              {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Revenue Analytics + Paiements par methode ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Apercu des revenus</h2>
            <div className="flex items-center gap-3">
              {['Revenus bruts', 'Revenus nets', 'En attente'].map((n, i) => (
                <span key={n} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#0077B6', '#22C55E', '#FF7A00'][i] }} />{n}
                </span>
              ))}
            </div>
          </div>
          {stats.grossRevenue > 0 ? (
            <svg viewBox="0 0 600 200" className="w-full h-48">
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <g key={i}>
                  <line x1="50" y1={20 + (1 - pct) * 160} x2="590" y2={20 + (1 - pct) * 160} stroke="#F1F5F9" strokeWidth="1" />
                  <text x="45" y={24 + (1 - pct) * 160} textAnchor="end" className="text-[9px] fill-slate-400">${Math.round(pct * stats.grossRevenue)}</text>
                </g>
              ))}
              {['Revenus bruts', 'Revenus nets', 'En attente'].map((name, si) => {
                const color = ['#0077B6', '#22C55E', '#FF7A00'][si];
                const max = Math.max(...revenueData.flatMap(d => d.values.map(v => v.value)), 1);
                const pts = revenueData.map((d, i) => `${50 + (i / (revenueData.length - 1)) * 540},${20 + (1 - (d.values[si]?.value || 0) / max) * 160}`).join(' ');
                return <polyline key={si} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts} />;
              })}
              {revenueData.length <= 12 && revenueData.map((d, i) => (
                <text key={i} x={50 + (i / (revenueData.length - 1)) * 540} y="195" textAnchor="middle" className="text-[8px] fill-slate-400">{d.label}</text>
              ))}
            </svg>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <Icon name="currencyDollar" className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 mb-1">Aucun revenu enregistre</p>
              <p className="text-xs text-slate-400">Les revenus apparaitront apres vos premieres commandes livrees.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Paiements par methode</h3>
          <div className="flex justify-center mb-4">
            <Donut segments={paymentMethods} size={140} />
          </div>
          <p className="text-xs text-slate-400 text-center mb-1">Total encaisse</p>
          <p className="text-xl font-extrabold text-[#0F172A] text-center">{formatPrice(stats.collected)}</p>
        </div>
      </div>

      {/* ─── Historique + Commission ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Historique des versements</h3>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir tout →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] text-slate-500 font-medium">REFERENCE</th>
                <th className="text-left py-2 text-[10px] text-slate-500 font-medium">DATE</th>
                <th className="text-right py-2 text-[10px] text-slate-500 font-medium">MONTANT</th>
                <th className="text-left py-2 text-[10px] text-slate-500 font-medium">CANAL</th>
                <th className="text-center py-2 text-[10px] text-slate-500 font-medium">STATUT</th>
              </tr></thead>
              <tbody>
                {payouts.map((p, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 font-mono text-xs text-[#0F172A]">{p.ref}</td>
                    <td className="py-2.5 text-xs text-slate-500">{p.date}</td>
                    <td className="py-2.5 text-xs font-bold text-right text-[#0F172A]">{formatPrice(p.amount)}</td>
                    <td className="py-2.5 text-xs text-slate-600">{p.canal}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Effectue' ? 'bg-green-50 text-[#22C55E]' : p.status === 'En cours' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-red-50 text-red-500'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Resume des commissions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Revenus generes</span>
              <span className="text-sm font-bold text-[#0F172A]">{formatPrice(stats.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-red-500">Commission Laundry Express (6%)</span>
              <span className="text-sm font-bold text-red-500">-{formatPrice(stats.commission)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Ajustements & frais</span>
              <span className="text-sm font-bold text-slate-400">{formatPrice(0)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm font-bold text-[#0F172A]">Revenu net partenaire</span>
              <span className="text-lg font-extrabold text-[#22C55E]">{formatPrice(stats.netRevenue)}</span>
            </div>
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline">Voir le detail des commissions →</button>
        </div>
      </div>

      {/* ─── Prevision + Top Clients + Top Services ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-2">Prevision fin du mois</h3>
          <p className="text-2xl font-extrabold text-[#0F172A] mb-1">{formatPrice(stats.forecast)}</p>
          <p className="text-[10px] text-slate-400 mb-3">Prevision basee sur :</p>
          <div className="space-y-1.5 mb-3">
            {['Revenu actuel', 'Commandes en cours', 'Historique mensuel'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[#22C55E]">
                <Icon name="check" className="w-3 h-3" /><span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="arrow-path" className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-[10px] font-bold text-[#22C55E]">+19% vs prevision mois dernier</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Top clients</h3>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir tout →</button>
          </div>
          <div className="space-y-2">
            {topClients.map((c, i) => {
              const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isTop = i === 0;
              return (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${isTop ? 'bg-yellow-50 border border-yellow-200' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${isTop ? 'bg-yellow-100 text-yellow-700' : 'bg-[#0077B6]/10 text-[#0077B6]'}`}>
                      {isTop ? '🏆' : initials}
                    </div>
                    <div><p className="text-xs font-bold text-[#0F172A]">{c.name}</p><p className="text-[10px] text-slate-400">{c.count} commandes</p></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-[#0F172A]">{formatPrice(c.total)}</span>
                    {isTop && <p className="text-[9px] text-[#FF7A00] font-bold">Client Premium</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Top services</h3>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir tout →</button>
          </div>
          <div className="space-y-2">
            {topServices.map((s, i) => {
              const maxRev = topServices[0]?.revenue || 1;
              const isTop = i === 0;
              return (
                <div key={i} className={`p-2.5 rounded-lg ${isTop ? 'bg-orange-50 border border-orange-200' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0F172A]">{s.name}</span>
                    <span className="text-sm font-extrabold text-[#0F172A]">{formatPrice(s.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{s.count} commandes</span>
                    {isTop && <span className="px-1.5 py-0.5 bg-[#FF7A00]/10 text-[#FF7A00] rounded-full font-bold">Meilleur service</span>}
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-[#0077B6] rounded-full" style={{ width: `${(s.revenue / maxRev) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Sante + Alertes + Cycle ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Sante financiere</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={stats.healthScore >= 80 ? '#22C55E' : stats.healthScore >= 60 ? '#FF7A00' : '#EF4444'} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${stats.healthScore} ${100 - stats.healthScore}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-extrabold text-[#0F172A]">{stats.healthScore}</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{stats.healthScore >= 80 ? 'Excellente' : stats.healthScore >= 60 ? 'Bonne' : 'A ameliorer'}</p>
              <p className="text-[10px] text-slate-400">/100</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Paiements recus', value: 'Excellent', color: 'text-[#22C55E]' },
              { label: 'Retards de paiement', value: 'Bon', color: 'text-[#22C55E]' },
              { label: 'Litiges', value: 'Excellent', color: 'text-[#22C55E]' },
              { label: 'Annulations', value: 'Bon', color: 'text-[#22C55E]' },
              { label: 'Croissance', value: 'Excellent', color: 'text-[#22C55E]' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-1.5"><Icon name="check" className="w-3 h-3 text-[#22C55E]" /><span className="text-slate-600">{item.label}</span></div>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Alertes</h3>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir toutes →</button>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="clock" className="w-4 h-4 text-[#FF7A00]" />
                <div><p className="text-xs font-bold text-[#0F172A]">3 paiements en attente</p><p className="text-[10px] text-slate-400">Total : {formatPrice(stats.pending)}</p></div>
              </div>
              <button className="px-2 py-1 text-[10px] font-bold bg-[#FF7A00] text-white rounded-lg">Voir</button>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="warning" className="w-4 h-4 text-red-500" />
                <div><p className="text-xs font-bold text-[#0F172A]">1 facture en retard</p><p className="text-[10px] text-slate-400">Total : {formatPrice(18)}</p></div>
              </div>
              <button className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg">Relancer</button>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="arrow-down-tray" className="w-4 h-4 text-[#0077B6]" />
                <div><p className="text-xs font-bold text-[#0F172A]">2 retraits a valider</p><p className="text-[10px] text-slate-400">Total : {formatPrice(180)}</p></div>
              </div>
              <button className="px-2 py-1 text-[10px] font-bold bg-[#0077B6] text-white rounded-lg">Voir</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Cycle financier</h3>
          <div className="flex items-center justify-between mb-4">
            {[
              { icon: 'check', label: 'Commande', sub: 'Livree', color: 'bg-[#22C55E]', active: true },
              { icon: 'currencyDollar', label: 'Paiement', sub: 'Client', color: 'bg-[#0077B6]', active: true },
              { icon: 'chartBar', label: 'Commission', sub: 'Calculee', color: 'bg-[#0077B6]', active: true },
              { icon: 'wallet', label: 'Disponible', sub: 'Montant', color: 'bg-[#0077B6]', active: true },
              { icon: 'arrow-down-tray', label: 'Retrait', sub: 'Demande', color: 'bg-[#0077B6]', active: false },
              { icon: 'check', label: 'Versement', sub: 'Effectue', color: 'bg-slate-300', active: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1">
                <div className={`w-8 h-8 rounded-full ${step.active ? step.color : 'bg-slate-200'} flex items-center justify-center mb-1`}>
                  <Icon name={step.icon as any} className={`w-4 h-4 ${step.active ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <p className="text-[9px] font-bold text-[#0F172A]">{step.label}</p>
                <p className="text-[8px] text-slate-400">{step.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 text-center">Votre prochain versement est prevu le <strong className="text-[#0F172A]">05 Juin 2026</strong>.</p>
        </div>
      </div>

      {/* ─── Resume mensuel ─── */}
      <div className="bg-gradient-to-r from-[#0077B6] to-[#005f8f] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Resume mensuel — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
            <p className="text-xs text-white/80">Vos performances financieres sont en hausse.</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center"><p className="text-xl font-extrabold text-white">+18%</p><p className="text-[10px] text-white/70">Revenus</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">+23%</p><p className="text-[10px] text-white/70">Commandes</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">+12%</p><p className="text-[10px] text-white/70">Profit net</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">98%</p><p className="text-[10px] text-white/70">Paiements reussis</p></div>
        </div>
        <button className="px-5 py-2.5 bg-white text-[#0077B6] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Voir rapport complet</button>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-[#22C55E] to-[#1a9c4a] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚡</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Accelerer vos paiements</h3>
            <p className="text-xs text-white/80">Demandez vos retraits a tout moment et recevez votre argent plus rapidement.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-[#22C55E] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Demander un retrait</button>
      </div>
    </div>
  );
};
