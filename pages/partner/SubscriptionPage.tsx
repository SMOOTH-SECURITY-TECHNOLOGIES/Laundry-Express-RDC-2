import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface SubscriptionProps { setSection?: (section: PartnerSection) => void; }

export const SubscriptionPage: React.FC<SubscriptionProps> = ({ setSection }) => {
  const { user, partners, getOrdersForPartner, formatPrice } = useAppContext();

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);
  const allOrders = useMemo(() => user?.partnerId ? getOrdersForPartner(user.partnerId) : [], [user, getOrdersForPartner]);
  const completedOrders = useMemo(() => allOrders.filter(o => o.status === 'COMPLETED'), [allOrders]);

  const stats = useMemo(() => {
    const revenue = completedOrders.reduce((s, o) => s + o.totalPrice, 0);
    return { orders: completedOrders.length, revenue: Math.round(revenue), prospects: 150, visitors: 2341, roi: revenue > 0 ? (revenue / 79).toFixed(1) : '0' };
  }, [completedOrders]);

  if (!partner) return null;

  const currentPlan = { name: 'Professionnel', price: 79, status: 'Actif', renewal: '15 Juin 2026', nextPayment: '79$', autoPay: true };

  const plans = [
    { name: 'Essentiel', desc: 'Parfait pour les petits pressings.', price: 29, features: ['Profil public', 'Gestion des commandes', 'Promotions', 'Analytics de base'], notIncluded: ['Analytics avancees', 'Domaine personnalise', 'Sous-domaine personnalise', 'Gestion equipe', 'Acces API', 'Automatisations avancees', 'Assistant IA avis', 'Support prioritaire'], current: false },
    { name: 'Professionnel', desc: 'Pour les entreprises en croissance.', price: 79, features: ['Profil public', 'Gestion des commandes', 'Promotions', 'Analytics de base', 'Analytics avancees', 'Domaine personnalise', 'Sous-domaine personnalise', 'Gestion equipe', 'Automatisations avancees'], notIncluded: ['Acces API', 'Assistant IA avis', 'Support prioritaire'], current: true },
    { name: 'Enterprise', desc: 'Solutions pour grandes entreprises.', price: 199, features: ['Profil public', 'Gestion des commandes', 'Promotions', 'Analytics de base', 'Analytics avancees', 'Domaine personnalise', 'Sous-domaine personnalise', 'Gestion equipe', 'Acces API', 'Automatisations avancees', 'Assistant IA avis', 'Support prioritaire'], notIncluded: [], current: false },
  ];

  const planUsage = [
    { label: 'Visiteurs du profil', used: 2341, max: 10000 },
    { label: 'Promotions actives', used: 4, max: 10 },
    { label: 'Membres equipe', used: 2, max: 5 },
    { label: 'Automatisations', used: 3, max: 10 },
  ];

  const invoicesList = [
    { date: '15 Mai 2026', plan: 'Professionnel (Mensuel)', amount: 79, status: 'Paye' },
    { date: '15 Avril 2026', plan: 'Professionnel (Mensuel)', amount: 79, status: 'Paye' },
    { date: '15 Mars 2026', plan: 'Professionnel (Mensuel)', amount: 79, status: 'Paye' },
    { date: '15 Fevrier 2026', plan: 'Professionnel (Mensuel)', amount: 79, status: 'Paye' },
    { date: '15 Janvier 2026', plan: 'Essentiel (Mensuel)', amount: 29, status: 'Paye' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Abonnement & Facturation</h1>
        <p className="text-sm text-slate-500 mt-1">Gerez votre abonnement et suivez la valeur que Laundry Express vous apporte.</p>
      </div>

      {/* ─── Section 1: Hero Plan Actuel ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <p className="text-xs text-slate-400 mb-1">Votre abonnement actuel</p>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-extrabold text-[#0F172A]">Plan {currentPlan.name}</h2>
            <span className="px-2.5 py-1 bg-[#22C55E] text-white text-[10px] font-bold rounded-full">{currentPlan.status}</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-4xl font-extrabold text-[#0F172A]">{currentPlan.price}</span>
            <span className="text-lg text-slate-400">$/mois</span>
          </div>
          <div className="space-y-1.5 mb-4">
            <p className="text-xs text-slate-500">Renouvellement : <strong className="text-[#0F172A]">{currentPlan.renewal}</strong></p>
            <p className="text-xs text-slate-500">Prochain paiement : <strong className="text-[#0F172A]">{currentPlan.nextPayment}</strong></p>
            <div className="flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
              <Icon name="check" className="w-3.5 h-3.5" />Paiement automatique active
            </div>
          </div>
        </div>
        <div className="w-32 h-32 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 hidden md:flex">
          <span className="text-6xl">🏪</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: 'pencil', label: 'Modifier mon plan', sub: 'Changer ou mettre a niveau' },
            { icon: 'arrow-down-tray', label: 'Telecharger facture', sub: 'Obtenir la derniere facture' },
            { icon: 'clock-history', label: 'Historique paiements', sub: 'Voir toutes vos factures' },
            { icon: 'wallet', label: 'Gerer le mode de paiement', sub: 'Cartes, Mobile Money, etc.' },
          ].map((a, i) => (
            <button key={i} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-left">
              <div className="flex items-center gap-2 mb-1"><Icon name={a.icon as any} className="w-4 h-4 text-brand-blue" /><span className="text-xs font-bold text-[#0F172A]">{a.label}</span></div>
              <p className="text-[10px] text-slate-400 ml-6">{a.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Section 2: Valeur generee ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A]">Valeur generee grace a Laundry Express</h2>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">30 derniers jours</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Commandes generees', value: String(stats.orders), change: '+15% vs mois dernier', icon: 'shoppingBag', bg: 'bg-blue-50', color: 'text-brand-blue' },
            { label: 'Revenues generes', value: formatPrice(stats.revenue), change: '+22% vs mois dernier', icon: 'currencyDollar', bg: 'bg-green-50', color: 'text-[#22C55E]' },
            { label: 'Nouveaux clients', value: String(stats.prospects), change: '+18% vs mois dernier', icon: 'user', bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Visiteurs du profil', value: stats.visitors.toLocaleString('fr-FR'), change: '+30% vs mois dernier', icon: 'eye', bg: 'bg-cyan-50', color: 'text-cyan-600' },
          ].map((kpi, i) => (
            <div key={i} className={`p-4 rounded-xl ${kpi.bg}`}>
              <div className="flex items-center gap-1.5 mb-2"><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /><span className="text-xs font-medium text-slate-600">{kpi.label}</span></div>
              <p className="text-2xl font-extrabold text-[#0F172A]">{kpi.value}</p>
              <p className="text-[10px] font-medium text-[#22C55E] mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center"><Icon name="chartBar" className="w-4 h-4 text-[#22C55E]" /></div>
            <div>
              <p className="text-sm text-[#0F172A]">Vous avez gagne <strong className="text-[#22C55E]">{formatPrice(stats.revenue)}</strong> ce mois-ci grace a Laundry Express pour un abonnement de <strong>{formatPrice(currentPlan.price)}</strong>.</p>
              <p className="text-xs text-slate-500">Retour sur investissement : <strong className="text-[#22C55E]">{stats.roi}x</strong></p>
            </div>
          </div>
          {setSection && <button onClick={() => setSection('analytics')} className="px-4 py-2 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition shrink-0">Voir rapport detaille</button>}
        </div>
      </div>

      {/* ─── Section 3: Comparateur plans ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#0F172A]">Choisissez le plan qui propulse votre croissance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl border-2 p-5 relative ${plan.current ? 'border-brand-blue shadow-lg' : 'border-slate-100'}`}>
              {plan.current && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-blue text-white text-[10px] font-bold rounded-full">Plan actuel</span>}
              {plan.name === 'Enterprise' && !plan.current && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full">⭐ Recommande</span>}
              <p className="text-lg font-bold text-[#0F172A] mb-1">{plan.name}</p>
              <p className="text-xs text-slate-500 mb-3">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-[#0F172A]">{plan.price}$</span>
                <span className="text-sm text-slate-400">/mois</span>
              </div>
              <div className="space-y-2 mb-5">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-[#0F172A]"><Icon name="check" className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />{f}</div>
                ))}
                {plan.notIncluded.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-slate-400"><Icon name="xmark" className="w-3.5 h-3.5 text-slate-300 shrink-0" />{f}</div>
                ))}
              </div>
              <button className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${plan.current ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' : plan.name === 'Enterprise' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {plan.current ? 'Plan actuel' : plan.name === 'Enterprise' ? 'Passer a Enterprise' : 'Choisir ce plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Section 4: ROI Calculator + Consommation ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Quel plan est le plus rentable pour vous ?</h2>
          <p className="text-xs text-slate-400 mb-4">Calculez votre ROI en fonction de vos commandes</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 mb-1">Commandes / mois</p>
              <p className="text-2xl font-extrabold text-[#0F172A]">{stats.orders}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-[10px] text-slate-400 mb-1">Panier moyen</p>
              <p className="text-2xl font-extrabold text-[#0F172A]">{formatPrice(stats.orders > 0 ? stats.revenue / stats.orders : 0)}</p>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <p className="text-xs font-bold text-[#0F172A] mb-2">Resultat estime</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs"><span className="text-slate-500">CA potentiel</span><span className="font-bold text-[#0F172A]">{formatPrice(stats.revenue)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">Plan conseille</span><span className="px-2 py-0.5 bg-brand-blue text-white text-[10px] font-bold rounded-full">Professionnel</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-500">ROI estime</span><span className="font-bold text-[#22C55E]">{stats.roi}x</span></div>
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-[#22C55E] font-medium">
              <Icon name="check" className="w-3.5 h-3.5" />Vous etes deja sur le bon plan !
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Consommation de votre plan</h2>
          </div>
          <div className="space-y-4">
            {planUsage.map((u, i) => {
              const pct = Math.round((u.used / u.max) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-[#0F172A]">{u.label}</span>
                    <span className="text-sm font-bold text-[#0F172A]">{u.used.toLocaleString('fr-FR')} / {u.max.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-[#FF7A00]' : 'bg-brand-blue'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right mt-0.5">{pct}%</p>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-bold text-brand-blue hover:underline">Voir toutes les quotas et limites</button>
        </div>
      </div>

      {/* ─── Section 5: Historique + Paiements + Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Historique de facturation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[10px] text-slate-500">DATE</th>
                <th className="text-left py-2 text-[10px] text-slate-500">PLAN</th>
                <th className="text-right py-2 text-[10px] text-slate-500">MONTANT</th>
                <th className="text-center py-2 text-[10px] text-slate-500">STATUT</th>
                <th className="text-center py-2 text-[10px] text-slate-500">FACTURE</th>
              </tr></thead>
              <tbody>
                {invoicesList.map((inv, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 text-xs text-slate-500">{inv.date}</td>
                    <td className="py-2 text-xs font-medium text-[#0F172A]">{inv.plan}</td>
                    <td className="py-2 text-xs font-bold text-right text-[#0F172A]">{formatPrice(inv.amount)}</td>
                    <td className="py-2 text-center"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-[#22C55E]">{inv.status}</span></td>
                    <td className="py-2 text-center"><button className="p-1 hover:bg-slate-100 rounded"><Icon name="arrow-down-tray" className="w-3.5 h-3.5 text-slate-400" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-brand-blue hover:underline text-center">Voir tout l'historique</button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Methodes de paiement</h2>
          <div className="space-y-2">
            {[
              { method: 'Mobile Money (Orange Money)', details: '+243 81 234 56 78', status: 'Principal', color: 'bg-[#22C55E]/10 text-[#22C55E]', icon: 'wallet' },
              { method: 'Visa ****-4242', details: 'Expire 06/27', status: 'Secondaire', color: 'bg-blue-50 text-brand-blue', icon: 'wallet' },
              { method: 'Virement bancaire', details: 'XXXX-XXXX-XXXX-1234', status: 'Secondaire', color: 'bg-slate-100 text-slate-500', icon: 'wallet' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Icon name={p.icon as any} className="w-4 h-4 text-slate-400" />
                  <div><p className="text-xs font-bold text-[#0F172A]">{p.method}</p><p className="text-[10px] text-slate-400">{p.details}</p></div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.color}`}>{p.status}</span>
              </div>
            ))}
            <button className="w-full py-2 text-xs font-bold text-brand-blue border border-dashed border-brand-blue/30 rounded-xl hover:bg-brand-blue/5 transition flex items-center justify-center gap-1"><Icon name="plus" className="w-3 h-3" />Ajouter une methode</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Actions & Support</h2>
          <div className="space-y-2">
            {[
              { icon: 'pencil', label: 'Changer de plan', sub: 'Mettre a niveau ou retrograder' },
              { icon: 'xmark', label: 'Suspendre l\'abonnement', sub: 'Suspendre temporairement' },
              { icon: 'document-text', label: 'Telecharger contrat', sub: 'Contrat d\'abonnement signe' },
              { icon: 'lifebuoy', label: 'Contacter le support', sub: 'Cloture du ticket d\'aide' },
            ].map((a, i) => (
              <button key={i} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <div className="flex items-center gap-2.5">
                  <Icon name={a.icon as any} className="w-4 h-4 text-slate-400" />
                  <div><p className="text-xs font-bold text-[#0F172A]">{a.label}</p><p className="text-[10px] text-slate-400">{a.sub}</p></div>
                </div>
                <Icon name="arrowRight" className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 6: Parcours + Enterprise CTA ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-4">Votre parcours avec Laundry Express</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
            {[
              { date: '12 Jan 2026', event: 'Compte cree', icon: 'user', color: 'bg-brand-blue' },
              { date: '12 Jan 2026', event: 'Abonnement Essentiel', icon: 'star', color: 'bg-[#22C55E]' },
              { date: '15 Mar 2026', event: 'Upgrade Professionnel', icon: 'arrow-path', color: 'bg-purple-600' },
              { date: '15 Juin 2026', event: 'Prochain renouvellement', icon: 'calendar', color: 'bg-[#FF7A00]' },
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-3 mb-4 relative">
                <div className={`w-8 h-8 rounded-full ${h.color} flex items-center justify-center z-10 shrink-0`}>
                  <Icon name={h.icon as any} className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-xs font-bold text-[#0F172A]">{h.event}</p>
                  <p className="text-[10px] text-slate-400">{h.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="sparkles" className="w-5 h-5 text-[#FFD700]" />
            <h2 className="text-lg font-extrabold">Debloquez tout le potentiel avec Enterprise</h2>
          </div>
          <p className="text-xs text-white/70 mb-4">Automatisez, integrez et developpez votre pressing sans limites.</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {['API complete', 'Rapports personnalises', 'Automatisations avancees', 'IA reputation', 'Multi-sites', 'Support prioritaire 24/7'].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-white/80"><Icon name="check" className="w-3 h-3 text-[#22C55E]" />{f}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-white text-[#1E3A5F] text-xs font-bold rounded-xl hover:bg-white/90 transition">Voir Enterprise</button>
            <button className="flex-1 py-2.5 bg-white/20 text-white text-xs font-bold rounded-xl hover:bg-white/30 transition">Planifier une demo</button>
          </div>
        </div>
      </div>
    </div>
  );
};
