import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { OrderStatus } from '../types';
import { useMyReviews } from '../hooks/useMyReviews';
import { useMyLoyaltyHistory } from '../hooks/useMyLoyaltyHistory';
import { useMyReferralStats } from '../hooks/useMyReferralStats';
import { formatSupportStatus } from '../utils/support-mappers';

export const ProfilePage: React.FC = () => {
  const { user, orderHistory, formatPrice, setCurrentPage, addNotification, loyaltySettings } = useAppContext();
  const { reviews: myReviews, isLoading: myReviewsLoading } = useMyReviews(!!user);
  const { total: loyaltyHistoryTotal } = useMyLoyaltyHistory(!!user);
  const { stats: referralStats } = useMyReferralStats(!!user);
  const [notifPrefs, setNotifPrefs] = useState(user?.notificationPreferences || { newOrder: true, orderStatusChange: true, newChatMessage: true, promotions: true, general: true });

  const userOrders = useMemo(() => orderHistory || [], [orderHistory]);
  const completedOrders = useMemo(() => userOrders.filter(o => o.status === OrderStatus.COMPLETED), [userOrders]);

  /* ─── Client Stats ─── */
  const clientStats = useMemo(() => {
    const totalSpent = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
    const thisMonth = completedOrders.filter(o => { const d = new Date(o.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    return {
      totalOrders: userOrders.length,
      totalSpent: Math.round(totalSpent),
      clientSince: 'Mars 2025',
      avgPerMonth: thisMonth.length,
      satisfaction: '4.9',
      points: user?.loyaltyPoints ?? 0,
      nextReward: loyaltySettings?.pointsToDollar || 100,
      referralCode: referralStats.referralCode || user?.referralCode || '',
      referralCount: referralStats.referredUsersCount,
      referralPoints: referralStats.totalBonusPoints,
      referralRewards: referralStats.completedConversions,
      loyaltyHistoryTotal,
    };
  }, [userOrders, user, completedOrders, loyaltySettings, referralStats, loyaltyHistoryTotal]);

  const notifActiveCount = useMemo(() => Object.values(notifPrefs).filter(Boolean).length, [notifPrefs]);

  const getStatusStyle = (status: OrderStatus) => {
    const s: Record<string, { label: string; color: string; bg: string }> = {
      [OrderStatus.COMPLETED]: { label: 'Livree', color: 'text-[#22C55E]', bg: 'bg-green-50' },
      [OrderStatus.AWAITING_CONFIRMATION]: { label: 'En attente', color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
      [OrderStatus.PROCESSING]: { label: 'En traitement', color: 'text-brand-blue', bg: 'bg-blue-50' },
      [OrderStatus.DELIVERY]: { label: 'En livraison', color: 'text-purple-600', bg: 'bg-purple-50' },
      [OrderStatus.REJECTED]: { label: 'Annulee', color: 'text-red-500', bg: 'bg-red-50' },
    };
    return s[status] || { label: 'Inconnu', color: 'text-content-muted', bg: 'bg-surface-muted' };
  };

  if (!user) return null;

  const handleCopyCode = () => { navigator.clipboard.writeText(clientStats.referralCode); addNotification('Code copie !', 'success'); };
  const handleShare = () => { if (navigator.share) navigator.share({ title: 'Rejoignez Laundry Express', text: `Utilisez mon code ${clientStats.referralCode} pour obtenir 5$ de reduction !`, url: 'https://laundry.app' }); else handleCopyCode(); };
  const handleNotifToggle = (key: keyof typeof notifPrefs) => { setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] })); addNotification('Preferences mises a jour', 'success'); };

  const loyaltyProgress = Math.round((clientStats.points / clientStats.nextReward) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-content-primary">Mon profil</h1>
          <p className="text-sm text-content-muted mt-1">Gerez vos informations, programmes et preferences.</p>
        </div>
        <button onClick={() => setCurrentPage({ name: 'order' })} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition flex items-center gap-2"><Icon name="shoppingBag" className="w-4 h-4" />Commander maintenant</button>
      </div>

      {/* ─── Actions rapides ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: 'shoppingBag', label: 'Commander', desc: 'Nouvelle commande', bg: 'bg-brand-blue/10', color: 'text-brand-blue', action: () => setCurrentPage({ name: 'order' }) },
          { icon: 'search', label: 'Suivre commande', desc: 'Voir le statut', bg: 'bg-green-50', color: 'text-[#22C55E]', action: () => setCurrentPage({ name: 'tracking' }) },
          { icon: 'phone', label: 'Contacter support', desc: 'Aide 24/7', bg: 'bg-orange-50', color: 'text-[#FF7A00]', action: () => setCurrentPage({ name: 'support' }) },
          { icon: 'arrow-path', label: 'Commander a nouveau', desc: 'Recommander', bg: 'bg-purple-50', color: 'text-purple-600', action: () => setCurrentPage({ name: 'order' }) },
        ].map((a, i) => (
          <button key={i} onClick={a.action} className="bg-surface-card rounded-2xl border border-surface-border-subtle p-3 hover:shadow-md transition text-left">
            <div className={`p-1.5 rounded-lg ${a.bg} w-fit mb-2`}><Icon name={a.icon as any} className={`w-4 h-4 ${a.color}`} /></div>
            <p className="text-xs font-bold text-content-primary">{a.label}</p>
            <p className="text-[10px] text-content-faint dark:text-slate-400">{a.desc}</p>
          </button>
        ))}
      </div>

      {/* ─── Profil + Stats ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-content-primary">Mes informations</h2>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-[10px] font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition flex items-center gap-1"><Icon name="pencil" className="w-3 h-3" />Modifier</button>
            <button className="px-3 py-1.5 text-[10px] font-bold text-content-muted border border-surface-border rounded-lg hover:bg-surface-muted dark:bg-slate-800/60 transition flex items-center gap-1"><Icon name="phone" className="w-3 h-3" />Support</button>
          </div>
        </div>
        <div className="flex items-start gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-extrabold text-2xl">{user.name?.charAt(0) || 'U'}</div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center border border-surface-border cursor-pointer"><Icon name="pencil" className="w-3 h-3 text-content-muted" /></div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { icon: 'user', label: 'Nom complet', value: user.name || 'Non defini' },
                { icon: 'envelope', label: 'Email', value: user.email },
                { icon: 'mapPin', label: 'Adresse', value: user.pickupAddress ? `${user.pickupAddress.numero || ''} ${user.pickupAddress.avenue || ''}, ${user.pickupAddress.commune || ''}` : 'Non definie' },
                { icon: 'phone', label: 'Telephone', value: user.phone || 'Non defini' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-2"><Icon name={f.icon as any} className="w-3.5 h-3.5 text-content-faint dark:text-slate-400 mt-0.5" /><div><p className="text-[10px] text-content-faint dark:text-slate-400">{f.label}</p><p className="text-sm font-medium text-content-primary">{f.value}</p></div></div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-surface-muted rounded-xl">
              {[
                { label: 'Client depuis', value: clientStats.clientSince },
                { label: 'Total commandes', value: String(clientStats.totalOrders) },
                { label: 'Depense totale', value: formatPrice(clientStats.totalSpent) },
                { label: 'Satisfaction', value: `${clientStats.satisfaction}/5` },
              ].map((s, i) => (
                <div key={i} className="text-center"><p className="text-lg font-extrabold text-content-primary">{s.value}</p><p className="text-[10px] text-content-faint dark:text-slate-400">{s.label}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fidelite + Parrainage ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fidelite */}
        <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-6">
          <div className="flex items-center gap-2 mb-2"><Icon name="star" className="w-5 h-5 text-yellow-500" /><h2 className="text-lg font-bold text-content-primary">Programme de fidelite</h2></div>
          <p className="text-xs text-content-muted mb-4">Gagnez des points avec chaque commande et echangez-les contre des reductions !</p>
          <div className="p-5 bg-surface-muted rounded-xl text-center mb-4 border border-surface-border-subtle">
            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-wider mb-1">Votre solde de points</p>
            <p className="text-4xl font-extrabold text-brand-blue">{clientStats.points}</p>
            <p className="text-xs text-content-faint dark:text-slate-400 mt-1">points echangeables</p>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-content-primary">Prochaine recompense : Reduction 5$</span>
              <span className="text-xs font-bold text-brand-blue">{clientStats.points}/{clientStats.nextReward}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-blue to-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${Math.min(loyaltyProgress, 100)}%` }} />
            </div>
            <p className="text-[10px] text-content-faint dark:text-slate-400 text-right mt-1">{clientStats.nextReward - clientStats.points} points restants</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-brand-blue/5 transition">Historique</button>
            <button className="flex-1 py-2 text-xs font-bold bg-brand-blue text-white rounded-xl hover:bg-brand-blue-700 transition">Recompenses</button>
          </div>
        </div>

        {/* Parrainage */}
        <div className="bg-gradient-to-br from-brand-blue to-brand-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="gift" className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold">Parrainez vos amis</h2>
            </div>
            <p className="text-xs text-blue-100 mb-4">Invitez vos proches et gagnez des points</p>

            {/* Code box */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
              <p className="text-[10px] text-blue-200 uppercase tracking-wider mb-1 font-semibold">Votre code parrain</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold tracking-widest">{clientStats.referralCode}</p>
                <button onClick={handleCopyCode} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" aria-label="Copier le code">
                  <Icon name="document" className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{clientStats.referralCount}</p>
                <p className="text-[10px] text-blue-200">Amis parrainés</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{clientStats.referralPoints.toLocaleString()}</p>
                <p className="text-[10px] text-blue-200">Points gagnés</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-extrabold">{clientStats.referralRewards}</p>
                <p className="text-[10px] text-blue-200">Récompenses</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={handleCopyCode} className="flex-1 py-2.5 text-xs font-bold bg-white text-brand-blue rounded-xl hover:bg-blue-50 transition flex items-center justify-center gap-1.5">
                <Icon name="document" className="w-3.5 h-3.5" />
                Copier le code
              </button>
              <button onClick={handleShare} className="flex-1 py-2.5 text-xs font-bold bg-white/20 text-white rounded-xl hover:bg-white/30 transition flex items-center justify-center gap-1.5 border border-white/30">
                <Icon name="share" className="w-3.5 h-3.5" />
                Partager
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Notifications ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary">Preferences de notification</h2>
            <p className="text-[10px] text-content-faint dark:text-slate-400">Notifications actives : <strong className="text-brand-blue">{notifActiveCount}/5</strong></p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { key: 'newOrder' as const, icon: 'shoppingBag', label: 'Nouvelles commandes', desc: 'Recevoir une notification pour chaque nouvelle commande.' },
            { key: 'newChatMessage' as const, icon: 'chatBubble', label: 'Nouveaux messages', desc: 'Etre notifie des messages concernant vos commandes.' },
            { key: 'general' as const, icon: 'bell', label: 'Annonces generales', desc: 'Mises a jour importantes du systeme.' },
            { key: 'promotions' as const, icon: 'sparkles', label: 'Promotions', desc: 'Offres et promotions exclusives.' },
            { key: 'orderStatusChange' as const, icon: 'arrow-path', label: 'Suivi de commande', desc: 'Changement de statut de vos commandes.' },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Icon name={pref.icon as any} className="w-4 h-4 text-brand-blue" /></div>
                <div><p className="text-xs font-medium text-content-primary">{pref.label}</p><p className="text-[10px] text-content-faint dark:text-slate-400">{pref.desc}</p></div>
              </div>
              <div className={`w-10 h-5.5 rounded-full p-0.5 cursor-pointer transition-colors ${notifPrefs[pref.key] ? 'bg-brand-blue' : 'bg-slate-300'}`} onClick={() => handleNotifToggle(pref.key)}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${notifPrefs[pref.key] ? 'translate-x-4.5' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Notifications push ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg"><Icon name="bell" className="w-5 h-5 text-content-muted" /></div>
            <div><p className="text-sm font-bold text-content-primary">Notifications push</p><p className="text-[10px] text-content-faint dark:text-slate-400">Statut : <span className="font-bold text-[#FF7A00]">Desactive</span></p></div>
          </div>
          <button className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition">Activer</button>
        </div>
      </div>

      {/* ─── Mes avis ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-content-primary">Mes avis</h2>
        </div>
        {myReviewsLoading ? (
          <p className="text-sm text-content-muted">Chargement de vos avis...</p>
        ) : myReviews.length > 0 ? (
          <div className="space-y-3">
            {myReviews.map((review) => (
              <div key={review.id} className="p-4 bg-surface-muted rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Icon key={index} name="star" className={`w-3.5 h-3.5 ${index < review.rating ? 'text-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF7A00]">
                    {formatSupportStatus(review.status)}
                  </span>
                </div>
                {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
                <p className="text-[10px] text-content-faint dark:text-slate-400 mt-2">
                  {review.order_number ? `Commande ${review.order_number}` : 'Commande'} • {new Date(review.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-content-muted">Vous n&apos;avez pas encore laissé d&apos;avis.</p>
        )}
      </div>

      {/* ─── Historique commandes ─── */}
      <div className="bg-surface-card rounded-2xl border border-surface-border-subtle p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-content-primary">Historique des commandes</h2>
          {userOrders.length > 0 && <button onClick={() => setCurrentPage({ name: 'order' })} className="text-xs font-bold text-brand-blue hover:underline">Voir toutes les commandes</button>}
        </div>
        {userOrders.length > 0 ? (
          <div className="space-y-3">
            {userOrders.slice(0, 5).map(order => {
              const st = getStatusStyle(order.status);
              return (
                <div key={order.id} className="p-4 bg-surface-muted rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-content-faint dark:text-slate-400">{order.backendOrderNumber || order.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-content-primary">{order.serviceItems?.map(s => s.service.title).join(', ') || 'Service'}</p>
                      <p className="text-[10px] text-content-faint dark:text-slate-400">{order.clientDetails?.pickupAddress?.commune || 'Gombe'} • {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="text-sm font-extrabold text-content-primary">{formatPrice(order.totalPrice)}</span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setCurrentPage({ name: 'tracking' })} className="px-2.5 py-1 text-[10px] font-bold text-brand-blue border border-brand-blue/20 rounded-lg hover:bg-brand-blue/5 transition">Suivre</button>
                    <button className="px-2.5 py-1 text-[10px] font-bold text-content-muted border border-surface-border rounded-lg hover:bg-surface-muted dark:bg-slate-800/60 transition">Recu</button>
                    <button onClick={() => setCurrentPage({ name: 'order' })} className="px-2.5 py-1 text-[10px] font-bold text-[#22C55E] border border-[#22C55E]/20 rounded-lg hover:bg-[#22C55E]/5 transition">Recommander</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-surface-border rounded-xl">
            <Icon name="shoppingBag" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-content-muted mb-1">Aucune commande pour le moment</p>
            <p className="text-xs text-content-faint dark:text-slate-400 mb-3">Pret a passer votre premiere commande ?</p>
            <button onClick={() => setCurrentPage({ name: 'order' })} className="px-5 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition">Commander maintenant</button>
          </div>
        )}
      </div>

      {/* ─── Avantages ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: 'shield-check', label: 'Paiement securise', desc: '100% securise.', color: 'text-[#22C55E]', bg: 'bg-green-50' },
          { icon: 'truck', label: 'Livraison rapide', desc: '24h a Kinshasa.', color: 'text-brand-blue', bg: 'bg-blue-50' },
          { icon: 'star', label: 'Qualite garantie', desc: 'Resultat impeccable.', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: 'phone', label: 'Support 24/7', desc: 'Toujours disponible.', color: 'text-[#FF7A00]', bg: 'bg-orange-50' },
        ].map((a, i) => (
          <div key={i} className="bg-surface-card rounded-2xl border border-surface-border-subtle p-3 text-center">
            <div className={`p-1.5 rounded-lg ${a.bg} w-fit mx-auto mb-1.5`}><Icon name={a.icon as any} className={`w-4 h-4 ${a.color}`} /></div>
            <p className="text-[10px] font-bold text-content-primary">{a.label}</p>
            <p className="text-[9px] text-content-faint dark:text-slate-400">{a.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

