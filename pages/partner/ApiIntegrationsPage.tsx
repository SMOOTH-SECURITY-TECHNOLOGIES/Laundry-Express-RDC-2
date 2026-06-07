import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface ApiProps { setSection?: (section: PartnerSection) => void; }

export const ApiIntegrationsPage: React.FC<ApiProps> = ({ setSection }) => {
  const { user, partners, addNotification } = useAppContext();

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  const apiKey = 'lx_live_1b7f2e8d9a4c7f9b23a1d6e5f7a8c9b0';
  const webhookUrl = 'https://votre-app.com/webhook/laundryexpress';

  const webhookEvents = useMemo(() => [
    { event: 'order.created', label: 'Nouvelle commande', description: 'Declenche lorsqu\'une nouvelle commande est creee.', active: true },
    { event: 'order.status.updated', label: 'Statut commande', description: 'Declenche lorsqu\'un statut de commande est mis a jour.', active: true },
    { event: 'order.completed', label: 'Commande terminee', description: 'Declenche lorsqu\'une commande est marquee comme terminee.', active: true },
    { event: 'payment.succeeded', label: 'Paiement reussi', description: 'Declenche lorsqu\'un paiement est reussi.', active: true },
    { event: 'delivery.assigned', label: 'Livraison assignee', description: 'Declenche lorsqu\'une livraison est assignee a un livreur.', active: true },
  ], []);

  const apiResources = useMemo(() => [
    { method: 'GET', endpoint: '/v1/orders', desc: 'Liste des commandes' },
    { method: 'POST', endpoint: '/v1/orders', desc: 'Creer une commande' },
    { method: 'GET', endpoint: '/v1/customers', desc: 'Liste des clients' },
    { method: 'POST', endpoint: '/v1/promotions', desc: 'Creer une promotion' },
    { method: 'GET', endpoint: '/v1/partners/me', desc: 'Profil partenaire' },
  ], []);

  const apiActivity = useMemo(() => [
    { date: '15 Mai 2026, 14:22:35', method: 'GET', endpoint: '/v1/orders?limit=10', status: 200, duration: '245 ms', ip: '197.210.45.12', user: 'Patrice (vous)' },
    { date: '15 Mai 2026, 14:20:12', method: 'POST', endpoint: '/v1/orders', status: 201, duration: '312 ms', ip: '197.210.45.12', user: 'Patrice (vous)' },
    { date: '15 Mai 2026, 14:15:08', method: 'GET', endpoint: '/v1/customers', status: 200, duration: '189 ms', ip: '197.210.45.12', user: 'Patrice (vous)' },
    { date: '15 Mai 2026, 13:45:22', method: 'POST', endpoint: '/v1/promotions', status: 201, duration: '278 ms', ip: '197.210.45.12', user: 'Marie T.' },
    { date: '15 Mai 2026, 13:30:00', method: 'GET', endpoint: '/v1/partners/me', status: 200, duration: '156 ms', ip: '197.210.45.12', user: 'Patrice (vous)' },
  ], []);

  const getMethodColor = (method: string) => {
    const m: Record<string, { bg: string; text: string }> = { GET: { bg: 'bg-green-50', text: 'text-[#22C55E]' }, POST: { bg: 'bg-blue-50', text: 'text-brand-blue' }, PUT: { bg: 'bg-orange-50', text: 'text-[#FF7A00]' }, DELETE: { bg: 'bg-red-50', text: 'text-red-500' } };
    return m[method] || { bg: 'bg-slate-50', text: 'text-slate-500' };
  };

  if (!partner) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">API & Integrations</h1>
          <p className="text-sm text-slate-500 mt-1">Gerez vos cles API et webhooks pour connecter Laundry Express a vos autres outils.</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2"><Icon name="document-text" className="w-4 h-4" />Documentation API</button>
      </div>

      {/* ─── Section 1: KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Cles API actives', value: '1', sub: 'Voir les cles', icon: 'shield-check', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Webhooks actifs', value: '1', sub: 'Voir les webhooks', icon: 'arrow-path', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Requetes API (30j)', value: '2 341', change: '+18%', icon: 'chartBar', bg: 'bg-blue-50', color: 'text-brand-blue' },
          { label: 'Derniere requete', value: 'Il y a 2 min', sub: 'Voir le journal', icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Statut API', value: 'Operationnel', sub: '100% disponibilite', icon: 'check', bg: 'bg-emerald-50', color: 'text-[#22C55E]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
            {kpi.change && <p className="text-[10px] font-bold text-[#22C55E]">{kpi.change}</p>}
            {kpi.sub && !kpi.change && <p className="text-[10px] text-brand-blue cursor-pointer hover:underline">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Section 2: Cle API + Webhooks ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cle API */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-[#0F172A] mb-1">Cle API</h2>
          <p className="text-xs text-slate-400 mb-4">Utilisez cette cle pour authentifier les requetes a l'API Laundry Express.</p>
          <div className="mb-4">
            <p className="text-[10px] text-slate-400 mb-1">Votre cle API live</p>
            <div className="flex items-center gap-2">
              <input type="text" value={apiKey} readOnly className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-[#0F172A]" />
              <button onClick={() => { navigator.clipboard.writeText(apiKey); addNotification('Cle copiee !', 'success'); }} className="px-3 py-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition"><Icon name="document" className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
              <span>Creee le 15 Mai 2026 a 10:24</span>
              <span>Derniere utilisation : <strong className="text-[#22C55E]">il y a 2 min</strong></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-1.5"><Icon name="xmark" className="w-3.5 h-3.5" />Revoquer la cle</button>
            <button className="flex-1 py-2.5 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-brand-blue/5 transition flex items-center justify-center gap-1.5"><Icon name="arrow-path" className="w-3.5 h-3.5" />Generer une nouvelle cle</button>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-[#0F172A] mb-1">Webhooks</h2>
          <p className="text-xs text-slate-400 mb-4">Soyez notifie des evenements survenant dans votre compte Laundry Express.</p>
          <div className="mb-4">
            <p className="text-[10px] text-slate-400 mb-1">URL endpoint</p>
            <div className="flex items-center gap-2">
              <input type="text" value={webhookUrl} readOnly className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#0F172A]" />
              <button className="px-3 py-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition text-xs font-bold text-slate-600">Modifier</button>
            </div>
          </div>
          <p className="text-xs font-bold text-[#0F172A] mb-2">Evenements souscrits</p>
          <div className="space-y-2 mb-4">
            {webhookEvents.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded bg-brand-blue flex items-center justify-center"><Icon name="check" className="w-3 h-3 text-white" /></div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A] font-mono">{e.event}</p>
                    <p className="text-[10px] text-slate-400">{e.description}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#22C55E]">Actif</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1.5"><Icon name="document-text" className="w-3.5 h-3.5" />Enregistrer</button>
            <button className="flex-1 py-2.5 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-1.5"><Icon name="arrow-path" className="w-3.5 h-3.5" />Tester le webhook</button>
            <button className="flex-1 py-2.5 text-xs font-bold bg-brand-blue text-white rounded-xl hover:bg-brand-blue-700 transition flex items-center justify-center gap-1.5"><Icon name="plus" className="w-3.5 h-3.5" />Ajouter un evenement</button>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Ressources API + Activite API ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ressources API */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-1">Ressources API</h2>
          <p className="text-xs text-slate-400 mb-4">Principaux endpoints disponibles.</p>
          <div className="space-y-2">
            {apiResources.map((r, i) => {
              const mc = getMethodColor(r.method);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${mc.bg} ${mc.text}`}>{r.method}</span>
                    <span className="text-xs font-mono text-[#0F172A]">{r.endpoint}</span>
                  </div>
                  <button className="text-[10px] font-bold text-brand-blue hover:underline">Voir docs</button>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2.5 text-xs font-bold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-brand-blue/5 transition flex items-center justify-center gap-1.5"><Icon name="document-text" className="w-3.5 h-3.5" />Voir toute la documentation API</button>
        </div>

        {/* Activite API */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Activite API recente</h2>
              <p className="text-[10px] text-slate-400">Journal des dernieres requetes effectuees.</p>
            </div>
            <button className="text-[10px] font-bold text-brand-blue hover:underline">Voir tout le journal →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[9px] text-slate-500">DATE</th>
                <th className="text-center py-2 text-[9px] text-slate-500">METHODE</th>
                <th className="text-left py-2 text-[9px] text-slate-500">ENDPOINT</th>
                <th className="text-center py-2 text-[9px] text-slate-500">STATUT</th>
                <th className="text-right py-2 text-[9px] text-slate-500">DUREE</th>
                <th className="text-right py-2 text-[9px] text-slate-500">IP</th>
                <th className="text-right py-2 text-[9px] text-slate-500">UTILISATEUR</th>
              </tr></thead>
              <tbody>
                {apiActivity.map((a, i) => {
                  const mc = getMethodColor(a.method);
                  return (
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 text-[10px] text-slate-500 whitespace-nowrap">{a.date}</td>
                      <td className="py-2 text-center"><span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${mc.bg} ${mc.text}`}>{a.method}</span></td>
                      <td className="py-2 text-xs font-mono text-[#0F172A]">{a.endpoint}</td>
                      <td className="py-2 text-center"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.status === 200 ? 'bg-green-50 text-[#22C55E]' : 'bg-blue-50 text-brand-blue'}`}>{a.status}</span></td>
                      <td className="py-2 text-right text-[10px] text-slate-500">{a.duration}</td>
                      <td className="py-2 text-right text-[10px] text-slate-400 font-mono">{a.ip}</td>
                      <td className="py-2 text-right text-[10px] text-slate-500">{a.user}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
