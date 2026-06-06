import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface PromoProps { setSection?: (section: PartnerSection) => void; }

export const PromoManagement: React.FC<PromoProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, formatPrice } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  const promos = useMemo(() => [
    { id: 'PROMO-001', code: 'WELCOME20', type: 'Pourcentage', value: 20, views: 892, clicks: 156, orders: 45, revenue: 360, roi: '8x', margin: 84, status: 'Active', expires: '31 Dec 2026', target: 'Nouveaux', service: 'Tous' },
    { id: 'PROMO-002', code: 'COSTUME15', type: 'Pourcentage', value: 15, views: 450, clicks: 89, orders: 28, revenue: 210, roi: '4x', margin: 78, status: 'Active', expires: '30 Juin 2026', target: 'Tous', service: 'Costumes' },
    { id: 'PROMO-003', code: 'LIVRAISON', type: 'Livraison gratuite', value: 2, views: 1200, clicks: 234, orders: 67, revenue: 134, roi: '3x', margin: 92, status: 'Active', expires: '31 Dec 2026', target: 'Tous', service: 'Tous' },
    { id: 'PROMO-004', code: 'EXPRESS10', type: 'Pourcentage', value: 10, views: 320, clicks: 67, orders: 12, revenue: 95, roi: '2x', margin: 88, status: 'Expiree', expires: '31 Mai 2026', target: 'Fideles', service: 'Express' },
    { id: 'PROMO-005', code: 'NOUVEAU25', type: 'Pourcentage', value: 25, views: 670, clicks: 123, orders: 8, revenue: 180, roi: '5x', margin: 75, status: 'Active', expires: '30 Sept 2026', target: 'Nouveaux', service: 'Tous' },
    { id: 'PROMO-006', code: 'GOMBE50', type: 'Montant fixe', value: 50, views: 210, clicks: 45, orders: 15, revenue: 270, roi: '6x', margin: 82, status: 'Active', expires: '31 Aout 2026', target: 'Zone', service: 'Tous' },
  ], []);

  const filteredPromos = useMemo(() => {
    let result = promos;
    if (activeTab === 'active') result = result.filter(p => p.status === 'Active');
    else if (activeTab === 'expired') result = result.filter(p => p.status === 'Expiree');
    if (search) { const q = search.toLowerCase(); result = result.filter(p => p.code.toLowerCase().includes(q)); }
    return result;
  }, [promos, activeTab, search]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const active = promos.filter(p => p.status === 'Active').length;
    const totalRevenue = promos.reduce((s, p) => s + p.revenue, 0);
    const totalOrders = promos.reduce((s, p) => s + p.orders, 0);
    const totalViews = promos.reduce((s, p) => s + p.views, 0);
    const totalClicks = promos.reduce((s, p) => s + p.clicks, 0);
    const avgROI = promos.length > 0 ? (promos.reduce((s, p) => s + parseInt(p.roi) || 0, 0) / promos.length).toFixed(1) : '0';
    const avgMargin = promos.length > 0 ? Math.round(promos.reduce((s, p) => s + p.margin, 0) / promos.length) : 0;
    const conversionRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : '0';
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const reductions = Math.round(totalRevenue * 0.12);
    return { active, totalRevenue, totalOrders, newClients: 58, conversionRate, avgOrderValue: avgOrderValue.toFixed(2), avgROI, avgMargin, totalViews, totalClicks, reductions, profit: totalRevenue - reductions };
  }, [promos]);

  /* ─── Funnel Data ─── */
  const funnel = useMemo(() => [
    { step: 'Vues', value: stats.totalViews, pct: 100, icon: 'search', color: 'bg-[#0077B6]' },
    { step: 'Clics', value: stats.totalClicks, pct: Math.round((stats.totalClicks / Math.max(stats.totalViews, 1)) * 100), icon: 'cursor-arrow-rays', color: 'bg-[#0077B6]/80' },
    { step: 'Commandes', value: stats.totalOrders, pct: Math.round((stats.totalOrders / Math.max(stats.totalClicks, 1)) * 100), icon: 'shoppingBag', color: 'bg-[#0077B6]/60' },
    { step: 'Revenus', value: stats.totalRevenue, pct: 100, icon: 'currencyDollar', color: 'bg-[#22C55E]', isCurrency: true },
  ], [stats]);

  /* ─── Service Performance ─── */
  const servicePerf = useMemo(() => [
    { name: 'Costumes', revenue: 210, orders: 28, growth: '+32%', status: 'Meilleur' },
    { name: 'Chemises', revenue: 180, orders: 35, growth: '+18%', status: 'Bon' },
    { name: 'Couvertures', revenue: 96, orders: 12, growth: '+5%', status: 'Stable' },
    { name: 'Nettoyage express', revenue: 65, orders: 8, growth: '-2%', status: 'A ameliorer' },
  ], []);

  /* ─── Marketing Score ─── */
  const marketingScore = useMemo(() => {
    let score = 0;
    if (stats.active >= 3) score += 25;
    if (parseFloat(stats.conversionRate) > 5) score += 25;
    if (parseInt(stats.avgROI) > 3) score += 25;
    if (stats.totalOrders > 20) score += 25;
    return Math.min(100, score);
  }, [stats]);

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Promotions & Marketing</h1>
          <p className="text-sm text-slate-500 mt-1">Moteur d'acquisition et de croissance pour votre pressing.</p>
        </div>
        <button onClick={() => setShowCreateWizard(true)} className="px-4 py-2 bg-[#FF7A00] text-white text-xs font-bold rounded-xl hover:bg-[#e66d00] transition flex items-center gap-2"><Icon name="plus" className="w-4 h-4" />Creer une promotion</button>
      </div>

      {/* ─── Section 1: Growth Overview ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Promos actives', value: String(stats.active), icon: 'sparkles', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Revenus generes', value: formatPrice(stats.totalRevenue), icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Commandes generees', value: String(stats.totalOrders), icon: 'shoppingBag', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
          { label: 'ROI global', value: `${stats.avgROI}x`, icon: 'chartBar', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Nouveaux clients', value: String(stats.newClients), icon: 'user', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Taux conversion', value: `${stats.conversionRate}%`, icon: 'arrow-path', bg: 'bg-cyan-50', color: 'text-cyan-600' },
          { label: 'Valeur moy. commande', value: `$${stats.avgOrderValue}`, icon: 'shoppingBag', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Marge preservee', value: `${stats.avgMargin}%`, icon: 'shield-check', bg: 'bg-green-50', color: 'text-[#22C55E]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-md transition">
            <div className={`p-1.5 rounded-lg ${kpi.bg} w-fit mb-1.5`}><Icon name={kpi.icon as any} className={`w-3.5 h-3.5 ${kpi.color}`} /></div>
            <p className="text-[9px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-base font-extrabold text-[#0F172A]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Section 2: Performance Marketing + Funnel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#0F172A]">Performance des promotions</h2>
            <div className="flex gap-1">
              {['7j', '30j', '90j', '12m'].map((p, i) => (
                <button key={i} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${i === 1 ? 'bg-[#0077B6] text-white' : 'bg-slate-100 text-slate-600'}`}>{p}</button>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 500 150" className="w-full h-36">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <g key={i}>
                <line x1="40" y1={10 + (1 - pct) * 130} x2="490" y2={10 + (1 - pct) * 130} stroke="#F1F5F9" strokeWidth="1" />
                <text x="35" y={14 + (1 - pct) * 130} textAnchor="end" className="text-[8px] fill-slate-400">${Math.round(pct * stats.totalRevenue)}</text>
              </g>
            ))}
            <polyline fill="none" stroke="#0077B6" strokeWidth="2.5" strokeLinecap="round" points="60,120 120,100 180,85 240,70 300,55 360,40 420,30 480,15" />
            <polygon fill="url(#promoGrad)" opacity="0.2" points="60,130 60,120 120,100 180,85 240,70 300,55 360,40 420,30 480,15 480,130" />
            {['6 Mai', '13 Mai', '20 Mai', '27 Mai', '3 Juin', '10 Juin'].map((d, i) => (
              <text key={i} x={60 + i * 84} y="145" textAnchor="middle" className="text-[8px] fill-slate-400">{d}</text>
            ))}
            <defs><linearGradient id="promoGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0077B6" /><stop offset="100%" stopColor="#0077B6" stopOpacity="0" /></linearGradient></defs>
          </svg>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Funnel promotion</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon name={f.icon as any} className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-[#0F172A]">{f.step}</span>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A]">{f.isCurrency ? formatPrice(f.value) : f.value.toLocaleString('fr-FR')}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${f.color} transition-all duration-500`} style={{ width: `${f.pct}%` }} />
                </div>
                {i < funnel.length - 1 && <p className="text-[9px] text-slate-400 text-center mt-0.5">↓ {funnel[i + 1].pct}% convertis</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Classement Promotions ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-[#0F172A] mb-4">Classement des promotions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2 text-[10px] text-slate-500">CODE</th>
              <th className="text-left py-2 text-[10px] text-slate-500">TYPE</th>
              <th className="text-right py-2 text-[10px] text-slate-500">VUES</th>
              <th className="text-right py-2 text-[10px] text-slate-500">CLICS</th>
              <th className="text-right py-2 text-[10px] text-slate-500">CMD</th>
              <th className="text-right py-2 text-[10px] text-slate-500">CA</th>
              <th className="text-center py-2 text-[10px] text-slate-500">ROI</th>
              <th className="text-center py-2 text-[10px] text-slate-500">MARGE</th>
              <th className="text-center py-2 text-[10px] text-slate-500">STATUT</th>
            </tr></thead>
            <tbody>
              {filteredPromos.sort((a, b) => b.revenue - a.revenue).map((p, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                  <td className="py-2.5"><span className="px-2 py-1 bg-[#0077B6]/10 text-[#0077B6] text-xs font-bold rounded-lg">{p.code}</span></td>
                  <td className="py-2.5 text-xs text-slate-600">{p.type}</td>
                  <td className="py-2.5 text-xs font-medium text-right text-[#0F172A]">{p.views.toLocaleString()}</td>
                  <td className="py-2.5 text-xs font-medium text-right text-[#0F172A]">{p.clicks}</td>
                  <td className="py-2.5 text-xs font-bold text-right text-[#0F172A]">{p.orders}</td>
                  <td className="py-2.5 text-xs font-extrabold text-right text-[#0F172A]">{formatPrice(p.revenue)}</td>
                  <td className="py-2.5 text-center"><span className="text-xs font-bold text-[#22C55E]">{p.roi}</span></td>
                  <td className="py-2.5 text-center"><span className="text-xs font-medium text-slate-600">{p.margin}%</span></td>
                  <td className="py-2.5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'Active' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-slate-100 text-slate-400'}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Section 5: Growth Advisor + Section 6: Acquisition ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#FF7A00] to-[#e66d00] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="sparkles" className="w-5 h-5" />
            <h2 className="text-sm font-bold">Growth Advisor</h2>
          </div>
          <div className="space-y-2.5">
            {[
              { action: 'Les costumes performent +32%', suggestion: 'Creer une promo -15% Costumes', icon: 'trophy' },
              { action: 'Livraisons Gombe en hausse', suggestion: 'Offrir livraison gratuite', icon: 'truck' },
              { action: 'Clients inactifs depuis 30j', suggestion: 'Campagne reactivation -10%', icon: 'user' },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-white/10 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={item.icon as any} className="w-4 h-4 text-white/80" />
                  <p className="text-xs font-bold">{item.action}</p>
                </div>
                <p className="text-[10px] text-white/70 ml-6">{item.suggestion}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Acquisition clients</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Nouveaux', value: 58, color: 'text-[#22C55E]', bg: 'bg-green-50' },
              { label: 'Reactives', value: 22, color: 'text-[#0077B6]', bg: 'bg-blue-50' },
              { label: 'Fideles', value: 80, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((c, i) => (
              <div key={i} className={`p-3 rounded-xl text-center ${c.bg}`}>
                <p className={`text-xl font-extrabold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] text-slate-500">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 mb-1">Rentabilite promotions</p>
            <div className="space-y-1.5">
              {[
                { label: 'CA genere', value: formatPrice(stats.totalRevenue) },
                { label: 'Reductions accordees', value: `-${formatPrice(stats.reductions)}` },
                { label: 'Profit reel', value: formatPrice(stats.profit) },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{r.label}</span>
                  <span className={`font-bold ${i === 2 ? 'text-[#22C55E]' : 'text-[#0F172A]'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 7: Performance par Service + Gamification ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Performance par service</h2>
          <div className="space-y-3">
            {servicePerf.map((s, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">{s.name}</span>
                    {s.status === 'Meilleur' && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FF7A00]/10 text-[#FF7A00] rounded-full">Meilleur</span>}
                  </div>
                  <span className="text-sm font-extrabold text-[#0F172A]">{formatPrice(s.revenue)}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{s.orders} commandes</span>
                  <span className={`font-bold ${s.growth.startsWith('+') ? 'text-[#22C55E]' : 'text-red-500'}`}>{s.growth}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#0077B6] rounded-full" style={{ width: `${(s.revenue / 210) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Score marketing</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={marketingScore >= 80 ? '#22C55E' : marketingScore >= 60 ? '#FF7A00' : '#EF4444'} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${marketingScore} ${100 - marketingScore}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-extrabold text-[#0F172A]">{marketingScore}</span><span className="text-[9px] text-slate-400">/100</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#22C55E]">{marketingScore >= 80 ? 'Excellent' : marketingScore >= 60 ? 'Bon' : 'A ameliorer'}</p>
              <p className="text-[10px] text-slate-400">Base sur : promos, ROI, conversion</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'Promotions actives', ok: stats.active >= 3 },
              { label: 'Taux conversion > 5%', ok: parseFloat(stats.conversionRate) > 5 },
              { label: 'ROI > 3x', ok: parseInt(stats.avgROI) > 3 },
              { label: 'Frequent campagnes', ok: stats.totalOrders > 20 },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <Icon name={c.ok ? 'check' : 'xmark'} className={`w-3.5 h-3.5 ${c.ok ? 'text-[#22C55E]' : 'text-[#FF7A00]'}`} />
                <span className={c.ok ? 'text-[#0F172A]' : 'text-[#FF7A00]'}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 8: Exports + Footer ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-[#0F172A] mb-3">Exports & Rapports</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: 'document-text', label: 'Rapport promotions', format: 'PDF', color: 'text-red-500' },
            { icon: 'chartBar', label: 'ROI detaille', format: 'Excel', color: 'text-[#22C55E]' },
            { icon: 'users', label: 'Acquisition clients', format: 'CSV', color: 'text-[#0077B6]' },
            { icon: 'document-text', label: 'Performance marketing', format: 'PDF', color: 'text-red-500' },
          ].map((exp, i) => (
            <button key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <Icon name={exp.icon as any} className={`w-5 h-5 ${exp.color}`} />
              <div className="text-left"><p className="text-xs font-bold text-[#0F172A]">{exp.label}</p><p className="text-[9px] text-slate-400">{exp.format}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-[#FF7A00] to-[#e66d00] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Boostez votre croissance</h3>
            <p className="text-xs text-white/80">Les promos genèrent en moyenne 3x plus de commandes et 2x plus de revenus.</p>
          </div>
        </div>
        <button onClick={() => setShowCreateWizard(true)} className="px-5 py-2.5 bg-white text-[#FF7A00] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Creer une promotion</button>
      </div>
    </div>
  );
};
