import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';

interface DeliveryProps { setSection?: (section: PartnerSection) => void; }

/* ─── SVG Donut ─── */
const Donut: React.FC<{ segments: { value: number; color: string }[]; size?: number }> = ({ segments, size = 100 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const r = 35; const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const dash = (pct / 100) * c;
        const prev = cumulative;
        cumulative += pct;
        return <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="8" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-prev / 100 * c} />;
      })}
    </svg>
  );
};

/* ─── MAIN DELIVERY V2 ─── */
export const DeliverySettings: React.FC<DeliveryProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, formatPrice } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'delivered' | 'issues'>('all');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  /* ─── Mock Data ─── */
  const deliveries = useMemo(() => {
    const statuses = ['En livraison', 'Livre', 'En attente', 'Echec', 'En route', 'Livre', 'Livre', 'Livre'] as const;
    const communes = ['Gombe', 'Ngaliema', 'Limete', 'Kintambo', 'Bandalungwa'];
    const drivers = ['Jean L.', 'David K.', 'Marie T.', 'Paul M.'];
    const clients = ['Patrick M.', 'Sarah K.', 'Alain T.', 'Marie L.', 'Entreprise ABC'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: `DEL-2026-${String(i + 1).padStart(3, '0')}`,
      orderNumber: `ORDER-20${48 - i}`,
      client: clients[i % 5],
      commune: communes[i % 5],
      driver: drivers[i % 4],
      amount: 12 + Math.floor(Math.random() * 35),
      status: statuses[i % 8] as string,
      time: `${9 + (i % 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      date: new Date(Date.now() - i * 3600000 * 4).toLocaleDateString('fr-FR'),
    }));
  }, []);

  const filteredDeliveries = useMemo(() => {
    let result = deliveries;
    if (activeTab === 'active') result = result.filter(d => d.status === 'En livraison' || d.status === 'En route');
    else if (activeTab === 'delivered') result = result.filter(d => d.status === 'Livre');
    else if (activeTab === 'issues') result = result.filter(d => d.status === 'Echec');
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d => d.client.toLowerCase().includes(q) || d.commune.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    }
    return result;
  }, [deliveries, activeTab, search]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const inProgress = deliveries.filter(d => d.status === 'En livraison' || d.status === 'En route').length;
    const delivered = deliveries.filter(d => d.status === 'Livre').length;
    const failed = deliveries.filter(d => d.status === 'Echec').length;
    return { inProgress, toDeliver: 3, deliveredToday: 18, avgTime: 45, successRate: 98, delays: 2, disputes: 1, revenue: 125 };
  }, [deliveries]);

  const zones = useMemo(() => [
    { commune: 'Gombe', volume: 120, avgTime: '24 min', cost: 0, satisfaction: 4.9, profitability: 92, deliveries: 42 },
    { commune: 'Ngaliema', volume: 85, avgTime: '35 min', cost: 1, satisfaction: 4.7, profitability: 85, deliveries: 18 },
    { commune: 'Limete', volume: 62, avgTime: '30 min', cost: 1, satisfaction: 4.8, profitability: 88, deliveries: 12 },
    { commune: 'Kintambo', volume: 45, avgTime: '40 min', cost: 2, satisfaction: 4.5, profitability: 78, deliveries: 8 },
    { commune: 'Bandalungwa', volume: 38, avgTime: '45 min', cost: 2, satisfaction: 4.4, profitability: 72, deliveries: 5 },
  ], []);

  const drivers = useMemo(() => [
    { name: 'Jean L.', state: 'Actif', total: 1250, avgTime: '32 min', rating: 4.9, success: 99, avatar: 'J', remaining: '1h45' },
    { name: 'David K.', state: 'Actif', total: 890, avgTime: '38 min', rating: 4.7, success: 97, avatar: 'D', remaining: '45min' },
    { name: 'Marie T.', state: 'Actif', total: 560, avgTime: '42 min', rating: 4.8, success: 98, avatar: 'M', remaining: '30min' },
    { name: 'Paul M.', state: 'Inactif', total: 2100, avgTime: '28 min', rating: 4.9, success: 99, avatar: 'P', remaining: '0' },
  ], []);

  const disputes = useMemo(() => [
    { id: 'DISP-001', client: 'Patrick M.', reason: 'Client absent', status: 'En attente', amount: 18 },
    { id: 'DISP-002', client: 'Sarah K.', reason: 'Adresse erronée', status: 'Resolu', amount: 12 },
    { id: 'DISP-003', client: 'Alain T.', reason: 'Article manquant', status: 'En cours', amount: 24 },
  ], []);

  const activity = useMemo(() => [
    { time: '10:25', icon: 'shoppingBag', color: 'text-[#0077B6]', title: 'Commande DEL-001 creee', detail: 'Patrick M. — Gombe' },
    { time: '10:32', icon: 'user', color: 'text-purple-500', title: 'Livreur assigne', detail: 'Jean L. → DEL-001' },
    { time: '10:41', icon: 'truck', color: 'text-[#FF7A00]', title: 'Ramassage effectue', detail: 'DEL-001 chez Prestige Pressing' },
    { time: '11:02', icon: 'check', color: 'text-[#22C55E]', title: 'Livraison confirmee', detail: 'DEL-001 — Patrick M.' },
  ], []);

  if (!partner) return null;

  const getStatusStyle = (status: string) => {
    const s: Record<string, { color: string; bg: string }> = {
      'En livraison': { color: 'text-[#0077B6]', bg: 'bg-blue-50' },
      'En route': { color: 'text-cyan-600', bg: 'bg-cyan-50' },
      'Livre': { color: 'text-[#22C55E]', bg: 'bg-green-50' },
      'En attente': { color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
      'Echec': { color: 'text-red-500', bg: 'bg-red-50' },
    };
    return s[status] || { color: 'text-slate-500', bg: 'bg-slate-50' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Livraisons Enterprise</h1>
          <p className="text-sm text-slate-500 mt-1">Centre de controle logistique complet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"><Icon name="arrow-down-tray" className="w-3.5 h-3.5" />Exporter</button>
          <button className="px-4 py-2 bg-[#0077B6] text-white text-xs font-bold rounded-xl hover:bg-[#005f8f] transition flex items-center gap-2"><Icon name="plus" className="w-4 h-4" />Nouvelle livraison</button>
        </div>
      </div>

      {/* ─── Section 1: 8 KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'En cours', value: String(stats.inProgress), change: '+12%', icon: 'truck', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
          { label: 'A livrer', value: String(stats.toDeliver), icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Livre aujourd.', value: String(stats.deliveredToday), icon: 'check', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Temps moyen', value: `${stats.avgTime} min`, icon: 'clock', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Taux reussite', value: `${stats.successRate}%`, icon: 'shield-check', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Retards', value: String(stats.delays), icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Litiges', value: String(stats.disputes), icon: 'xmark', bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Revenus livraison', value: formatPrice(stats.revenue), icon: 'currencyDollar', bg: 'bg-cyan-50', color: 'text-cyan-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-md transition">
            <div className={`p-1.5 rounded-lg ${kpi.bg} w-fit mb-1.5`}><Icon name={kpi.icon as any} className={`w-3.5 h-3.5 ${kpi.color}`} /></div>
            <p className="text-[9px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-base font-extrabold text-[#0F172A]">{kpi.value}</p>
            {kpi.change && <p className="text-[9px] font-bold text-[#22C55E]">{kpi.change}</p>}
          </div>
        ))}
      </div>

      {/* ─── Section 2: Carte temps reel + Section 3: Livreurs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Centre logistique temps reel</h2>
          <div className="h-72 bg-slate-100 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 29px, #cbd5e1 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, #cbd5e1 30px)', backgroundSize: '30px 30px' }} />
            <div className="absolute inset-0">
              {[
                { name: 'Jean L.', x: '15%', y: '20%', orders: 3, color: 'bg-[#22C55E]', pulse: true },
                { name: 'David K.', x: '55%', y: '55%', orders: 2, color: 'bg-[#0077B6]', pulse: true },
                { name: 'Marie T.', x: '75%', y: '30%', orders: 1, color: 'bg-[#0077B6]', pulse: false },
              ].map((d, i) => (
                <div key={i} className="absolute" style={{ left: d.x, top: d.y }}>
                  <div className={`w-10 h-10 ${d.color} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${d.pulse ? 'animate-pulse' : ''}`}>
                    {d.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <p className="text-[9px] text-slate-600 font-medium mt-0.5 text-center whitespace-nowrap">{d.name} • {d.orders} cmd</p>
                </div>
              ))}
              {[
                { label: 'DEL-001', x: '25%', y: '35%', status: 'Livre', color: 'bg-[#22C55E]' },
                { label: 'DEL-002', x: '60%', y: '20%', status: 'En cours', color: 'bg-[#0077B6]' },
                { label: 'DEL-003', x: '40%', y: '70%', status: 'Ramassage', color: 'bg-[#FF7A00]' },
                { label: 'DEL-004', x: '80%', y: '65%', status: 'Retard', color: 'bg-red-500' },
              ].map((l, i) => (
                <div key={i} className="absolute" style={{ left: l.x, top: l.y }}>
                  <div className={`w-5 h-5 ${l.color} rounded flex items-center justify-center`}>
                    <Icon name="shoppingBag" className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-[8px] text-slate-600 font-medium mt-0.5">{l.label}</p>
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-3 py-1.5 text-[10px] font-medium text-slate-600 flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />Livre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0077B6]" />En cours</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF7A00]" />Ramassage</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500]" />Retard</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Livreurs actifs</h2>
          <div className="space-y-2">
            {drivers.filter(d => d.state === 'Actif').map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] font-bold text-[10px]">{d.avatar}</div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#0F172A]">{d.name}</p>
                    <p className="text-[9px] text-slate-400">{d.total} livraisons • {d.remaining}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#22C55E]">{d.rating}</p>
                    <p className="text-[9px] text-slate-400">{d.success}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Urgences + Section 5: Performance ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-red-100 rounded-lg"><Icon name="warning" className="w-4 h-4 text-red-500" /></div>
            <h2 className="text-sm font-bold text-red-700">Intervention immediate</h2>
          </div>
          <div className="space-y-2">
            {[
              { issue: 'Client absent', delivery: 'DEL-003', action: 'Contacter' },
              { issue: 'Retard > 30 min', delivery: 'DEL-004', action: 'Reassigner' },
              { issue: 'Adresse incomplete', delivery: 'DEL-005', action: 'Escalader' },
            ].map((u, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                  <Icon name="warning" className="w-3.5 h-3.5 text-red-500" />
                  <div><p className="text-xs font-bold text-[#0F172A]">{u.issue}</p><p className="text-[9px] text-slate-400">{u.delivery}</p></div>
                </div>
                <button className="px-2 py-1 text-[9px] font-bold bg-red-500 text-white rounded-lg">{u.action}</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Performance livraison</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Temps moyen', value: '45 min', change: '-15 min', icon: 'clock', bg: 'bg-green-50', color: 'text-[#22C55E]' },
              { label: 'Taux reussite', value: '98%', change: '+2%', icon: 'check', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
              { label: 'Litiges', value: '0.8%', change: '-0.3%', icon: 'warning', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
              { label: 'Satisfaction', value: '4.9/5', change: '+0.1', icon: 'star', bg: 'bg-yellow-50', color: 'text-yellow-500' },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1"><Icon name={p.icon as any} className={`w-3.5 h-3.5 ${p.color}`} /><span className="text-[10px] text-slate-500">{p.label}</span></div>
                <p className="text-lg font-extrabold text-[#0F172A]">{p.value}</p>
                <p className={`text-[9px] font-medium ${p.color}`}>{p.change}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 6: Top livreurs + Section 7: Zones ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Top livreurs</h2>
          <div className="space-y-2">
            {drivers.sort((a, b) => b.rating - a.rating).slice(0, 4).map((d, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[#0077B6]/10 text-[#0077B6]'}`}>{d.avatar}</div>
                  <div><p className="text-xs font-bold text-[#0F172A]">{d.name}</p><p className="text-[9px] text-slate-400">{d.total} livraisons • {d.avgTime}</p></div>
                </div>
                <div className="text-right"><p className="text-sm font-extrabold text-[#0F172A]">{d.rating}</p><p className="text-[9px] text-[#22C55E]">{d.success}%</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Zones de livraison</h2>
          <div className="space-y-2">
            {zones.map((z, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0F172A]">{z.commune}</span>
                  <span className="text-xs font-bold text-[#0F172A]">{z.deliveries} cmd</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>{z.avgTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5"><Icon name="star" className="w-2.5 h-2.5 text-yellow-400" />{z.satisfaction}</span>
                  <span>•</span>
                  <span className="text-[#22C55E]">{z.profitability}% rent.</span>
                </div>
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-[#0077B6] rounded-full" style={{ width: `${z.profitability}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 8: Previsions IA + Section 9: Rentabilite ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#0077B6] to-[#005f8f] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="sparkles" className="w-5 h-5" />
            <h2 className="text-sm font-bold">Previsions IA — Demain</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Livraisons prevues</p><p className="text-xl font-extrabold">24</p></div>
            <div className="bg-white/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Zone la plus active</p><p className="text-xl font-extrabold">Gombe</p></div>
            <div className="bg-white/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Pic d'activite</p><p className="text-xl font-extrabold">17h-19h</p></div>
            <div className="bg-white/10 rounded-xl p-3"><p className="text-[10px] text-white/70">Livreurs recommandes</p><p className="text-xl font-extrabold">3</p></div>
          </div>
          <button className="w-full py-2 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition">Optimiser automatiquement</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Rentabilite livraison</h2>
          <div className="flex items-center gap-6 mb-4">
            <Donut segments={[
              { value: 120, color: '#22C55E' },
              { value: 20, color: '#FF7A00' },
              { value: 25, color: '#EF4444' },
            ]} size={100} />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" />Revenu</span><span className="font-bold">{formatPrice(120)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF7A00]" />Cout livreur</span><span className="font-bold">{formatPrice(20)}</span></div>
              <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Cout carburant</span><span className="font-bold">{formatPrice(25)}</span></div>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F172A]">Marge livraison</span>
            <span className="text-lg font-extrabold text-[#22C55E]">{formatPrice(75)}</span>
          </div>
        </div>
      </div>

      {/* ─── Section 10: Litiges + Section 11: Activite ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Litiges ({disputes.length})</h2>
          <div className="space-y-2">
            {disputes.map((d, i) => {
              const st = d.status === 'Resolu' ? 'bg-green-50 text-[#22C55E]' : d.status === 'En cours' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-blue-50 text-[#0077B6]';
              return (
                <div key={i} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400">{d.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st}`}>{d.status}</span>
                  </div>
                  <p className="text-xs font-bold text-[#0F172A]">{d.client}</p>
                  <p className="text-[10px] text-slate-400">{d.reason} • {formatPrice(d.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Activite logistique</h2>
          <div className="space-y-2.5">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-slate-100 shrink-0"><Icon name={a.icon as any} className={`w-3 h-3 ${a.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#0F172A]">{a.title}</p>
                  <p className="text-[9px] text-slate-400 truncate">{a.detail}</p>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 12: Livraisons principales ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F172A]">Toutes les livraisons ({filteredDeliveries.length})</h2>
        </div>
        <div className="relative mb-3">
          <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]" />
        </div>
        <div className="flex gap-1.5 mb-3">
          {(['all', 'active', 'delivered', 'issues'] as const).map(f => {
            const labels = { all: 'Toutes', active: 'En cours', delivered: 'Livrees', issues: 'Problemes' };
            return <button key={f} onClick={() => setActiveTab(f)} className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${activeTab === f ? 'bg-[#0077B6] text-white' : 'bg-slate-100 text-slate-600'}`}>{labels[f]}</button>;
          })}
        </div>
        <div className="space-y-2">
          {filteredDeliveries.slice(0, 8).map((d, i) => {
            const st = getStatusStyle(d.status);
            const initials = d.client.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-slate-100 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] font-bold text-xs">{initials}</div>
                  <div><p className="text-xs font-bold text-[#0F172A]">{d.client}</p><p className="text-[9px] text-slate-400">{d.id} • {d.commune} • {d.driver}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{d.status}</span>
                  <span className="text-xs font-extrabold text-[#0F172A]">{formatPrice(d.amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Section 13: Exports + Section 14: Footer ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-[#0F172A] mb-3">Rapports & Export</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: 'document-text', label: 'Rapport logistique', format: 'PDF', color: 'text-red-500' },
            { icon: 'arrow-down-tray', label: 'Rapport livreurs', format: 'Excel', color: 'text-[#22C55E]' },
            { icon: 'arrow-down-tray', label: 'Rapport zones', format: 'CSV', color: 'text-[#0077B6]' },
            { icon: 'document-text', label: 'Rapport rentabilite', format: 'PDF', color: 'text-red-500' },
          ].map((exp, i) => (
            <button key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <Icon name={exp.icon as any} className={`w-5 h-5 ${exp.color}`} />
              <div className="text-left"><p className="text-xs font-bold text-[#0F172A]">{exp.label}</p><p className="text-[9px] text-slate-400">{exp.format}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-[#0077B6] to-[#005f8f] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🚀</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Optimisez vos livraisons</h3>
            <p className="text-xs text-white/80">Assignez un livreur et gagnez du temps sur vos livraisons.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-[#0077B6] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Gerer mes livreurs</button>
      </div>
    </div>
  );
};
