import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface InventoryProps { setSection?: (section: PartnerSection) => void; }

/* ─── SVG Donut ─── */
const Donut: React.FC<{ segments: { value: number; color: string; label: string }[]; size?: number }> = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 40; const circumference = 2 * Math.PI * r;
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
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-600 truncate">{seg.label}</span>
            <span className="font-bold text-[#0F172A] ml-auto">{total > 0 ? Math.round((seg.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── MAIN INVENTORY ─── */
export const InventoryManagement: React.FC<InventoryProps> = ({ setSection }) => {
  const { user, partners, formatPrice } = useAppContext();
  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  /* ─── Mock Data ─── */
  const consumables = useMemo(() => [
    { name: 'Lessive industrielle', category: 'Lessive', stock: 12, unit: 'L', threshold: 20, cost: 32, icon: '🧪' },
    { name: 'Détachant puissant', category: 'Détachant', stock: 1.8, unit: 'L', threshold: 5, cost: 18, icon: '🧴' },
    { name: 'Assouplissant', category: 'Assouplissant', stock: 8, unit: 'L', threshold: 15, cost: 14, icon: '💧' },
    { name: 'Sacs de livraison', category: 'Emballage', stock: 10, unit: 'unités', threshold: 30, cost: 0.25, icon: '🛍️' },
    { name: 'Housses vêtements', category: 'Emballage', stock: 45, unit: 'unités', threshold: 50, cost: 0.15, icon: '👔' },
  ], []);

  const equipment = useMemo(() => [
    { name: 'Machine LG 40kg', state: 'Opérationnelle', lastMaint: '25 Avril 2026', nextMaint: '30 Mai 2026', daysLeft: 5 },
    { name: 'Séchoir industriel', state: 'Opérationnelle', lastMaint: '20 Avril 2026', nextMaint: '20 Mai 2026', daysLeft: 0 },
    { name: 'Repassage vapeur', state: 'Opérationnelle', lastMaint: '10 Avril 2026', nextMaint: '10 Juin 2026', daysLeft: 16 },
    { name: 'Machine 20kg', state: 'En maintenance', lastMaint: '05 Mai 2026', nextMaint: '15 Mai 2026', daysLeft: -1 },
    { name: 'Compresseur d\'air', state: 'Opérationnelle', lastMaint: '18 Avril 2026', nextMaint: '18 Juin 2026', daysLeft: 24 },
  ], []);

  const suppliers = useMemo(() => [
    { name: 'CleanPro RDC', phone: '+243 81 234 56 78', lastOrder: '18 Mai 2026', total: 320 },
    { name: 'Wash Supplies', phone: '+243 90 987 65 43', lastOrder: '10 Mai 2026', total: 210 },
    { name: 'ProDet Cleaners', phone: '+243 97 654 32 10', lastOrder: '02 Mai 2026', total: 150 },
    { name: 'RDC Packaging', phone: '+243 81 456 78 90', lastOrder: '15 Mai 2026', total: 95 },
  ], []);

  const movements = useMemo(() => [
    { date: '25 Mai', article: 'Lessive', action: 'Entrée', qty: '+20 L', user: 'Patrice', color: 'text-[#22C55E]' },
    { date: '26 Mai', article: 'Lessive', action: 'Consommation', qty: '-3 L', user: 'Système', color: 'text-brand-blue' },
    { date: '27 Mai', article: 'Sacs', action: 'Entrée', qty: '+50', user: 'Patrice', color: 'text-[#22C55E]' },
    { date: '28 Mai', article: 'Assouplissant', action: 'Consommation', qty: '-1.5 L', user: 'Système', color: 'text-brand-blue' },
    { date: '28 Mai', article: 'Détachant', action: 'Ajustement', qty: '-0.2 L', user: 'Patrice', color: 'text-[#FF7A00]' },
  ], []);

  const automations = useMemo(() => [
    { rule: 'Alerte stock faible', condition: 'Stock Lessive industrielle < 10 L', action: 'Notifier par email & WhatsApp', enabled: true },
    { rule: 'Alerte stock faible', condition: 'Stock Sacs de livraison < 20 unités', action: 'Notifier par email & WhatsApp', enabled: true },
    { rule: 'Maintenance machine', condition: 'Machine maintenance dans 7 jours', action: 'Notification push', enabled: false },
  ], []);

  /* ─── Computed Stats ─── */
  const stats = useMemo(() => {
    const alerts = consumables.filter(c => c.stock < c.threshold * 0.2).length;
    const criticaItems = consumables.filter(c => c.stock < c.threshold * 0.2).length;
    const stockValue = consumables.reduce((s, c) => s + c.stock * c.cost, 0);
    const monthlyConsumption = 85;
    return { totalItems: consumables.length, alerts, stockValue, monthlyConsumption, criticaItems, reorderIn: 5 };
  }, [consumables]);

  const consumptionData = useMemo(() => {
    const days = 30;
    const result: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i -= 3) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      result.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        values: [
          { name: 'Lessive', value: 20 + Math.random() * 30, color: '#005bd8' },
          { name: 'Détachant', value: 10 + Math.random() * 15, color: '#22C55E' },
          { name: 'Assouplissant', value: 8 + Math.random() * 10, color: '#8B5CF6' },
          { name: 'Sacs', value: 5 + Math.random() * 8, color: '#FF7A00' },
        ],
      });
    }
    return result;
  }, []);

  if (!partner) return null;

  const inventoryScore = 85;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Inventaire & Fournitures</h1>
          <p className="text-sm text-slate-500 mt-1">Suivez vos consommables, machines et anticipez les ruptures de stock.</p>
        </div>
        <button className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition flex items-center gap-2">
          <Icon name="plus" className="w-4 h-4" />Ajouter un article
        </button>
      </div>

      {/* ─── 6 KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Consommables actifs', value: String(stats.totalItems), change: '+3 ce mois', icon: 'archive-box', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'Alertes stock', value: String(stats.alerts), sub: 'Voir les alertes', icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]', alert: stats.alerts > 0 },
          { label: 'Valeur stock', value: formatPrice(stats.stockValue), change: '+12% ce mois', icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Consommation mois', value: formatPrice(stats.monthlyConsumption), change: '+8% ce mois', icon: 'chartBar', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Produits critiques', value: String(stats.criticaItems), sub: 'Voir détails', icon: 'heart', bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Réapprovisionnement', value: `Dans ${stats.reorderIn} j`, sub: 'Prévu le 28 Mai', icon: 'calendar', bg: 'bg-cyan-50', color: 'text-cyan-600' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white rounded-2xl border ${kpi.alert ? 'border-orange-200' : 'border-slate-100'} p-4 hover:shadow-md transition`}>
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
            {kpi.change && <p className="text-[10px] font-bold text-[#22C55E] mt-0.5">{kpi.change}</p>}
            {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5 cursor-pointer hover:text-brand-blue">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Alertes de stock ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#0F172A]">Alertes de stock</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{stats.alerts}</span>
          </div>
          <button className="text-xs font-bold text-brand-blue hover:underline">Voir toutes les alertes →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {consumables.filter(c => c.stock < c.threshold * 0.5).map((item, i) => {
            const pct = Math.round((item.stock / item.threshold) * 100);
            const barColor = pct < 20 ? 'bg-red-500' : pct < 50 ? 'bg-[#FF7A00]' : 'bg-[#22C55E]';
            return (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{item.name}</p>
                    <p className="text-[10px] text-slate-400">Stock restant : {pct}% ({item.stock} {item.unit})</p>
                  </div>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Seuil : {item.threshold} {item.unit}</span>
                  <button className="px-3 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition">Commander</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Consommables + Machines ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Consommables</h2>
            <button className="text-xs font-bold text-brand-blue hover:underline">Voir tout →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] text-slate-500">ARTICLE</th>
                <th className="text-left py-2 text-[10px] text-slate-500">STOCK</th>
                <th className="text-center py-2 text-[10px] text-slate-500">STATUT</th>
                <th className="text-right py-2 text-[10px] text-slate-500">COÛT</th>
                <th className="text-center py-2 text-[10px] text-slate-500">ACTIONS</th>
              </tr></thead>
              <tbody>
                {consumables.map((item, i) => {
                  const pct = Math.round((item.stock / item.threshold) * 100);
                  const status = pct < 20 ? { label: 'Alerte', color: 'bg-red-50 text-red-600' } : pct < 50 ? { label: 'Attention', color: 'bg-orange-50 text-[#FF7A00]' } : { label: 'OK', color: 'bg-green-50 text-[#22C55E]' };
                  return (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon}</span>
                          <div><p className="text-xs font-bold text-[#0F172A]">{item.name}</p><p className="text-[10px] text-slate-400">{item.category}</p></div>
                        </div>
                      </td>
                      <td className="py-2.5 text-xs font-medium text-[#0F172A]">{item.stock} {item.unit}</td>
                      <td className="py-2.5 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span></td>
                      <td className="py-2.5 text-xs font-bold text-right text-[#0F172A]">{formatPrice(item.cost)}</td>
                      <td className="py-2.5 text-center"><button className="p-1 hover:bg-slate-100 rounded"><Icon name="pencil" className="w-3 h-3 text-slate-400" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Machines & Équipements</h2>
            <button className="text-xs font-bold text-brand-blue hover:underline">Gérer les maintenances →</button>
          </div>
          <div className="space-y-2.5">
            {equipment.map((eq, i) => {
              const stateColor = eq.state === 'Opérationnelle' ? 'bg-green-50 text-[#22C55E]' : eq.state === 'En maintenance' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-red-50 text-red-500';
              const daysColor = eq.daysLeft < 0 ? 'text-red-500' : eq.daysLeft <= 7 ? 'text-[#FF7A00]' : 'text-slate-500';
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Icon name="truck" className="w-4 h-4 text-brand-blue" /></div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{eq.name}</p>
                      <p className="text-[10px] text-slate-400">Maint. : {eq.lastMaint}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stateColor}`}>{eq.state}</span>
                    <p className={`text-[10px] font-medium mt-0.5 ${daysColor}`}>{eq.daysLeft < 0 ? `En retard (${Math.abs(eq.daysLeft)}j)` : eq.daysLeft === 0 ? "Aujourd'hui" : `${eq.daysLeft} jours`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Consommation + Coût opérationnel ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Consommation des 30 derniers jours</h2>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">30 jours</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            {['Lessive', 'Détachant', 'Assouplissant', 'Sacs'].map((n, i) => (
              <span key={n} className="flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#005bd8', '#22C55E', '#8B5CF6', '#FF7A00'][i] }} />{n}
              </span>
            ))}
          </div>
          <svg viewBox="0 0 400 150" className="w-full h-36">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <g key={i}>
                <line x1="40" y1={10 + (1 - pct) * 130} x2="390" y2={10 + (1 - pct) * 130} stroke="#F1F5F9" strokeWidth="1" />
                <text x="35" y={14 + (1 - pct) * 130} textAnchor="end" className="text-[8px] fill-slate-400">${Math.round(pct * 80)}</text>
              </g>
            ))}
            {['Lessive', 'Détachant', 'Assouplissant', 'Sacs'].map((name, si) => {
              const color = ['#005bd8', '#22C55E', '#8B5CF6', '#FF7A00'][si];
              const max = 50;
              const pts = consumptionData.map((d, i) => `${40 + (i / (consumptionData.length - 1)) * 350},${10 + (1 - (d.values[si]?.value || 0) / max) * 130}`).join(' ');
              return <polyline key={si} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts} />;
            })}
            {consumptionData.map((d, i) => (
              <text key={i} x={40 + (i / (consumptionData.length - 1)) * 350} y="145" textAnchor="middle" className="text-[8px] fill-slate-400">{d.label}</text>
            ))}
          </svg>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Coût opérationnel ce mois</h2>
          <div className="flex items-center gap-6">
            <Donut segments={[
              { value: 85, color: '#005bd8', label: 'Consommables' },
              { value: 60, color: '#22C55E', label: 'Eau' },
              { value: 80, color: '#8B5CF6', label: 'Electricité' },
              { value: 50, color: '#FF7A00', label: 'Maintenance' },
              { value: 45, color: '#64748B', label: 'Transport' },
            ]} size={130} />
            <div className="flex-1">
              <div className="space-y-2">
                {[
                  { label: 'Consommables', value: 85, color: 'bg-brand-blue' },
                  { label: 'Eau', value: 60, color: 'bg-[#22C55E]' },
                  { label: 'Electricité', value: 80, color: 'bg-[#8B5CF6]' },
                  { label: 'Maintenance', value: 50, color: 'bg-[#FF7A00]' },
                  { label: 'Transport', value: 45, color: 'bg-[#64748B]' },
                ].map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c.color}`} /><span className="text-slate-600">{c.label}</span></div>
                    <span className="font-bold text-[#0F172A]">{formatPrice(c.value)} <span className="text-slate-400 font-normal">{Math.round(c.value / 3.2)}%</span></span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">Total estimé</p>
                <p className="text-xl font-extrabold text-[#0F172A]">{formatPrice(320)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fournisseurs + Automatisation ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Fournisseurs</h2>
            <button className="px-3 py-1.5 text-[10px] font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"><Icon name="plus" className="w-3 h-3" />Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] text-slate-500">FOURNISSEUR</th>
                <th className="text-left py-2 text-[10px] text-slate-500">TÉLÉPHONE</th>
                <th className="text-left py-2 text-[10px] text-slate-500">DERNIÈRE CMD</th>
                <th className="text-right py-2 text-[10px] text-slate-500">TOTAL</th>
                <th className="text-center py-2 text-[10px] text-slate-500">ACTIONS</th>
              </tr></thead>
              <tbody>
                {suppliers.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 text-xs font-bold text-[#0F172A]">{s.name}</td>
                    <td className="py-2.5 text-xs text-slate-500">{s.phone}</td>
                    <td className="py-2.5 text-xs text-slate-500">{s.lastOrder}</td>
                    <td className="py-2.5 text-xs font-bold text-right text-[#0F172A]">{formatPrice(s.total)}</td>
                    <td className="py-2.5 text-center"><button className="p-1 hover:bg-slate-100 rounded"><Icon name="pencil" className="w-3 h-3 text-slate-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Automatisation & Alertes</h2>
            <button className="px-3 py-1.5 text-[10px] font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-1"><Icon name="plus" className="w-3 h-3" />Nouvelle règle</button>
          </div>
          <div className="space-y-3">
            {automations.map((a, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-[#0F172A]">{a.rule}</p>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${a.enabled ? 'bg-[#22C55E]' : 'bg-slate-300'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-3.5' : ''}`} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">Si {a.condition}</p>
                <p className="text-[10px] text-brand-blue">Action : {a.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Mouvements + Rapports ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Mouvements de stock</h2>
          <div className="flex gap-1.5 mb-3">
            {['Tous', 'Entrées', 'Sorties', 'Ajustements'].map((f, i) => (
              <button key={i} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition ${i === 0 ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-2">
            {movements.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 w-14">{m.date}</span>
                  <span className="text-xs font-medium text-[#0F172A]">{m.article}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{m.user}</span>
                  <span className={`text-xs font-bold ${m.color}`}>{m.qty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4">Rapports & Export</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'document-text', label: 'Rapport inventaire', format: 'PDF', color: 'text-red-500' },
              { icon: 'arrow-down-tray', label: 'Consommation', format: 'Excel', color: 'text-[#22C55E]' },
              { icon: 'arrow-down-tray', label: 'Mouvements stock', format: 'CSV', color: 'text-brand-blue' },
              { icon: 'document-text', label: 'Évaluation stock', format: 'PDF', color: 'text-red-500' },
            ].map((exp, i) => (
              <button key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <Icon name={exp.icon as any} className={`w-5 h-5 ${exp.color}`} />
                <div className="text-left"><p className="text-xs font-bold text-[#0F172A]">{exp.label}</p><p className="text-[10px] text-slate-400">{exp.format}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Score Inventaire ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="text-lg font-bold text-[#0F172A] mb-3">Santé de l'inventaire</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="85 15" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-extrabold text-[#0F172A]">{inventoryScore}</span><span className="text-[9px] text-slate-400">/100</span></div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#22C55E] mb-2">Excellent</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Stock suffisant', ok: true },
                { label: 'Maintenance à jour', ok: true },
                { label: 'Alertes traitées', ok: false },
                { label: 'Historique propre', ok: true },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <Icon name={c.ok ? 'check' : 'xmark'} className={`w-3.5 h-3.5 ${c.ok ? 'text-[#22C55E]' : 'text-[#FF7A00]'}`} />
                  <span className={c.ok ? 'text-[#0F172A]' : 'text-[#FF7A00]'}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">📦</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Anticipez vos besoins et evitez les ruptures de stock</h3>
            <p className="text-xs text-white/80">Maintenez toujours un niveau optimal pour ne jamais manquer de produits.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Commander maintenant</button>
      </div>
    </div>
  );
};
