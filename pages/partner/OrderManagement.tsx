import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, PartnerSection } from '../../types';
import { ChatModal } from '../../components/ChatModal';
import { Icon } from '../../components/Icon';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';
import { EstimateTimeModal } from './Dashboard';

type OrderFilter = 'all' | 'pending' | 'confirmed' | 'pickup' | 'processing' | 'ready' | 'delivery' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [OrderStatus.AWAITING_CONFIRMATION]: { label: 'En attente', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  [OrderStatus.CONFIRMED]: { label: 'Confirmee', color: 'text-[#0077B6]', bg: 'bg-blue-50 border-blue-200' },
  [OrderStatus.READY_FOR_PICKUP]: { label: 'A ramasser', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  [OrderStatus.PICKUP]: { label: 'Ramassage', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  [OrderStatus.PROCESSING]: { label: 'En traitement', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  [OrderStatus.READY_FOR_DELIVERY]: { label: 'Prete', color: 'text-[#0077B6]', bg: 'bg-blue-50 border-blue-200' },
  [OrderStatus.DELIVERY]: { label: 'En livraison', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  [OrderStatus.COMPLETED]: { label: 'Livree', color: 'text-[#22C55E]', bg: 'bg-green-50 border-green-200' },
  [OrderStatus.REJECTED]: { label: 'Annulee', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const FILTER_MAP: Record<OrderFilter, OrderStatus | null> = {
  all: null, pending: OrderStatus.AWAITING_CONFIRMATION, confirmed: OrderStatus.CONFIRMED,
  pickup: OrderStatus.PICKUP, processing: OrderStatus.PROCESSING, ready: OrderStatus.READY_FOR_DELIVERY,
  delivery: OrderStatus.DELIVERY, completed: OrderStatus.COMPLETED, cancelled: OrderStatus.REJECTED,
};

interface OrderManagementProps { setSection?: (section: PartnerSection) => void; }

export const OrderManagement: React.FC<OrderManagementProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, updateOrderStatus, addNotification, formatPrice } = useAppContext();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [chattingOrder, setChattingOrder] = useState<Order | null>(null);

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);
  const allOrders = useMemo(() => user?.partnerId ? getOrdersForPartner(user.partnerId) : [], [user, getOrdersForPartner]);

  const filteredOrders = useMemo(() => {
    let result = allOrders;
    if (filter !== 'all') {
      const status = FILTER_MAP[filter];
      if (status) result = result.filter(o => o.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.clientDetails?.name?.toLowerCase().includes(q) ||
        o.clientDetails?.phone?.includes(q) ||
        o.backendOrderNumber?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, filter, search]);

  const stats = useMemo(() => {
    const pending = allOrders.filter(o => o.status === OrderStatus.AWAITING_CONFIRMATION).length;
    const active = allOrders.filter(o => [OrderStatus.CONFIRMED, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKUP, OrderStatus.PROCESSING].includes(o.status)).length;
    const ready = allOrders.filter(o => o.status === OrderStatus.READY_FOR_DELIVERY || o.status === OrderStatus.DELIVERY).length;
    const completed = allOrders.filter(o => o.status === OrderStatus.COMPLETED);
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = completed.filter(o => o.createdAt.startsWith(today));
    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalPrice, 0);
    return { pending, active, ready, completedCount: completed.length, todayRevenue, todayCount: todayOrders.length };
  }, [allOrders]);

  const urgentOrders = useMemo(() =>
    allOrders.filter(o => o.status === OrderStatus.AWAITING_CONFIRMATION || o.status === OrderStatus.READY_FOR_PICKUP || o.status === OrderStatus.REJECTED).slice(0, 3),
    [allOrders]
  );

  const todaySchedule = useMemo(() => [
    { time: '09:00', type: 'Ramassage', client: 'Patrick M.', commune: 'Gombe', color: 'bg-orange-500' },
    { time: '10:00', type: 'Livraison', client: 'Sarah K.', commune: 'Ngaliema', color: 'bg-[#22C55E]' },
    { time: '11:30', type: 'Ramassage', client: 'Alain T.', commune: 'Limete', color: 'bg-orange-500' },
    { time: '14:00', type: 'Livraison', client: 'Entreprise ABC', commune: 'Gombe', color: 'bg-[#22C55E]' },
    { time: '16:30', type: 'Livraison', client: 'Marie L.', commune: 'Kintambo', color: 'bg-[#22C55E]' },
  ], []);

  const recentActivity = useMemo(() => [
    { time: '10:24', icon: 'shoppingBag', color: 'text-[#0077B6]', bg: 'bg-blue-50', title: 'Nouvelle commande recue', detail: 'Patrick M. — Gombe' },
    { time: '10:22', icon: 'check', color: 'text-[#22C55E]', bg: 'bg-green-50', title: 'Commande confirmee', detail: 'ORDER-2047 — Sarah K.' },
    { time: '10:15', icon: 'currencyDollar', color: 'text-purple-600', bg: 'bg-purple-50', title: 'Paiement recu', detail: 'ORDER-2047 — 12$' },
    { time: '09:58', icon: 'truck', color: 'text-orange-500', bg: 'bg-orange-50', title: 'Ramassage effectue', detail: 'ORDER-2046 — Alain T.' },
    { time: '09:30', icon: 'check', color: 'text-[#22C55E]', bg: 'bg-green-50', title: 'Livraison terminee', detail: 'ORDER-2043 — Marie L.' },
  ], []);

  const handleAcceptOrder = (order: Order) => { setSelectedOrder(order); setIsTimeModalOpen(true); };
  const handleConfirmTime = async (estimatedTime: string) => {
    if (!selectedOrder) return;
    try {
      await updateOrderStatus(selectedOrder.id, OrderStatus.READY_FOR_PICKUP, undefined, estimatedTime);
      addNotification('Commande acceptee', 'success');
      setIsTimeModalOpen(false);
    } catch { addNotification('Erreur', 'error'); }
  };

  const getStatusStyle = (status: OrderStatus) => STATUS_CONFIG[status] || { label: 'Inconnu', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Gestion des commandes</h1>
          <p className="text-sm text-slate-500 mt-1">Centre operationnel de votre pressing. Gerez vos commandes et vos livraisons.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2">
            <Icon name="arrow-down-tray" className="w-4 h-4" />Exporter
          </button>
          {setSection && <button className="px-4 py-2 bg-[#0077B6] text-white text-sm font-bold rounded-xl hover:bg-[#005f8f] transition flex items-center gap-2">
            <Icon name="plus" className="w-4 h-4" />Nouvelle commande
          </button>}
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'En attente', value: stats.pending, sub: 'A confirmer', icon: 'clock', bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-200' },
          { label: 'Actives', value: stats.active, sub: 'En traitement', icon: 'shoppingBag', bg: 'bg-blue-50', color: 'text-[#0077B6]', border: 'border-blue-200' },
          { label: 'Pretes', value: stats.ready, sub: 'A livrer', icon: 'truck', bg: 'bg-indigo-50', color: 'text-indigo-500', border: 'border-indigo-200' },
          { label: 'Livrees', value: stats.completedCount, sub: 'Ce mois', icon: 'check', bg: 'bg-green-50', color: 'text-[#22C55E]', border: 'border-green-200' },
          { label: "CA aujourd'hui", value: formatPrice(stats.todayRevenue), sub: `${stats.todayCount} commandes`, icon: 'currencyDollar', bg: 'bg-emerald-50', color: 'text-emerald-500', border: 'border-emerald-200' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-white rounded-2xl border ${kpi.border} p-4 hover:shadow-md transition`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-xl ${kpi.bg}`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            </div>
            <p className="text-2xl font-extrabold text-[#0F172A]">{kpi.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{kpi.label} — {kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Actions + Planning + Urgentes ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions prioritaires */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Actions prioritaires</h3>
          <div className="space-y-2.5">
            {[
              { icon: 'clock', color: 'text-orange-500', bg: 'bg-orange-50', text: `${stats.pending} commandes a confirmer` },
              { icon: 'truck', color: 'text-[#0077B6]', bg: 'bg-blue-50', text: '1 ramassage dans 30 min' },
              { icon: 'warning', color: 'text-red-500', bg: 'bg-red-50', text: '1 livraison en retard' },
              { icon: 'currencyDollar', color: 'text-purple-500', bg: 'bg-purple-50', text: '3 paiements a verifier' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition">
                <div className={`p-1.5 rounded-lg ${a.bg}`}><Icon name={a.icon as any} className={`w-3.5 h-3.5 ${a.color}`} /></div>
                <span className="text-xs font-medium text-[#0F172A]">{a.text}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-1.5 text-xs font-bold text-[#0077B6] hover:underline">Voir toutes les actions</button>
        </div>

        {/* Planning du jour */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Planning du jour</h3>
            {setSection && <button onClick={() => setSection('delivery')} className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir calendrier</button>}
          </div>
          <div className="space-y-2.5">
            {todaySchedule.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-bold text-slate-400 w-10">{s.time}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs font-medium text-slate-500">{s.type}</span>
                </div>
                <span className="text-xs font-bold text-[#0F172A]">{s.client}</span>
                <span className="text-[10px] text-slate-400">• {s.commune}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commandes urgentes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">Commandes urgentes ({urgentOrders.length})</h3>
          </div>
          <div className="space-y-3">
            {urgentOrders.length > 0 ? urgentOrders.map(order => {
              const st = getStatusStyle(order.status);
              return (
                <div key={order.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400">{order.backendOrderNumber || order.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">{order.clientDetails?.name || 'Client'}</p>
                  <p className="text-[10px] text-slate-400">{order.clientDetails?.pickupAddress?.commune || 'Gombe'} — {order.serviceItems?.map(s => s.service.title).join(', ') || 'Service'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-extrabold text-[#0F172A]">{formatPrice(order.totalPrice)}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setSelectedOrder(order); setIsDrawerOpen(true); }} className="px-2.5 py-1 text-[10px] font-bold border border-slate-200 rounded-lg hover:bg-slate-100 transition">Voir</button>
                      {order.status === OrderStatus.AWAITING_CONFIRMATION && (
                        <button onClick={() => handleAcceptOrder(order)} className="px-2.5 py-1 text-[10px] font-bold bg-[#0077B6] text-white rounded-lg hover:bg-[#005f8f] transition">Accepter</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-xs text-slate-400 text-center py-4">Aucune commande urgente</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Liste Principale + Carte Livraisons ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste commandes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Toutes les commandes ({filteredOrders.length})</h3>
          {/* Search */}
          <div className="relative mb-4">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher (client, telephone, numero...)" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]" />
          </div>
          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3">
            {(['all', 'pending', 'confirmed', 'pickup', 'processing', 'ready', 'delivery', 'completed', 'cancelled'] as OrderFilter[]).map(f => {
              const labels: Record<OrderFilter, string> = { all: 'Toutes', pending: 'En attente', confirmed: 'Confirmees', pickup: 'Ramassees', processing: 'En traitement', ready: 'Pretes', delivery: 'Livrees', completed: 'Livrees', cancelled: 'Annulees' };
              return (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition ${filter === f ? 'bg-[#0077B6] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {labels[f]}
                </button>
              );
            })}
          </div>
          {/* Order List */}
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
            {filteredOrders.length > 0 ? filteredOrders.map(order => {
              const st = getStatusStyle(order.status);
              const clientName = order.clientDetails?.name || 'Client';
              const initials = clientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={order.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => { setSelectedOrder(order); setIsDrawerOpen(true); }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] font-bold text-xs">{initials}</div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">{clientName}</p>
                        <p className="text-[10px] text-slate-400">{order.backendOrderNumber || order.id} • {order.clientDetails?.pickupAddress?.commune || 'Gombe'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between ml-10">
                    <p className="text-[10px] text-slate-500">{order.serviceItems?.map(s => s.service.title).join(', ') || 'Service'}</p>
                    <span className="text-sm font-extrabold text-[#0F172A]">{formatPrice(order.totalPrice)}</span>
                  </div>
                  <div className="flex items-center justify-between ml-10 mt-1">
                    <p className="text-[10px] text-slate-400">{order.createdAt ? timeSince(order.createdAt) : ''}</p>
                    <div className="flex gap-1">
                      {order.status === OrderStatus.AWAITING_CONFIRMATION && (
                        <button onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order); }} className="px-2.5 py-1 text-[10px] font-bold bg-[#0077B6] text-white rounded-lg hover:bg-[#005f8f] transition">Accepter</button>
                      )}
                      <span className="text-[10px] text-slate-400">Détails →</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <Icon name="shoppingBag" className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Aucune commande disponible</p>
                <p className="text-xs text-slate-400 mt-1">Creez une promotion pour attirer vos premiers clients.</p>
                {setSection && <button onClick={() => setSection('promotions')} className="mt-2 px-4 py-1.5 bg-[#0077B6] text-white text-xs font-bold rounded-lg hover:bg-[#005f8f] transition">Creer une promotion</button>}
              </div>
            )}
          </div>
        </div>

        {/* Carte Livraisons + Livreurs + Activite */}
        <div className="space-y-6">
          {/* Carte livraisons */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Carte des livraisons du jour</h3>
            <div className="h-40 bg-slate-100 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #cbd5e1 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #cbd5e1 20px)', backgroundSize: '20px 20px' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: 'Gombe', x: '10%', y: '20%', count: 3, color: 'bg-[#22C55E]' },
                    { name: 'Ngaliema', x: '30%', y: '60%', count: 2, color: 'bg-orange-500' },
                    { name: 'Limete', x: '70%', y: '30%', count: 1, color: 'bg-[#0077B6]' },
                    { name: 'Kintambo', x: '50%', y: '70%', count: 1, color: 'bg-red-500' },
                  ].map((z, i) => (
                    <div key={i} className="text-center">
                      <div className={`w-6 h-6 ${z.color} rounded-full flex items-center justify-center text-white text-[10px] font-bold mx-auto`}>{z.count}</div>
                      <p className="text-[9px] text-slate-500 mt-0.5">{z.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Livreurs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Livreurs aujourd'hui</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Jean L.', deliveries: 4, remaining: '1h45', status: 'En cours', statusColor: 'text-[#22C55E]' },
                { name: 'David K.', deliveries: 2, remaining: '45min', status: 'En cours', statusColor: 'text-[#22C55E]' },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] font-bold text-[10px]">{d.name[0]}</div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.deliveries} livraisons • {d.remaining} restantes</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold ${d.statusColor}`}>{d.status}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">+</div>
                  <p className="text-xs font-medium text-slate-500">Aucun livreur</p>
                </div>
                <button className="px-2 py-1 text-[10px] font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition">Assigner</button>
              </div>
            </div>
          </div>

          {/* Activite temps reel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Activite en temps reel</h3>
            <div className="space-y-2.5">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`p-1 rounded-lg shrink-0 ${a.bg}`}><Icon name={a.icon as any} className={`w-3 h-3 ${a.color}`} /></div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#0F172A]">{a.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.detail}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Performance + Revenus ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Performance operationnelle</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Temps moyen traitement', value: '24h', change: '-12h vs moy. zone', changeColor: 'text-[#22C55E]', icon: 'clock' },
              { label: 'Livraisons a temps', value: '98%', change: '+5% vs mois dernier', changeColor: 'text-[#22C55E]', icon: 'check' },
              { label: 'Taux litiges', value: '0.8%', change: '-0.3% vs mois dernier', changeColor: 'text-[#22C55E]', icon: 'warning' },
              { label: 'Commandes annulees', value: '1.2%', change: '-0.4% vs mois dernier', changeColor: 'text-[#22C55E]', icon: 'xmark' },
            ].map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon name={p.icon as any} className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-500">{p.label}</span>
                </div>
                <p className="text-xl font-extrabold text-[#0F172A]">{p.value}</p>
                <p className={`text-[10px] font-medium ${p.changeColor} mt-0.5`}>{p.change}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-3">Revenus aujourd'hui</h3>
          <p className="text-3xl font-extrabold text-[#0F172A] mb-1">{formatPrice(stats.todayRevenue)}</p>
          <p className="text-xs text-slate-400 mb-4">{stats.todayCount} commandes • Panier moyen {stats.todayCount > 0 ? formatPrice(stats.todayRevenue / stats.todayCount) : '0 $'}</p>
          <div className="h-20 bg-slate-50 rounded-xl flex items-end justify-between gap-1 p-3">
            {[0.2, 0.4, 0.6, 0.8, 1.0, 0.9, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4].map((h, i) => (
              <div key={i} className="flex-1 bg-[#0077B6]/20 rounded-t" style={{ height: `${h * 100}%` }}>
                <div className="w-full bg-[#0077B6] rounded-t" style={{ height: `${h * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-3">
            <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>24h</span>
          </div>
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
        {setSection && <button onClick={() => setSection('delivery')} className="px-5 py-2.5 bg-white text-[#0077B6] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Gerer mes livreurs</button>}
      </div>

      {/* ─── Modals ─── */}
      <EstimateTimeModal isOpen={isTimeModalOpen} onClose={() => setIsTimeModalOpen(false)} onConfirm={handleConfirmTime} isLoading={false} />
      <ChatModal isOpen={!!chattingOrder} onClose={() => setChattingOrder(null)} order={chattingOrder} />

      {/* ─── Drawer Details ─── */}
      {isDrawerOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-slide-in-right">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A]">Details commande</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><Icon name="xmark" className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-slate-400">{selectedOrder.backendOrderNumber || selectedOrder.id}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(selectedOrder.status).bg} ${getStatusStyle(selectedOrder.status).color}`}>
                  {getStatusStyle(selectedOrder.status).label}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">Client</h4>
                <p className="text-sm font-bold text-[#0F172A]">{selectedOrder.clientDetails?.name || 'Client'}</p>
                <p className="text-xs text-slate-500">{selectedOrder.clientDetails?.phone || 'Pas de telephone'}</p>
                <p className="text-xs text-slate-400 mt-1">{selectedOrder.clientDetails?.pickupAddress?.commune || 'Gombe'}, {selectedOrder.clientDetails?.pickupAddress?.avenue || ''} {selectedOrder.clientDetails?.pickupAddress?.numero || ''}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">Services</h4>
                {selectedOrder.serviceItems?.map((si, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-[#0F172A]">{si.service.title} {si.items ? `x${si.items.reduce((s, it) => s + it.quantity, 0)}` : si.weight ? `${si.weight}kg` : ''}</span>
                    <span className="text-xs font-bold text-slate-500">{formatPrice(si.service.price || 0)}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">Paiement</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#0F172A]">Montant total</span>
                  <span className="text-lg font-extrabold text-[#0F172A]">{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Statut : {selectedOrder.paymentStatus || 'En attente'}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 mb-2">Historique</h4>
                <div className="space-y-2">
                  {(selectedOrder.trackingHistory || []).map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0077B6]" />
                      <div>
                        <p className="text-xs font-medium text-[#0F172A]">{getStatusStyle(h.status).label}</p>
                        <p className="text-[10px] text-slate-400">{h.time ? new Date(h.time).toLocaleString('fr-FR') : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {selectedOrder.status === OrderStatus.AWAITING_CONFIRMATION && (
                  <button onClick={() => { setIsDrawerOpen(false); handleAcceptOrder(selectedOrder); }} className="flex-1 py-2.5 bg-[#0077B6] text-white text-sm font-bold rounded-xl hover:bg-[#005f8f] transition">Accepter</button>
                )}
                <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
