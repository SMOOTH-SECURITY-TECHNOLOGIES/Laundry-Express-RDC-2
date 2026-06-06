import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { OrderStatus, PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';
import { PartnerGeneratedDocument, realApi } from '../../services/real-api';

type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue' | 'cancelled' | 'proforma';

interface InvoiceDoc {
  id: string;
  type: 'Facture' | 'Proforma';
  client: string;
  phone: string;
  commune: string;
  date: string;
  amount: number;
  status: 'Payee' | 'En attente' | 'En retard' | 'Envoyee' | 'Annulee';
  paymentMethod: string;
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  'Payee': { color: 'text-[#22C55E]', bg: 'bg-green-50' },
  'En attente': { color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
  'En retard': { color: 'text-red-500', bg: 'bg-red-50' },
  'Envoyee': { color: 'text-brand-blue', bg: 'bg-blue-50' },
  'Annulee': { color: 'text-slate-400', bg: 'bg-slate-50' },
};

const InvoiceModal: React.FC<{ document: PartnerGeneratedDocument; onClose: () => void }> = ({ document, onClose }) => {
  const { formatPrice } = useAppContext();
  const { payload } = document;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-[#0F172A]">{document.document_type === 'proforma' ? 'Proforma' : 'Facture'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><Icon name="xmark" className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="font-bold text-[#0F172A]">{payload.partner_name}</p><p className="text-xs text-slate-500">{payload.partner_address}</p></div>
            <div className="text-right"><p className="text-xs text-slate-500">Commande</p><p className="font-bold text-[#0F172A]">{payload.order_number}</p></div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl mb-6">
            <p className="text-xs text-slate-500 mb-0.5">Client</p>
            <p className="font-bold text-[#0F172A]">{payload.customer_name}</p>
            <p className="text-xs text-slate-500">{payload.customer_phone} • {payload.customer_address}</p>
          </div>
          <table className="w-full text-sm mb-6">
            <thead><tr className="bg-slate-50 rounded-lg"><th className="p-2 text-left text-xs text-slate-500">Article</th><th className="p-2 text-center text-xs text-slate-500">Qte</th><th className="p-2 text-right text-xs text-slate-500">Prix</th><th className="p-2 text-right text-xs text-slate-500">Total</th></tr></thead>
            <tbody>
              {payload.line_items.map((item, i) => (
                <tr key={i} className="border-b border-slate-50"><td className="p-2 text-[#0F172A]">{item.description}</td><td className="p-2 text-center">{Number(item.quantity || 0)}</td><td className="p-2 text-right">{formatPrice(Number(item.unit_price || 0))}</td><td className="p-2 text-right font-bold">{formatPrice(Number(item.line_total || 0))}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end"><div className="w-48 space-y-1">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Sous-total</span><span>{formatPrice(Number(payload.subtotal_amount || 0))}</span></div>
            {Number(payload.discount_amount || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Remise</span><span className="text-red-500">-{formatPrice(Number(payload.discount_amount || 0))}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-brand-blue">{formatPrice(Number(payload.total_amount || 0))}</span></div>
          </div></div>
        </div>
      </div>
    </div>
  );
};

interface InvoicingProps { setSection?: (section: PartnerSection) => void; }

export const InvoicingPage: React.FC<InvoicingProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, formatPrice } = useAppContext();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceFilter>('all');
  const [modalDocument, setModalDocument] = useState<PartnerGeneratedDocument | null>(null);

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);
  const allOrders = useMemo(() => user?.partnerId ? getOrdersForPartner(user.partnerId) : [], [user, getOrdersForPartner]);
  const completedOrders = useMemo(() => allOrders.filter(o => o.status === OrderStatus.COMPLETED), [allOrders]);

  const invoices = useMemo<InvoiceDoc[]>(() => {
    const statuses = ['Payee', 'En attente', 'En retard', 'Envoyee'] as const;
    const methods = ['Mobile Money', 'Especes', 'Virement', 'Carte'];
    return completedOrders.map((o, i) => ({
      id: `INV-2026-${String(i + 1).padStart(3, '0')}`,
      type: i % 5 === 0 ? 'Proforma' : 'Facture',
      client: o.clientDetails?.name || 'Client',
      phone: o.clientDetails?.phone || '',
      commune: o.clientDetails?.pickupAddress?.commune || 'Gombe',
      date: o.createdAt,
      amount: o.totalPrice,
      status: i < 3 ? 'Payee' : i < 5 ? 'En attente' : i < 7 ? 'En retard' : 'Envoyee',
      paymentMethod: methods[i % methods.length],
    }));
  }, [completedOrders]);

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    if (filter === 'paid') result = result.filter(i => i.status === 'Payee');
    else if (filter === 'pending') result = result.filter(i => i.status === 'En attente');
    else if (filter === 'overdue') result = result.filter(i => i.status === 'En retard');
    else if (filter === 'cancelled') result = result.filter(i => i.status === 'Annulee');
    else if (filter === 'proforma') result = result.filter(i => i.type === 'Proforma');
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i => i.id.toLowerCase().includes(q) || i.client.toLowerCase().includes(q) || i.phone.includes(q));
    }
    return result;
  }, [invoices, filter, search]);

  const stats = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'Payee');
    const pending = invoices.filter(i => i.status === 'En attente');
    const overdue = invoices.filter(i => i.status === 'En retard');
    const collected = paid.reduce((s, i) => s + i.amount, 0);
    const total = invoices.reduce((s, i) => s + i.amount, 0);
    const awaiting = pending.reduce((s, i) => s + i.amount, 0);
    const overdueAmount = overdue.reduce((s, i) => s + i.amount, 0);
    const availableBalance = collected * 0.85;
    const healthScore = Math.min(100, Math.round(85 + (paid.length / Math.max(invoices.length, 1)) * 15 - (overdue.length * 5)));
    const dailyAvg = completedOrders.length > 0 ? total / Math.max(new Set(completedOrders.map(o => o.createdAt.slice(0, 10))).size, 1) : 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dayOfMonth = new Date().getDate();
    const forecast = Math.round(dailyAvg * (daysInMonth - dayOfMonth) + total);
    return { count: invoices.length, total, collected, awaiting, unpaidCount: overdue.length, overdueAmount, avgDays: 4.2, availableBalance, healthScore, forecast, dailyAvg };
  }, [invoices, completedOrders]);

  const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'En attente' || i.status === 'En retard').slice(0, 3), [invoices]);

  const topClients = useMemo(() => {
    const clients: Record<string, { count: number; total: number }> = {};
    invoices.forEach(i => { clients[i.client] = clients[i.client] || { count: 0, total: 0 }; clients[i.client].count++; clients[i.client].total += i.amount; });
    return Object.entries(clients).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [invoices]);

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

  const revenueData = useMemo(() => {
    const days = 30;
    const result: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayOrders = completedOrders.filter(o => o.createdAt.startsWith(ds));
      const billed = dayOrders.reduce((s, o) => s + o.totalPrice, 0);
      const collected = Math.round(billed * 0.88);
      result.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        values: [
          { name: 'Facture', value: billed, color: '#005bd8' },
          { name: 'Encaisse', value: collected, color: '#22C55E' },
          { name: 'En attente', value: billed - collected, color: '#FF7A00' },
        ],
      });
    }
    return result;
  }, [completedOrders]);

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Facturation & Documents</h1>
          <p className="text-sm text-slate-500 mt-1">Gerez vos factures, proformas, paiements et documents comptables.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"><Icon name="arrow-down-tray" className="w-3.5 h-3.5" />PDF</button>
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"><Icon name="arrow-down-tray" className="w-3.5 h-3.5" />Excel</button>
          <button className="px-3 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition">Proforma</button>
          <button className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition">+ Creer facture</button>
        </div>
      </div>

      {/* ─── 6 KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Factures ce mois', value: String(stats.count), change: '+18%', icon: 'document-text', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'CA facture', value: formatPrice(stats.total), change: '+12%', icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Montant encaisse', value: formatPrice(stats.collected), sub: `${stats.total > 0 ? Math.round((stats.collected / stats.total) * 100) : 0}% du CA`, icon: 'check', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'En attente paiement', value: formatPrice(stats.awaiting), sub: `${stats.total > 0 ? Math.round((stats.awaiting / stats.total) * 100) : 0}% du CA`, icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Factures impayees', value: String(stats.unpaidCount), sub: 'En retard', icon: 'warning', bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Delai moyen paiement', value: `${stats.avgDays} j`, sub: 'vs 5.1 j (moyenne)', icon: 'calendar', bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
            {kpi.change && <p className="text-[10px] font-bold text-[#22C55E] mt-0.5">{kpi.change}</p>}
            {kpi.sub && <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Solde Disponible + Health Score + Prevision ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#22C55E] to-[#1a9c4a] rounded-2xl p-5 text-white">
          <p className="text-xs font-medium text-white/80 mb-1">Disponible a retirer</p>
          <p className="text-3xl font-extrabold mb-1">{formatPrice(stats.availableBalance)}</p>
          <p className="text-[10px] text-white/60 mb-3">85% du montant encaisse</p>
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
            <button className="flex-1 py-2 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 transition">Mobile Money</button>
            <button className="flex-1 py-2 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 transition">Banque</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs text-slate-400 mb-1">Sante financiere</p>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={stats.healthScore >= 80 ? '#22C55E' : stats.healthScore >= 60 ? '#FF7A00' : '#EF4444'} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${stats.healthScore} ${100 - stats.healthScore}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-extrabold text-[#0F172A]">{stats.healthScore}</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{stats.healthScore >= 80 ? 'Excellente' : stats.healthScore >= 60 ? 'Bonne' : 'A ameliorer'}</p>
              <p className="text-[10px] text-slate-400">Paiements + retards + impayes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs text-slate-400 mb-1">Prevision fin de mois</p>
          <p className="text-2xl font-extrabold text-[#0F172A] mb-1">{formatPrice(stats.forecast)}</p>
          <p className="text-[10px] text-slate-400 mb-2">Basee sur la moyenne journaliere de {formatPrice(stats.dailyAvg)}</p>
          <div className="flex items-center gap-1.5">
            <Icon name="arrow-path" className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-[10px] font-bold text-[#22C55E]">+{Math.round((stats.forecast / Math.max(stats.total, 1)) * 100 - 100)}% vs ce mois</span>
          </div>
        </div>
      </div>

      {/* ─── Encaissements recents ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-3">Derniers paiements recus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {invoices.filter(i => i.status === 'Payee').slice(0, 3).map((inv, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 flex items-center justify-center"><Icon name="check" className="w-4 h-4 text-[#22C55E]" /></div>
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">{inv.client}</p>
                  <p className="text-[10px] text-slate-400">{inv.date ? timeSince(inv.date) : 'Recemment'}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-[#22C55E]">{formatPrice(inv.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Factures en retard detaillees ─── */}
      {stats.unpaidCount > 0 && (
        <div className="bg-white rounded-2xl border border-red-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg"><Icon name="warning" className="w-4 h-4 text-red-500" /></div>
              <div>
                <h3 className="text-sm font-bold text-red-700">{stats.unpaidCount} factures en retard</h3>
                <p className="text-xs text-red-500">{formatPrice(stats.overdueAmount)} a encaisser</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition flex items-center gap-1.5">
              <Icon name="device-phone-mobile" className="w-3 h-3" />Relancer tous
            </button>
          </div>
          <div className="space-y-2">
            {invoices.filter(i => i.status === 'En retard').slice(0, 3).map((inv, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-bold text-xs">
                    {inv.client.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{inv.client}</p>
                    <p className="text-[10px] text-red-400">Retard : {Math.floor(Math.random() * 8) + 1} jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-red-600">{formatPrice(inv.amount)}</span>
                  <button className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Relancer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Revenue Analytics + Factures en attente ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Apercu des revenus</h2>
            <div className="flex items-center gap-3">
              {['Facture', 'Encaisse', 'En attente'].map((n, i) => (
                <span key={n} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#005bd8', '#22C55E', '#FF7A00'][i] }} />{n}
                </span>
              ))}
            </div>
          </div>
          {stats.total > 0 ? (
            <svg viewBox="0 0 600 200" className="w-full h-48">
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <g key={i}>
                  <line x1="50" y1={20 + (1 - pct) * 160} x2="590" y2={20 + (1 - pct) * 160} stroke="#F1F5F9" strokeWidth="1" />
                  <text x="45" y={24 + (1 - pct) * 160} textAnchor="end" className="text-[9px] fill-slate-400">${Math.round(pct * stats.total)}</text>
                </g>
              ))}
              {['Facture', 'Encaisse', 'En attente'].map((name, si) => {
                const color = ['#005bd8', '#22C55E', '#FF7A00'][si];
                const max = Math.max(...revenueData.flatMap(d => d.values.map(v => v.value)), 1);
                const pts = revenueData.map((d, i) => `${50 + (i / (revenueData.length - 1)) * 540},${20 + (1 - (d.values[si]?.value || 0) / max) * 160}`).join(' ');
                return <polyline key={si} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={pts} />;
              })}
              {revenueData.length <= 10 && revenueData.map((d, i) => (
                <text key={i} x={50 + (i / (revenueData.length - 1)) * 540} y="195" textAnchor="middle" className="text-[8px] fill-slate-400">{d.label}</text>
              ))}
            </svg>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center">
              <Icon name="currencyDollar" className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Aucune donnee de revenu</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Factures en attente ({pendingInvoices.length})</h3>
            {setSection && <button className="text-[10px] font-bold text-brand-blue hover:underline">Voir toutes</button>}
          </div>
          <div className="space-y-3">
            {pendingInvoices.length > 0 ? pendingInvoices.map(inv => {
              const st = STATUS_STYLE[inv.status] || STATUS_STYLE['En attente'];
              return (
                <div key={inv.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-400">{inv.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{inv.status}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">{inv.client}</p>
                  <p className="text-[10px] text-slate-400">{inv.commune} • {formatPrice(inv.amount)}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 py-1.5 text-[10px] font-bold bg-[#25D366] text-white rounded-lg hover:bg-[#1ebe5d] transition flex items-center justify-center gap-1">
                      <Icon name="device-phone-mobile" className="w-3 h-3" />WhatsApp
                    </button>
                    <button className="flex-1 py-1.5 text-[10px] font-bold bg-brand-blue text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center justify-center gap-1">
                      <Icon name="envelope" className="w-3 h-3" />Email
                    </button>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-400 text-center py-4">Aucune facture en attente</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Documents recents ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A]">Documents recents</h2>
          {setSection && <button className="text-xs font-bold text-brand-blue hover:underline">Voir tous les documents</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left py-2 text-[10px] text-slate-500 font-medium">DOCUMENT</th>
              <th className="text-left py-2 text-[10px] text-slate-500 font-medium">TYPE</th>
              <th className="text-left py-2 text-[10px] text-slate-500 font-medium">CLIENT</th>
              <th className="text-left py-2 text-[10px] text-slate-500 font-medium">DATE</th>
              <th className="text-right py-2 text-[10px] text-slate-500 font-medium">MONTANT</th>
              <th className="text-center py-2 text-[10px] text-slate-500 font-medium">STATUT</th>
              <th className="text-center py-2 text-[10px] text-slate-500 font-medium">ACTIONS</th>
            </tr></thead>
            <tbody>
              {invoices.slice(0, 5).map(inv => {
                const st = STATUS_STYLE[inv.status] || STATUS_STYLE['En attente'];
                return (
                  <tr key={inv.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="py-3 font-mono text-xs text-[#0F172A]">{inv.id}</td>
                    <td className="py-3 text-xs text-slate-600">{inv.type}</td>
                    <td className="py-3 text-xs font-medium text-[#0F172A]">{inv.client}</td>
                    <td className="py-3 text-xs text-slate-500">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 text-xs font-bold text-right text-[#0F172A]">{formatPrice(inv.amount)}</td>
                    <td className="py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{inv.status}</span></td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition"><Icon name="magnifying-glass-plus" className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition"><Icon name="arrow-down-tray" className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition"><Icon name="device-phone-mobile" className="w-3.5 h-3.5 text-slate-400" /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition"><Icon name="envelope" className="w-3.5 h-3.5 text-slate-400" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Cycle + Generation rapide ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Cycle de facturation</h3>
          <div className="flex items-center justify-between">
            {[
              { icon: 'check', label: 'Commande livree', sub: 'Terminee', color: 'bg-[#22C55E]', active: true },
              { icon: 'document-text', label: 'Facture generee', sub: 'En cours', color: 'bg-brand-blue', active: true },
              { icon: 'arrow-right', label: 'Envoyee', sub: 'En cours', color: 'bg-brand-blue', active: false },
              { icon: 'currencyDollar', label: 'Payee', sub: 'En attente', color: 'bg-slate-300', active: false },
              { icon: 'archive-box', label: 'Archivee', sub: 'A venir', color: 'bg-slate-300', active: false },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1">
                <div className={`w-10 h-10 rounded-full ${step.active ? step.color : 'bg-slate-200'} flex items-center justify-center mb-1.5`}>
                  <Icon name={step.icon as any} className={`w-5 h-5 ${step.active ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <p className="text-[10px] font-bold text-[#0F172A]">{step.label}</p>
                <p className="text-[9px] text-slate-400">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Generation rapide</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'document-text', label: 'Nouvelle facture', sub: 'Creer une facture finale', color: 'from-brand-blue to-brand-blue-700' },
              { icon: 'document-arrow-down', label: 'Nouvelle proforma', sub: 'Creer une estimation', color: 'from-purple-500 to-purple-600' },
              { icon: 'pencil', label: 'Facture manuelle', sub: 'Creer sans commande', color: 'from-[#22C55E] to-[#1a9c4a]' },
            ].map((item, i) => (
              <button key={i} className="p-4 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:shadow-md transition text-center">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-2`}>
                  <Icon name={item.icon as any} className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-[#0F172A] mb-0.5">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Top Clients + Top Services ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Top clients ce mois</h3>
            <button className="text-[10px] font-bold text-brand-blue hover:underline">Voir tous</button>
          </div>
          <div className="space-y-2.5">
            {topClients.map((c, i) => {
              const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const isTop = i === 0;
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${isTop ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${isTop ? 'bg-yellow-100 text-yellow-700' : 'bg-brand-blue/10 text-brand-blue'}`}>
                      {isTop ? '🏆' : initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.count} factures • {formatPrice(c.total)}</p>
                    </div>
                  </div>
                  {isTop && <span className="text-[9px] font-bold px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Client Or</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F172A]">Top services ce mois</h3>
            <button className="text-[10px] font-bold text-brand-blue hover:underline">Voir tous</button>
          </div>
          <div className="space-y-3">
            {topServices.map((s, i) => {
              const maxRev = topServices[0]?.revenue || 1;
              const isTop = i === 0;
              return (
                <div key={i} className={`p-3 rounded-xl ${isTop ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">{s.name}</span>
                      {isTop && <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-100 text-[#FF7A00] rounded-full">🏆 Meilleur service</span>}
                    </div>
                    <span className="text-sm font-extrabold text-[#0F172A]">{formatPrice(s.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{s.count} commandes</span>
                    <span>•</span>
                    <span>Marge ~{Math.round(100 - (s.count > 0 ? (s.revenue / s.count) * 2.5 : 0))}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full bg-brand-blue rounded-full" style={{ width: `${(s.revenue / maxRev) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Toutes les factures ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-[#0F172A] mb-4">Toutes les factures ({filteredInvoices.length})</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher (numero, client, telephone...)" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-3">
          {(['all', 'paid', 'pending', 'overdue', 'cancelled', 'proforma'] as InvoiceFilter[]).map(f => {
            const labels: Record<InvoiceFilter, string> = { all: 'Toutes', paid: 'Payees', pending: 'En attente', overdue: 'En retard', cancelled: 'Annulees', proforma: 'Proformas' };
            return (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition ${filter === f ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {labels[f]}
              </button>
            );
          })}
        </div>
        <div className="space-y-2.5">
          {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
            const st = STATUS_STYLE[inv.status] || STATUS_STYLE['En attente'];
            const initials = inv.client.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={inv.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs">{initials}</div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{inv.client}</p>
                      <p className="text-[10px] text-slate-400">{inv.id} • {inv.commune}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>{inv.status}</span>
                </div>
                <div className="flex items-center justify-between ml-10">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{new Date(inv.date).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span>{inv.paymentMethod}</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#0F172A]">{formatPrice(inv.amount)}</span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <Icon name="document-text" className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">Aucune facture disponible</p>
              <p className="text-xs text-slate-400 mt-1">Les commandes livrees apparaitront ici pour etre transformees en facture.</p>
              {setSection && <button onClick={() => setSection('orders')} className="mt-2 px-4 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg hover:bg-brand-blue-700 transition">Voir mes commandes</button>}
            </div>
          )}
        </div>
      </div>

      {/* ─── Exports comptables ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-[#0F172A] mb-4">Exports comptables</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: 'document-text', label: 'Rapport mensuel', format: 'PDF', color: 'text-red-500' },
            { icon: 'document-text', label: 'Rapport annuel', format: 'PDF', color: 'text-red-500' },
            { icon: 'arrow-down-tray', label: 'Export factures', format: 'Excel', color: 'text-[#22C55E]' },
            { icon: 'arrow-down-tray', label: 'Export paiements', format: 'CSV', color: 'text-brand-blue' },
            { icon: 'document', label: 'Grand livre', format: 'Excel', color: 'text-[#22C55E]' },
          ].map((exp, i) => (
            <button key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <Icon name={exp.icon as any} className={`w-5 h-5 ${exp.color}`} />
              <div className="text-left"><p className="text-xs font-bold text-[#0F172A]">{exp.label}</p><p className="text-[10px] text-slate-400">{exp.format}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">⚡</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Automatisez vos relances</h3>
            <p className="text-xs text-white/80">Gagnez du temps en automatisant les relances de paiement par WhatsApp ou Email.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Configurer les relances</button>
      </div>

      {modalDocument && <InvoiceModal document={modalDocument} onClose={() => setModalDocument(null)} />}
    </div>
  );
};
