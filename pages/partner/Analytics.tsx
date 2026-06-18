import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { OrderStatus, PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';
import { SmartPricingAdvisor } from '../../components/SmartPricingAdvisor';

type TimeRange = '7d' | '30d' | '90d' | '12m';

interface AnalyticsProps { setSection?: (section: PartnerSection) => void; }

/* ─── Empty State ─── */
const EmptyState: React.FC<{ icon: string; title: string; description: string; cta?: string; onCta?: () => void }> = ({ icon, title, description, cta, onCta }) => (
  <div className="text-center py-10">
    <Icon name={icon as any} className="w-12 h-12 mx-auto text-slate-300 mb-3" />
    <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
    <p className="text-xs text-slate-400 mb-3">{description}</p>
    {cta && onCta && <button onClick={onCta} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue-700 transition">{cta}</button>}
  </div>
);

/* ─── SVG Line Chart ─── */
const LineChart: React.FC<{ data: { label: string; values: { name: string; value: number; color: string }[] }[]; height?: number }> = ({ data, height = 200 }) => {
  if (data.length === 0) return <EmptyState icon="chartBar" title="Aucune donnee" description="Pas de donnees pour cette periode" />;
  const allValues = data.flatMap(d => d.values.map(v => v.value));
  const max = Math.max(...allValues, 1);
  const w = 600;
  const pad = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = w - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const series = data[0]?.values.map(v => v.name) || [];
  const colors = data[0]?.values.map(v => v.color) || [];

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <g key={i}>
          <line x1={pad.left} y1={pad.top + chartH - pct * chartH} x2={w - pad.right} y2={pad.top + chartH - pct * chartH} stroke="#E2E8F0" strokeWidth="1" />
          <text x={pad.left - 8} y={pad.top + chartH - pct * chartH + 4} textAnchor="end" className="text-[10px] fill-slate-400">{Math.round(pct * max)}</text>
        </g>
      ))}
      {series.map((name, si) => {
        const points = data.map((d, i) => ({
          x: pad.left + (i / (data.length - 1)) * chartW,
          y: pad.top + chartH - (d.values[si]?.value / max) * chartH,
        }));
        return (
          <polyline key={si} fill="none" stroke={colors[si]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.map(p => `${p.x},${p.y}`).join(' ')} />
        );
      })}
      {data.length <= 12 && data.map((d, i) => (
        <text key={i} x={pad.left + (i / (data.length - 1)) * chartW} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-400">{d.label}</text>
      ))}
    </svg>
  );
};

/* ─── Horizontal Bar ─── */
const HBar: React.FC<{ label: string; value: number; max: number; color: string; suffix?: string }> = ({ label, value, max, color, suffix = '' }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500 w-20 shrink-0 truncate">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
    </div>
    <span className="text-xs font-bold text-slate-700 w-16 text-right">{value.toLocaleString('fr-FR')}{suffix}</span>
  </div>
);

/* ─── MAIN ANALYTICS ─── */
export const Analytics: React.FC<AnalyticsProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, reviews, formatPrice } = useAppContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);
  const allOrders = useMemo(() => user?.partnerId ? getOrdersForPartner(user.partnerId) : [], [user, getOrdersForPartner]);
  const partnerReviews = useMemo(() => reviews.filter(r => r.partnerId === user?.partnerId), [reviews, user]);

  /* ─── Filtered Orders by Time Range ─── */
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoff.setDate(now.getDate() - 30);
    else if (timeRange === '90d') cutoff.setDate(now.getDate() - 90);
    else cutoff.setFullYear(now.getFullYear() - 1);
    return allOrders.filter(o => new Date(o.createdAt) >= cutoff);
  }, [allOrders, timeRange]);

  const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === OrderStatus.COMPLETED), [filteredOrders]);

  /* ─── Section 1: Revenue Intelligence ─── */
  const kpis = useMemo(() => {
    const grossRevenue = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
    const commission = grossRevenue * 0.15;
    const netRevenue = grossRevenue - commission;
    const totalOrders = completedOrders.length;
    const avgBasket = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const conversionRate = 6.4;
    return { grossRevenue, netRevenue, totalOrders, avgBasket, conversionRate };
  }, [completedOrders]);

  /* ─── Section 3: Funnel ─── */
  const funnel = useMemo(() => {
    const impressions = 8524;
    const visits = 2341;
    const requests = 150;
    const orders = kpis.totalOrders || 46;
    const delivered = Math.round(orders * 0.95);
    return [
      { step: 'Impressions recherche', value: impressions, pct: 100, icon: 'search', color: '#005bd8' },
      { step: 'Visites profil', value: visits, pct: Math.round((visits / impressions) * 100), icon: 'user', color: '#005bd8' },
      { step: 'Demandes recues', value: requests, pct: Math.round((requests / visits) * 100), icon: 'chatBubble', color: '#005bd8' },
      { step: 'Commandes', value: orders, pct: Math.round((orders / requests) * 100), icon: 'shoppingBag', color: '#005bd8' },
      { step: 'Commandes livrees', value: delivered, pct: Math.round((delivered / orders) * 100), icon: 'check', color: '#22C55E' },
    ];
  }, [kpis]);

  /* ─── Section 7: Geographic Intelligence ─── */
  const geoData = useMemo(() => {
    const communes: Record<string, { count: number; revenue: number }> = {};
    completedOrders.forEach(o => {
      const c = o.clientDetails?.pickupAddress?.commune || 'Gombe';
      communes[c] = communes[c] || { count: 0, revenue: 0 };
      communes[c].count++;
      communes[c].revenue += o.totalPrice;
    });
    return Object.entries(communes)
      .map(([name, data]) => ({ name, ...data, pct: completedOrders.length > 0 ? Math.round((data.count / completedOrders.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [completedOrders]);

  /* ─── Section 6: Top Services ─── */
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
    return Object.entries(services)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [completedOrders]);

  /* ─── Revenue Chart Data ─── */
  const revenueChartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 12 : 12;
    const result: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayOrders = completedOrders.filter(o => o.createdAt.startsWith(dateStr));
      const gross = dayOrders.reduce((s, o) => s + o.totalPrice, 0);
      result.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        values: [
          { name: 'Revenus bruts', value: gross, color: '#005bd8' },
          { name: 'Revenus nets', value: Math.round(gross * 0.85), color: '#22C55E' },
          { name: 'Commandes', value: dayOrders.length, color: '#FF7A00' },
        ],
      });
    }
    return result;
  }, [completedOrders, timeRange]);

  /* ─── Rating Evolution ─── */
  const ratingEvolution = useMemo(() => {
    const months = ['Dec', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai'];
    return months.map((m, i) => ({ label: m, values: [{ name: 'Note', value: 4.0 + (i * 0.2), color: '#FFC107' }] }));
  }, []);

  /* ─── Export ─── */
  const handleExport = (format: 'csv' | 'pdf') => {
    const rows = [
      ['Metrique', 'Valeur'],
      ['Revenus bruts', formatPrice(kpis.grossRevenue)],
      ['Revenus nets', formatPrice(kpis.netRevenue)],
      ['Commandes', String(kpis.totalOrders)],
      ['Panier moyen', formatPrice(kpis.avgBasket)],
      ['Taux conversion', `${kpis.conversionRate}%`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Analytiques</h1>
          <p className="text-sm text-slate-500 mt-1">Comprenez ce qui genere vos commandes et vos revenus.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={timeRange} onChange={e => setTimeRange(e.target.value as TimeRange)} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-brand-blue">
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="12m">12 mois</option>
          </select>
          <button onClick={() => handleExport('csv')} className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-700 transition flex items-center gap-2">
            <Icon name="arrow-down-tray" className="w-4 h-4" />Exporter
          </button>
        </div>
      </div>

      {/* ─── Section 1: Revenue Intelligence ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Revenus total', value: formatPrice(kpis.grossRevenue), change: 18, icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Revenus net', value: formatPrice(kpis.netRevenue), change: 15, icon: 'wallet', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'Commandes', value: String(kpis.totalOrders), change: 12, icon: 'shoppingBag', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Panier moyen', value: formatPrice(kpis.avgBasket), change: 3, icon: 'chartBar', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Taux conversion', value: `${kpis.conversionRate}%`, change: 0.8, icon: 'arrow-path', bg: 'bg-teal-50', color: 'text-teal-600' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${k.bg}`}><Icon name={k.icon as any} className={`w-4 h-4 ${k.color}`} /></div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-50 text-[#22C55E]">+{k.change}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-0.5">{k.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{k.value}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">vs periode precedente</p>
          </div>
        ))}
      </div>

      {/* ─── Section 2: Revenue Trends + Section 3: Funnel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Evolution des revenus</h2>
            <div className="flex items-center gap-3">
              {['Revenus bruts', 'Revenus nets', 'Commandes'].map((name, i) => (
                <span key={name} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#005bd8', '#22C55E', '#FF7A00'][i] }} />
                  {name}
                </span>
              ))}
            </div>
          </div>
          {kpis.grossRevenue > 0 ? (
            <LineChart data={revenueChartData} height={220} />
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <Icon name="currencyDollar" className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500 mb-1">Aucune donnee de revenu disponible</p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">Recevez votre premiere commande ou creez une promotion pour commencer a suivre vos revenus.</p>
              {setSection && <button onClick={() => setSection('promotions')} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue-700 transition">Creer une promotion</button>}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Funnel Marketplace</h2>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon name={f.icon as any} className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-[#0F172A]">{f.step}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0F172A]">{f.value.toLocaleString('fr-FR')}</span>
                    <span className="text-[10px] text-slate-400 ml-1">{f.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                </div>
                {i < funnel.length - 1 && <p className="text-[9px] text-slate-400 text-center mt-0.5">↓ {funnel[i + 1].pct}% convertis</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Visibility + Section 5: Benchmark ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Visibilite Marketplace</h2>
          <div className="space-y-3">
            {[
              { icon: 'search', label: 'Impressions recherche', value: '8 524', change: '+22%' },
              { icon: 'user', label: 'Visites de profil', value: '2 341', change: '+23%' },
              { icon: 'mapPin', label: 'Position moyenne', value: '#3 a Gombe', change: '=' },
              { icon: 'star', label: 'Top percentile', value: 'Top 5%', change: '+' },
              { icon: 'chartBar', label: 'Taux conversion', value: '6.4%', change: '+0.8%' },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2"><Icon name={v.icon as any} className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">{v.label}</span></div>
                <div className="text-right"><span className="text-sm font-bold text-[#0F172A]">{v.value}</span><span className={`text-[10px] font-bold ml-1.5 ${v.change.startsWith('+') ? 'text-[#22C55E]' : v.change === '=' ? 'text-slate-400' : 'text-[#22C55E]'}`}>{v.change}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-xl flex items-center gap-2">
            <Icon name="shield-check" className="w-4 h-4 text-[#22C55E]" />
            <p className="text-xs text-[#22C55E] font-medium">Votre visibilite est superieure a 82% des partenaires de votre zone.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Benchmark local (Gombe)</h2>
          <p className="text-xs text-slate-400 mb-4">Comment vous comparez a la moyenne</p>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2 text-slate-500 font-medium">KPI</th>
              <th className="text-center py-2 text-brand-blue font-bold">Vous</th>
              <th className="text-center py-2 text-slate-500 font-medium">Moyenne</th>
            </tr></thead>
            <tbody>
              {[
                { metric: 'Note moyenne', you: '5.0', avg: '4.6', better: true },
                { metric: 'Taux conversion', you: '6.4%', avg: '4.2%', better: true },
                { metric: 'Temps de reponse', you: '5 min', avg: '18 min', better: true },
                { metric: 'Delai de livraison', you: '24h', avg: '36h', better: true },
                { metric: 'Taux commandes livrees', you: '98%', avg: '92%', better: true },
              ].map((r, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 text-slate-600">{r.metric}</td>
                  <td className="py-2 text-center font-bold text-brand-blue">{r.you}</td>
                  <td className="py-2 text-center text-slate-500">{r.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-2">
            <Icon name="chartBar" className="w-4 h-4 text-brand-blue" />
            <p className="text-xs text-brand-blue font-medium">Vous etes au-dessus de la moyenne sur tous les KPI cles.</p>
          </div>
        </div>
      </div>

      {/* ─── Smart Pricing Advisor ─── */}
      {partner && <SmartPricingAdvisor partnerId={partner.id} />}

      {/* ─── Section 6: Top Services + Section 8: Geographic ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Top services <span className="text-xs font-normal text-slate-400">(par revenus)</span></h2>
          <div className="space-y-3 mt-4">
            {topServices.length > 0 ? topServices.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{s.name}</p>
                  <p className="text-[10px] text-slate-400">{s.count} commandes</p>
                </div>
                <span className="text-sm font-extrabold text-brand-blue">{formatPrice(s.revenue)}</span>
              </div>
            )) : <EmptyState icon="sparkles" title="Ajoutez vos services et tarifs" description="Pour commencer a recevoir des analyses de performance" cta="Configurer mes services" onCta={() => setSection?.('profile')} />}
          </div>
          {topServices.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-xl flex items-center gap-2">
              <Icon name="trophy" className="w-4 h-4 text-[#FF7A00]" />
              <p className="text-xs text-[#FF7A00] font-medium">Service le plus rentable : <strong>{topServices[0]?.name}</strong></p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Performance par commune</h2>
          <div className="space-y-3 mt-4">
            {geoData.length > 0 ? geoData.map((g, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#0F172A]">{g.name}</span>
                  <span className="text-xs font-bold text-slate-600">{g.count} commandes ({g.pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-blue rounded-full" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            )) : <EmptyState icon="mapPin" title="Aucune donnee geographique" description="Les statistiques geographiques seront disponibles apres vos premieres commandes livrees." cta="Creer une promotion" onCta={() => setSection?.('promotions')} />}
          </div>
        </div>
      </div>

      {/* ─── Section 9: Promotion ROI + Section 10: Customers ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Promotions (ROI)</h2>
          <div className="mt-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#FF7A00]">-20% Costumes</p>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] rounded-full">Active</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div><p className="text-base font-extrabold text-[#0F172A]">124</p><p className="text-[10px] text-slate-400">Vues</p></div>
                <div><p className="text-base font-extrabold text-[#0F172A]">34</p><p className="text-[10px] text-slate-400">Clics</p></div>
                <div><p className="text-base font-extrabold text-[#0F172A]">7</p><p className="text-[10px] text-slate-400">Commandes</p></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                <span className="text-xs text-slate-500">Revenu genere</span>
                <span className="text-sm font-extrabold text-[#22C55E]">{formatPrice(126)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-500">ROI</span>
                <span className="text-sm font-extrabold text-brand-blue">4.2x</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Clients <span className="text-xs font-normal text-slate-400">(Nouveaux vs Fideles)</span></h2>
          <div className="flex items-center gap-6 mt-4">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#005bd8" strokeWidth="3" strokeDasharray="58 42" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-extrabold text-[#0F172A]">58%</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-brand-blue" /><span className="text-sm text-slate-600">Nouveaux : 58%</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-200" /><span className="text-sm text-slate-600">Fideles : 42%</span></div>
              <p className="text-[10px] text-slate-400">Taux fidélisation : 42%</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2">Top clients</p>
            {[
              { name: 'Patrick M.', orders: 14, revenue: 280 },
              { name: 'Sarah K.', orders: 8, revenue: 162 },
              { name: 'Alain T.', orders: 6, revenue: 110 },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-[#0F172A]">{i + 1}. {c.name}</span>
                <span className="text-xs text-slate-500">{c.orders} cmd · {formatPrice(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 11: Reputation + Section 12: Growth Advisor ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Evolution de la note</h2>
          <div className="flex items-start gap-6 mb-4">
            <div className="shrink-0">
              <p className="text-3xl font-extrabold text-[#0F172A]">5.0 <span className="text-lg text-slate-400">/ 5</span></p>
              <div className="flex items-center gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Icon key={s} name="star" className={`w-4 h-4 ${s <= 5 ? 'text-yellow-400' : 'text-slate-200'}`} />)}</div>
              <p className="text-xs text-slate-400 mt-1">{partnerReviews.length || partner?.reviewCount || 2} avis ce mois</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5,4,3,2,1].map(stars => {
                const count = partnerReviews.filter(r => r.rating === stars).length || (stars === 5 ? 92 : stars === 4 ? 24 : stars === 3 ? 8 : stars === 2 ? 2 : 1);
                const total = 127;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-slate-500 text-right">{stars}</span>
                    <Icon name="star" className="w-3 h-3 text-yellow-400" />
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(count / total) * 100}%` }} /></div>
                    <span className="w-6 text-right text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Rating History Chart */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-3">Historique des notes</p>
            <svg viewBox="0 0 400 100" className="w-full h-24">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y, i) => (
                <line key={i} x1="40" y1={10 + y * 0.8} x2="390" y2={10 + y * 0.8} stroke="#F1F5F9" strokeWidth="1" />
              ))}
              {/* Y-axis labels */}
              {[3.5, 4.0, 4.5, 5.0].map((v, i) => (
                <text key={i} x="35" y={10 + (1 - (v - 3.5) / 1.5) * 80 + 4} textAnchor="end" className="text-[9px] fill-slate-400">{v}</text>
              ))}
              {/* Line */}
              <polyline fill="none" stroke="#005bd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="60,68 120,60 180,48 240,36 300,24 360,10" />
              {/* Area fill */}
              <polygon fill="url(#ratingGradient)" opacity="0.2" points="60,88 60,68 120,60 180,48 240,36 300,24 360,10 360,88" />
              {/* Points */}
              {[
                { x: 60, y: 68, label: '4.1' },
                { x: 120, y: 60, label: '4.3' },
                { x: 180, y: 48, label: '4.5' },
                { x: 240, y: 36, label: '4.6' },
                { x: 300, y: 24, label: '4.8' },
                { x: 360, y: 10, label: '5.0' },
              ].map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="4" fill="#005bd8" stroke="white" strokeWidth="2" />
                  <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] fill-brand-blue font-bold">{p.label}</text>
                </g>
              ))}
              {/* X-axis labels */}
              {['Dec', 'Jan', 'Fev', 'Mar', 'Avr', 'Mai'].map((m, i) => (
                <text key={i} x={60 + i * 60} y="98" textAnchor="middle" className="text-[9px] fill-slate-400">{m}</text>
              ))}
              <defs>
                <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#005bd8" />
                  <stop offset="100%" stopColor="#005bd8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex items-center gap-2 text-sm mt-3">
            <Icon name="clock" className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Temps reponse moyen : <strong className="text-[#0F172A]">5 min</strong></span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-brand-blue to-brand-blue-700 rounded-xl"><Icon name="sparkles" className="w-5 h-5 text-white" /></div>
            <div><h2 className="text-lg font-bold text-[#0F172A]">Growth Advisor</h2><p className="text-xs text-slate-400">Conseils pour devenir #1</p></div>
          </div>
          <div className="space-y-2">
            {[
              { action: 'Ajoutez une video de presentation', gain: '+8%', icon: 'play', color: 'from-blue-500 to-blue-600' },
              { action: 'Ajoutez 3 photos supplementaires', gain: '+4%', icon: 'photo', color: 'from-purple-500 to-purple-600' },
              { action: 'Repondez aux avis clients', gain: '+5%', icon: 'chatBubble', color: 'from-green-500 to-green-600' },
              { action: 'Creez une promotion sur costumes', gain: '+12%', icon: 'sparkles', color: 'from-orange-500 to-orange-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color}`}><Icon name={item.icon as any} className="w-3.5 h-3.5 text-white" /></div>
                  <div><p className="text-sm font-medium text-[#0F172A]">{item.action}</p><p className="text-[10px] text-slate-400">Impact estime : {item.gain} visibilite</p></div>
                </div>
                <button className="px-3 py-1 text-[10px] font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition">Ajouter</button>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl flex items-center justify-between">
            <p className="text-xs font-bold text-[#0F172A]">Impact potentiel total</p>
            <span className="text-sm font-extrabold text-brand-blue">+15% a +20% visibilite</span>
          </div>
        </div>
      </div>

      {/* ─── Section 13: Monthly Executive Summary ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🚀</span>
          <div>
            <h3 className="text-lg font-extrabold text-white">Resume du mois</h3>
            <p className="text-sm text-white/80">Continuez comme ca ! Vos performances sont en hausse.</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center"><p className="text-xl font-extrabold text-white">+18%</p><p className="text-[10px] text-white/70">Revenus</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">+12%</p><p className="text-[10px] text-white/70">Commandes</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">+23%</p><p className="text-[10px] text-white/70">Visibilite</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">#3→#2</p><p className="text-[10px] text-white/70">Classement</p></div>
          <div className="text-center"><p className="text-xl font-extrabold text-white">72→81</p><p className="text-[10px] text-white/70">Score</p></div>
        </div>
        {setSection && <button onClick={() => setSection('dashboard')} className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Voir le tableau de bord</button>}
      </div>
    </div>
  );
};
