import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface AutomationProps { setSection?: (section: PartnerSection) => void; }

export const AutomationPage: React.FC<AutomationProps> = ({ setSection }) => {
  const { user, partners, addNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'basique' | 'messagerie' | 'regles' | 'analytique'>('basique');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  const automations = useMemo(() => [
    { icon: 'shoppingBag', iconBg: 'bg-[#22C55E]/10', iconColor: 'text-[#22C55E]', name: 'Acceptation automatique des commandes', desc: 'Accepter automatiquement les nouvelles commandes entrantes.', detail: 'Toujours actif', enabled: true },
    { icon: 'clock', iconBg: 'bg-brand-blue/10', iconColor: 'text-brand-blue', name: "Heures d'ouverture", desc: "N'accepter les commandes automatiquement que pendant vos heures d'ouverture.", detail: 'Tous les jours 07:00 – 19:00', enabled: true },
    { icon: 'chatBubble', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', name: 'Confirmation automatique par SMS', desc: 'Envoyer un SMS de confirmation des qu\'une commande est acceptee.', detail: 'Envoye immediatement', enabled: true },
    { icon: 'bell', iconBg: 'bg-orange-50', iconColor: 'text-[#FF7A00]', name: 'Rappel de commande prete', desc: 'Notifier le client lorsque sa commande est prete a etre recuperee.', detail: 'Envoye 1 heure apres le statut "Pret"', enabled: true },
    { icon: 'star', iconBg: 'bg-red-50', iconColor: 'text-red-500', name: 'Demande d\'avis client', desc: 'Envoyer une demande d\'avis apres la livraison ou le retrait.', detail: 'Envoye 24h apres livraison', enabled: true },
  ], []);

  const popularTemplates = useMemo(() => [
    { icon: 'chatBubble', name: 'Reponse automatique', desc: 'Repondre aux nouveaux messages', color: 'text-brand-blue' },
    { icon: 'shoppingBag', name: 'Suivi de commande', desc: 'Informer le client du statut', color: 'text-[#22C55E]' },
    { icon: 'clock', name: 'Rappel paiement', desc: 'Relancer les paiements en attente', color: 'text-[#FF7A00]' },
    { icon: 'star', name: 'Anniversaire client', desc: 'Envoyer un coupon le jour J', color: 'text-red-500' },
  ], []);

  const stats = useMemo(() => ({
    active: automations.length,
    timeSaved: 87,
    executionRate: 96,
    totalActions: 1245,
    succeeded: 1195,
    partial: 32,
    failed: 18,
  }), [automations]);

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Parametres d'automatisation</h1>
        <p className="text-sm text-slate-500 mt-1">Automatisez vos processus metier pour gagner du temps et ameliorer la communication client.</p>
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-slate-200">
        {([['basique', 'Basique'], ['messagerie', 'Messagerie'], ['regles', 'Regles avancees'], ['analytique', 'Analytique']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} className={`px-4 py-2.5 text-xs font-bold border-b-2 transition ${activeTab === key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Automatisations actives', value: String(stats.active), change: '+2 ce mois', icon: 'arrow-path', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'Tems economise', value: `${stats.timeSaved} h`, change: '+18% ce mois', icon: 'clock', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: "Taux d'execution", value: `${stats.executionRate}%`, sub: 'Excellent', icon: 'check', bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Actions automatisees', value: stats.totalActions.toLocaleString('fr-FR'), sub: 'Ce mois', icon: 'arrow-right', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-5 h-5 ${kpi.color}`} /></div>
            <p className="text-lg font-extrabold text-[#0F172A] mb-0.5">{kpi.value}</p>
            <p className="text-[10px] text-slate-400">{kpi.label}</p>
            {kpi.change && <p className="text-[10px] font-bold text-[#22C55E] mt-0.5">{kpi.change}</p>}
            {kpi.sub && !kpi.change && <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Main Content: Automatisations + Sidebar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automatisations principales */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-4">Automatisations principales</h2>
          <div className="space-y-3">
            {automations.map((auto, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${auto.iconBg}`}><Icon name={auto.icon as any} className={`w-5 h-5 ${auto.iconColor}`} /></div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{auto.name}</p>
                    <p className="text-[10px] text-slate-400">{auto.desc}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Icon name="clock" className="w-3 h-3" />{auto.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#22C55E]">Active</span>
                  <div className="w-10 h-5.5 rounded-full p-0.5 bg-[#22C55E] cursor-pointer transition-colors">
                    <div className="w-4.5 h-4.5 rounded-full bg-white shadow translate-x-4.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-brand-blue/5 transition flex items-center justify-center gap-1.5">Voir toutes les automatisations →</button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">Statut de l'automatisation</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="96 4" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-extrabold text-[#0F172A]">96%</span></div>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /><span className="text-slate-600">Reussies</span><span className="font-bold ml-auto">{stats.succeeded}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF7A00]" /><span className="text-slate-600">Partielles</span><span className="font-bold ml-auto">{stats.partial}</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-600">Echouees</span><span className="font-bold ml-auto">{stats.failed}</span></div>
              </div>
            </div>
            <p className="text-[10px] text-[#22C55E] font-bold mb-3">Excellent</p>
            <button className="w-full py-2 text-xs font-bold text-brand-blue hover:underline flex items-center justify-center gap-1">Voir les journaux d'execution →</button>
          </div>

          {/* Modeles populaires */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">Modeles populaires</h2>
            <div className="space-y-2.5">
              {popularTemplates.map((tpl, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <Icon name={tpl.icon as any} className={`w-4 h-4 ${tpl.color}`} />
                    <div><p className="text-xs font-bold text-[#0F172A]">{tpl.name}</p><p className="text-[10px] text-slate-400">{tpl.desc}</p></div>
                  </div>
                  <button className="px-3 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Utiliser</button>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 text-xs font-bold text-brand-blue hover:underline flex items-center justify-center gap-1">Voir tous les modeles →</button>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: 'plus', label: 'Creer une automatisation', color: 'text-brand-blue' },
                { icon: 'arrow-down-tray', label: 'Importer un modele', color: 'text-[#22C55E]' },
                { icon: 'arrow-path', label: 'Dupliquer une regle', color: 'text-purple-600' },
                { icon: 'play', label: 'Tester une regle', color: 'text-[#FF7A00]' },
              ].map((a, i) => (
                <button key={i} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition flex items-center gap-2">
                  <Icon name={a.icon as any} className={`w-4 h-4 ${a.color}`} />
                  <span className="text-[10px] font-bold text-[#0F172A]">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Automatisez intelligemment. Gagnez du temps.</h3>
            <p className="text-xs text-white/80">Les entreprises utilisant l'automatisation gagnent en moyenne 87 heures par mois.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Decouvrir plus d'automations</button>
      </div>
    </div>
  );
};
