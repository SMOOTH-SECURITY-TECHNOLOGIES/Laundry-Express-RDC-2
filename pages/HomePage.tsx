import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { OrderStatus, Partner } from '../types';

export const HomePage: React.FC = () => {
  const { user, orderHistory, partners, formatPrice, setCurrentPage, resetOrderDraft } = useAppContext();

  const firstName = user?.name?.split(' ')[0] || '';

  /* ─── Derived Data ─── */
  const activeOrders = useMemo(
    () => orderHistory.filter(o => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.REJECTED),
    [orderHistory]
  );

  const completedOrders = useMemo(
    () => orderHistory.filter(o => o.status === OrderStatus.COMPLETED),
    [orderHistory]
  );

  const totalOrders = orderHistory.length;
  const points = user?.loyaltyPoints ?? 350;
  const referralCode = user?.referralCode || 'LE-DEMO2026';
  const totalSaved = 25;
  const loyaltyProgress = Math.min((points / 200) * 100, 100);
  const clientSince = useMemo(() => {
    if (!user?.createdAt) return '2025';
    const d = new Date(user.createdAt);
    const months = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }, [user?.createdAt]);

  const featuredPartners = useMemo(
    () => (partners || []).filter(p => p.isFeatured).slice(0, 6),
    [partners]
  );

  /* ─── Order Progress Helpers ─── */
  const orderSteps = [
    { key: 'Recu', icon: 'check' as const },
    { key: 'Traitement', icon: 'sparkles' as const },
    { key: 'Pret', icon: 'shirt' as const },
    { key: 'Livraison', icon: 'truck' as const },
  ];

  const getOrderProgressIndex = (status: OrderStatus): number => {
    const map: Record<string, number> = {
      [OrderStatus.AWAITING_CONFIRMATION]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.READY_FOR_PICKUP]: 1,
      [OrderStatus.PICKUP]: 1,
      [OrderStatus.PROCESSING]: 2,
      [OrderStatus.READY_FOR_DELIVERY]: 3,
      [OrderStatus.DELIVERY]: 3,
      [OrderStatus.COMPLETED]: 4,
    };
    return map[status] ?? 0;
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const map: Record<string, string> = {
      [OrderStatus.AWAITING_CONFIRMATION]: 'En attente',
      [OrderStatus.CONFIRMED]: 'Confirme',
      [OrderStatus.READY_FOR_PICKUP]: 'Pret pour retrait',
      [OrderStatus.PICKUP]: 'Retrait en cours',
      [OrderStatus.PROCESSING]: 'En traitement',
      [OrderStatus.READY_FOR_DELIVERY]: 'Pret pour livraison',
      [OrderStatus.DELIVERY]: 'En livraison',
      [OrderStatus.COMPLETED]: 'Termine',
      [OrderStatus.REJECTED]: 'Annule',
      [OrderStatus.DELAYED]: 'Retarde',
    };
    return map[status] || 'Inconnu';
  };

  const getStatusColor = (status: OrderStatus): { text: string; bg: string; dot: string } => {
    const map: Record<string, { text: string; bg: string; dot: string }> = {
      [OrderStatus.AWAITING_CONFIRMATION]: { text: 'text-[#FF7A00]', bg: 'bg-orange-50', dot: 'bg-[#FF7A00]' },
      [OrderStatus.CONFIRMED]: { text: 'text-brand-blue', bg: 'bg-blue-50', dot: 'bg-brand-blue' },
      [OrderStatus.READY_FOR_PICKUP]: { text: 'text-brand-blue', bg: 'bg-blue-50', dot: 'bg-brand-blue' },
      [OrderStatus.PICKUP]: { text: 'text-brand-blue', bg: 'bg-blue-50', dot: 'bg-brand-blue' },
      [OrderStatus.PROCESSING]: { text: 'text-brand-blue', bg: 'bg-blue-50', dot: 'bg-brand-blue' },
      [OrderStatus.READY_FOR_DELIVERY]: { text: 'text-purple-600', bg: 'bg-purple-50', dot: 'bg-purple-500' },
      [OrderStatus.DELIVERY]: { text: 'text-purple-600', bg: 'bg-purple-50', dot: 'bg-purple-500' },
      [OrderStatus.COMPLETED]: { text: 'text-[#22C55E]', bg: 'bg-green-50', dot: 'bg-[#22C55E]' },
      [OrderStatus.REJECTED]: { text: 'text-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
      [OrderStatus.DELAYED]: { text: 'text-[#FF7A00]', bg: 'bg-orange-50', dot: 'bg-[#FF7A00]' },
    };
    return map[status] || { text: 'text-slate-500', bg: 'bg-slate-50', dot: 'bg-slate-400' };
  };

  /* ─── Handlers ─── */
  const handleNewOrder = () => {
    resetOrderDraft();
    setCurrentPage({ name: 'order' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Rejoignez Laundry Express',
        text: `Utilisez mon code ${referralCode} pour obtenir 5$ de reduction !`,
        url: 'https://laundry.app',
      });
    } else {
      handleCopyCode();
    }
  };

  const handlePartnerSelect = (partner: Partner) => {
    setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } });
  };

  /* ─── Promo Countdown (24h static demo) ─── */
  const promoCountdown = '23:59:47';

  /* ──────────────── RENDER ──────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">

      {/* ═══════════════════════════════════════════
          SECTION 1 — Hero Personalise
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue via-brand-blue to-brand-blue-700 text-white px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-blue-100 mb-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-1">
            {firstName ? `Bonjour, ${firstName}` : 'Bonjour !'}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-md">
            Bienvenue sur votre espace personnel. Gerez vos commandes, suivez vos livraisons et profitez de vos avantages.
          </p>

          {/* Promo Banner */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <div className="p-2 bg-[#FF7A00] rounded-xl">
              <Icon name="fire" className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Offre Speciale -20% sur votre prochaine commande</p>
              <p className="text-xs text-blue-100 mt-0.5">Valable pendant :</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <Icon name="clock" className="w-4 h-4 text-[#FF7A00]" />
              <span className="font-mono font-bold text-sm tracking-wider">{promoCountdown}</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleNewOrder}
            className="mt-6 px-8 py-3 bg-white text-brand-blue font-bold rounded-full text-sm hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg"
          >
            <Icon name="shoppingBag" className="w-5 h-5" />
            <span>Commander maintenant</span>
            <Icon name="arrowRight" className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — Actions Rapides (scrollable)
      ═══════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-[#0F172A] mb-3">Actions rapides</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {[
            { icon: 'shoppingBag', label: 'Commander', desc: 'Nouvelle commande', bg: 'bg-brand-blue/10', color: 'text-brand-blue', action: handleNewOrder },
            { icon: 'search', label: 'Suivre', desc: 'Suivi de commande', bg: 'bg-[#22C55E]/10', color: 'text-[#22C55E]', action: () => setCurrentPage({ name: 'tracking' }) },
            { icon: 'document-text', label: 'Historique', desc: 'Mes commandes', bg: 'bg-purple-500/10', color: 'text-purple-600', action: () => setCurrentPage({ name: 'profile' }) },
            { icon: 'star', label: 'Points', desc: 'Fidelite', bg: 'bg-[#FF7A00]/10', color: 'text-[#FF7A00]', action: () => setCurrentPage({ name: 'profile' }) },
            { icon: 'lifebuoy', label: 'Support', desc: 'Aide 24/7', bg: 'bg-red-500/10', color: 'text-red-500', action: () => setCurrentPage({ name: 'support' }) },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="flex-shrink-0 w-28 sm:w-32 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-all duration-200 text-center group hover:-translate-y-0.5"
            >
              <div className={`p-2.5 rounded-xl ${item.bg} w-fit mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                <Icon name={item.icon as any} className={`w-5 h-5 ${item.color}`} />
              </div>
              <p className="text-xs font-bold text-[#0F172A]">{item.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — KPI Cards
      ═══════════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { icon: 'shoppingBag', label: 'Commandes totales', value: totalOrders, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
            { icon: 'star', label: 'Points fidelite', value: points, color: 'text-[#FF7A00]', bg: 'bg-[#FF7A00]/10' },
            { icon: 'users', label: 'Parrainages', value: 4, color: 'text-purple-600', bg: 'bg-purple-500/10' },
            { icon: 'currencyDollar', label: 'Economies', value: `$${totalSaved}`, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
            { icon: 'calendar', label: 'Client depuis', value: clientSince, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
              <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-3`}>
                <Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{kpi.label}</p>
              <p className="text-xl font-extrabold text-[#0F172A] mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — Commandes Actives
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-[#0F172A]">Commandes actives</h2>
          {activeOrders.length > 0 && (
            <button onClick={() => setCurrentPage({ name: 'tracking' })} className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
              Tout voir <Icon name="arrowRight" className="w-3 h-3" />
            </button>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <div className="p-3 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
              <Icon name="truck" className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">Aucune commande en cours</p>
            <p className="text-xs text-slate-400 mt-1">Passez votre premiere commande pour commencer !</p>
            <button onClick={handleNewOrder} className="mt-4 px-6 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition inline-flex items-center gap-2">
              <Icon name="shoppingBag" className="w-4 h-4" />
              Commander
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map(order => {
              const progressIdx = getOrderProgressIndex(order.status);
              const sc = getStatusColor(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[#0F172A]">
                          {order.partner?.name || 'Partenaire'}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.bg} ${sc.text}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Commande #{order.backendOrderNumber || order.id.slice(0, 8)} — {formatPrice(order.totalPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentPage({ name: 'tracking' })}
                      className="p-1.5 hover:bg-slate-50 rounded-lg transition"
                    >
                      <Icon name="magnifying-glass-plus" className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Progress Bar — 4 Steps */}
                  <div className="flex items-center gap-1 sm:gap-2 mb-2">
                    {orderSteps.map((step, si) => (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              si < progressIdx
                                ? 'bg-[#22C55E] text-white'
                                : si === progressIdx
                                ? 'bg-brand-blue text-white ring-2 ring-brand-blue/20'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {si < progressIdx ? (
                              <Icon name="check" className="w-3.5 h-3.5" />
                            ) : (
                              <Icon name={step.icon} className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className={`text-[9px] sm:text-[10px] mt-1 font-medium ${si <= progressIdx ? 'text-[#0F172A]' : 'text-slate-300'}`}>
                            {step.key}
                          </span>
                        </div>
                        {si < orderSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 rounded-full mt-[-14px] sm:mt-[-16px] ${
                            si < progressIdx ? 'bg-[#22C55E]' : 'bg-slate-100'
                          }`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 5 — Programme de Fidelite
      ═══════════════════════════════════════════ */}
      <section>
        <div className="bg-gradient-to-r from-[#FF7A00] to-[#FF9D3D] rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Icon name="star" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Programme de Fidelite</h2>
              <p className="text-xs text-orange-100">Gagnez des points a chaque commande</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{points} points</span>
            <span className="text-xs text-orange-100">Prochain palier : 200 pts</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-4">
            <div
              className="bg-white rounded-full h-3 transition-all duration-700 ease-out"
              style={{ width: `${loyaltyProgress}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { pts: 100, reward: '5% reduction' },
              { pts: 200, reward: '10% reduction' },
              { pts: 500, reward: 'Commande gratuite' },
            ].map((tier, i) => (
              <div key={i} className={`rounded-xl p-3 ${points >= tier.pts ? 'bg-white/20' : 'bg-white/5'}`}>
                <p className="text-lg font-extrabold">{tier.pts}</p>
                <p className="text-[10px] text-orange-100">{tier.reward}</p>
                {points >= tier.pts && (
                  <div className="mt-1">
                    <Icon name="check" className="w-3.5 h-3.5 mx-auto text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — Programme de Parrainage
      ═══════════════════════════════════════════ */}
      <section>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Icon name="gift" className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Parrainez vos amis</h2>
              <p className="text-xs text-slate-400">Invitez vos proches et gagnez des points</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Votre code parrain</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-brand-blue tracking-wider">{referralCode}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Amis parraines', value: 4, icon: 'users' },
              { label: 'Points gagnes', value: 2000, icon: 'star' },
              { label: 'Recompenses', value: 3, icon: 'gift' },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-slate-50 rounded-xl p-3">
                <Icon name={stat.icon as any} className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-extrabold text-[#0F172A]">{stat.value}</p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition"
            >
              <Icon name="document-text" className="w-4 h-4" />
              Copier le code
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 transition"
            >
              <Icon name="share" className="w-4 h-4" />
              Partager
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 7 — Partenaires Populaires
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-[#0F172A]">Partenaires populaires</h2>
          <button onClick={handleNewOrder} className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
            Voir tout <Icon name="arrowRight" className="w-3 h-3" />
          </button>
        </div>

        {featuredPartners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <div className="p-3 bg-slate-100 rounded-2xl w-fit mx-auto mb-4">
              <Icon name="heart" className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-[#0F172A]">Aucun partenaire pour le moment</p>
            <p className="text-xs text-slate-400 mt-1">Les partenaires bientot disponibles pres de chez vous.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {featuredPartners.map(partner => {
              const partnerImageUrl = partner.imageUrls?.find(Boolean);

              return (
                <button
                  key={partner.id}
                  onClick={() => handlePartnerSelect(partner)}
                  className="flex-shrink-0 w-44 sm:w-52 bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 text-left"
                >
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-cyan-100 via-white to-emerald-100">
                    {partnerImageUrl ? (
                      <img
                        src={partnerImageUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-blue">
                        <Icon name="shirt" className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <h3 className="font-bold text-sm text-white drop-shadow-md truncate">{partner.name}</h3>
                    </div>
                    {partner.isFeatured && (
                      <div className="absolute top-2 right-2 p-1 bg-[#FF7A00] rounded-lg">
                        <Icon name="fire" className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wide">
                      {partner.type}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs font-bold text-[#0F172A]">{partner.rating}</span>
                      <span className="text-[10px] text-slate-400">({partner.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <Icon name="mapPin" className="w-3 h-3" />
                      <span className="text-[10px] truncate">{partner.address || 'Kinshasa'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 8 — Cartes de Rassurance
      ═══════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-bold text-[#0F172A] mb-3">Pourquoi nous choisir</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: 'shield-check', title: 'Paiement securise', desc: 'Transactions protegees', color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
            { icon: 'truck', title: 'Livraison rapide', desc: 'Partout a Kinshasa', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' },
            { icon: 'check', title: 'Qualite garantie', desc: 'Satisfait ou rembourse', color: 'text-[#FF7A00]', bg: 'bg-[#FF7A00]/10' },
            { icon: 'phone', title: 'Support 24/7', desc: 'Disponible a tout moment', color: 'text-purple-600', bg: 'bg-purple-500/10' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-md transition-shadow group hover:-translate-y-0.5 duration-200">
              <div className={`p-3 rounded-xl ${item.bg} w-fit mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <Icon name={item.icon as any} className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-xs font-bold text-[#0F172A] mb-1">{item.title}</h3>
              <p className="text-[10px] text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

