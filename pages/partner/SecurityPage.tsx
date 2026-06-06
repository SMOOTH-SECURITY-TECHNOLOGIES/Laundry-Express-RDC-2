import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';
import { timeSince } from '../../utils/timeSince';

interface SecurityProps { setSection?: (section: PartnerSection) => void; }

export const SecurityPage: React.FC<SecurityProps> = ({ setSection }) => {
  const { user, partners, getAllUsers } = useAppContext();
  const [activityFilter, setActivityFilter] = useState('Tous');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  /* ─── Mock Data ─── */
  const team2FA = useMemo(() => [
    { name: 'Patrice M.', role: 'Proprietaire', enabled: true },
    { name: 'Marie T.', role: 'Manager', enabled: true },
    { name: 'Alain B.', role: 'Manager', enabled: true },
    { name: 'Jean L.', role: 'Livreur', enabled: false },
    { name: 'David K.', role: 'Agent', enabled: false },
    { name: 'Sarah M.', role: 'Agent', enabled: true },
  ], []);

  const sessions = useMemo(() => [
    { device: 'Windows 11', browser: 'Chrome', location: 'Kinshasa, CD', lastActive: 'Maintenant', ip: '197.210.45.12', current: true },
    { device: 'iPhone 13', browser: 'Safari iOS', location: 'Gombe, CD', lastActive: '10 min', ip: '197.210.45.12', current: false },
    { device: 'MacBook Pro', browser: 'Chrome', location: 'Kinshasa, CD', lastActive: '45 min', ip: '197.210.45.12', current: false },
    { device: 'Android', browser: 'Chrome', location: 'Limete, CD', lastActive: '2 h', ip: '197.210.45.88', current: false },
  ], []);

  const activityLog = useMemo(() => [
    { user: 'Patrice M.', action: "s'est connecte", detail: 'Navigateur Chrome sur Windows', time: 'Il y a 2 min', ip: '197.210.45.12', icon: 'user', color: 'text-[#0077B6]', category: 'Connexion' },
    { user: 'Marie T.', action: 'a modifie un tarif de service', detail: 'Service : Nettoyage a sec', time: 'Il y a 15 min', ip: '197.210.45.12', icon: 'pencil', color: 'text-[#FF7A00]', category: 'Equipe' },
    { user: 'Jean L.', action: 'a accepte la commande', detail: 'Commande #CMD-204', time: 'Il y a 28 min', ip: '197.210.45.88', icon: 'check', color: 'text-[#22C55E]', category: 'Commandes' },
    { user: 'David K.', action: 'a supprime une photo', detail: 'Galerie du profil', time: 'Il y a 1 h', ip: '197.210.45.12', icon: 'xmark', color: 'text-red-500', category: 'Equipe' },
    { user: 'Patrice M.', action: 'a cree une promotion', detail: 'Code : WELCOME20', time: 'Il y a 2 h', ip: '197.210.45.12', icon: 'sparkles', color: 'text-[#FF7A00]', category: 'Facturation' },
    { user: 'Sarah M.', action: 'a mis a jour le profil', detail: 'Photos du pressing', time: 'Il y a 3 h', ip: '197.210.45.12', icon: 'photo', color: 'text-purple-600', category: 'Equipe' },
    { user: 'Patrice M.', action: 'a genere une facture', detail: 'INV-2026-024', time: 'Il y a 4 h', ip: '197.210.45.12', icon: 'document-text', color: 'text-[#0077B6]', category: 'Facturation' },
  ], []);

  const anomalies = useMemo(() => [
    { type: 'Connexion inhabituelle', detail: 'Brazzaville, Congo', time: '23:54', severity: 'Moyen', icon: 'warning', color: 'text-[#FF7A00]' },
    { type: 'Tentative mot de passe echouee', detail: '5 fois en 10 min', time: '21:10', severity: 'Eleve', icon: 'shield-check', color: 'text-red-500' },
    { type: 'Nouvel appareil connecte', detail: 'Inconnu : Android - Samsung', time: '18:22', severity: 'Faible', icon: 'device-phone-mobile', color: 'text-[#0077B6]' },
  ], []);

  const criticalActions = useMemo(() => [
    { action: 'Changement d\'abonnement', user: 'Patrice M.', date: '14 Mai 2026, 10:21' },
    { action: 'Modification des finances', user: 'Marie T.', date: '14 Mai 2026, 09:45' },
    { action: 'Export des donnees', user: 'Patrice M.', date: '13 Mai 2026, 16:30' },
    { action: 'Suppression d\'utilisateur', user: 'Patrice M.', date: '12 Mai 2026, 11:12' },
    { action: 'Creation de cle API', user: 'Patrice M.', date: '11 Mai 2026, 14:05' },
  ], []);

  const stats = useMemo(() => ({
    score: 92,
    twoFAEnabled: team2FA.filter(m => m.enabled).length,
    twoFATotal: team2FA.length,
    activeSessions: sessions.length,
    knownDevices: 18,
    blockedAttempts: 23,
  }), [team2FA, sessions]);

  if (!partner) return null;

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'Tous') return activityLog;
    return activityLog.filter(a => a.category === activityFilter);
  }, [activityLog, activityFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Securite & Activite</h1>
          <p className="text-sm text-slate-500 mt-1">Protegez votre entreprise, surveillez votre equipe et controlez les acces.</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition flex items-center gap-2"><Icon name="shield-check" className="w-4 h-4" />Parametres de securite</button>
      </div>

      {/* ─── Section 1: 6 KPI Security ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Score securite', value: `${stats.score}/100`, sub: 'Excellent', icon: 'shield-check', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: '2FA active', value: `${stats.twoFAEnabled} / ${stats.twoFATotal}`, sub: 'Utilisateurs', icon: 'lock-closed', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
          { label: 'Sessions actives', value: String(stats.activeSessions), sub: 'Voir toutes', icon: 'user', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Appareils connus', value: String(stats.knownDevices), sub: 'Voir la liste', icon: 'computer', bg: 'bg-cyan-50', color: 'text-cyan-600' },
          { label: 'Tentatives bloquees', value: String(stats.blockedAttempts), sub: '30 derniers jours', icon: 'shield-check', bg: 'bg-red-50', color: 'text-red-500' },
          { label: 'Derniere activite', value: 'Il y a 2 min', sub: "Aujourd'hui", icon: 'clock', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
            <p className="text-[10px] text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Section 2: Security Health + 2FA + Couverture equipe ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Health */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Etat de securite global</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="92 8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-extrabold text-[#0F172A]">92</span><span className="text-[9px] text-slate-400">/100</span></div>
            </div>
            <div>
              <p className="text-sm font-bold text-[#22C55E]">Excellent</p>
              <p className="text-[10px] text-slate-400">Score de securite</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {[
              { label: '2FA active', ok: true },
              { label: 'Mot de passe fort', ok: true },
              { label: 'Sessions surveillees', ok: true },
              { label: 'API securisee', ok: true },
              { label: 'Journal d\'activite actif', ok: true },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Icon name={c.ok ? 'check' : 'warning'} className={`w-3.5 h-3.5 ${c.ok ? 'text-[#22C55E]' : 'text-[#FF7A00]'}`} />
                <span className={c.ok ? 'text-[#0F172A]' : 'text-[#FF7A00]'}>{c.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-xs">
              <Icon name="warning" className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span className="text-[#FF7A00]">5 employs sans 2FA</span>
            </div>
          </div>
          <button className="w-full py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition">Ameliorer la securite</button>
        </div>

        {/* 2FA */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Authentification a deux facteurs (2FA)</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Activee</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl mb-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Icon name="shield-check" className="w-5 h-5 text-[#0077B6]" /></div>
              <div><p className="text-xs font-bold text-[#0F172A]">Google Authenticator</p><p className="text-[10px] text-slate-400">Activee depuis 14 Mai 2026</p></div>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl mb-3">
            <p className="text-xs font-bold text-[#0F172A] mb-1">Codes de secours</p>
            <p className="text-[10px] text-slate-400">10 codes disponibles</p>
          </div>
          <div className="space-y-2">
            <button className="w-full py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition flex items-center justify-center gap-1.5"><Icon name="search" className="w-3 h-3" />Voir le QR code</button>
            <button className="w-full py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition flex items-center justify-center gap-1.5"><Icon name="arrow-path" className="w-3 h-3" />Regenerer les codes</button>
            <button className="w-full py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-1.5"><Icon name="xmark" className="w-3 h-3" />Desactiver 2FA</button>
          </div>
        </div>

        {/* Couverture 2FA equipe */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Couverture 2FA de l'equipe</h2>
          <div className="space-y-2">
            {team2FA.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${m.enabled ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-red-50 text-red-500'}`}>{m.name.split(' ').map(n => n[0]).join('')}</div>
                  <div><p className="text-xs font-bold text-[#0F172A]">{m.name}</p><p className="text-[9px] text-slate-400">{m.role}</p></div>
                </div>
                <span className={`text-[10px] font-bold ${m.enabled ? 'text-[#22C55E]' : 'text-red-500'}`}>{m.enabled ? 'Activee' : 'Desactivee'}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition flex items-center justify-center gap-1.5"><Icon name="envelope" className="w-3 h-3" />Envoyer un rappel 2FA</button>
        </div>
      </div>

      {/* ─── Section 3: Sessions + Journal ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Sessions actives</h2>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir toutes les sessions</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[9px] text-slate-500">APPAREIL</th>
                <th className="text-left py-2 text-[9px] text-slate-500">NAVIGATEUR</th>
                <th className="text-left py-2 text-[9px] text-slate-500">LOCALISATION</th>
                <th className="text-left py-2 text-[9px] text-slate-500">DERNIERE ACTIVITE</th>
                <th className="text-center py-2 text-[9px] text-slate-500">ACTION</th>
              </tr></thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.current ? 'bg-[#22C55E]' : 'bg-slate-300'}`} />
                        <span className="text-xs font-medium text-[#0F172A]">{s.device}</span>
                      </div>
                    </td>
                    <td className="py-2 text-xs text-slate-500">{s.browser}</td>
                    <td className="py-2 text-xs text-slate-500">{s.location}</td>
                    <td className="py-2 text-xs text-slate-500">{s.lastActive}</td>
                    <td className="py-2 text-center"><button className="text-[10px] font-bold text-red-500 hover:underline">Deconnecter</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition">Deconnecter tous les appareils</button>
        </div>

        {/* Journal activite */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Journal d'activite</h2>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir tout le journal</button>
          </div>
          <div className="flex gap-1.5 mb-3 overflow-x-auto">
            {['Tous', 'Connexion', 'Equipe', 'Commandes', 'Facturation', 'Livraison'].map(f => (
              <button key={f} onClick={() => setActivityFilter(f)} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition ${activityFilter === f ? 'bg-[#0077B6] text-white' : 'bg-slate-100 text-slate-600'}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-2.5">
            {filteredActivity.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-slate-100 shrink-0"><Icon name={a.icon as any} className={`w-3 h-3 ${a.color}`} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#0F172A]"><strong>{a.user}</strong> {a.action}</p>
                  <p className="text-[9px] text-slate-400">{a.detail} • {a.ip}</p>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 4: Anomalies + Actions sensibles + API ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomalies */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Activites suspectes</h2>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir toutes</button>
          </div>
          <div className="space-y-2.5">
            {anomalies.map((a, i) => {
              const sevColor = a.severity === 'Eleve' ? 'bg-red-50 text-red-500' : a.severity === 'Moyen' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-blue-50 text-[#0077B6]';
              return (
                <div key={i} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon name={a.icon as any} className={`w-3.5 h-3.5 ${a.color}`} />
                      <span className="text-xs font-bold text-[#0F172A]">{a.type}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${sevColor}`}>{a.severity}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 ml-5">{a.detail} • {a.time}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions sensibles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Actions sensibles</h2>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Voir tout</button>
          </div>
          <div className="space-y-2">
            {criticalActions.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-[#0F172A]">{a.action}</p>
                  <p className="text-[9px] text-slate-400">{a.user} • {a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Security */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Securite API</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E]">Activee</span>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Cles API actives</span>
              <span className="font-bold text-[#0F172A]">2 cles</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Derniere utilisation</span>
              <span className="font-bold text-[#0F172A]">Aujourd'hui 14:23</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition">Voir les cles</button>
            <button className="flex-1 py-2 text-xs font-bold bg-[#0077B6] text-white rounded-lg hover:bg-[#005f8f] transition">Journal API</button>
          </div>
        </div>
      </div>

      {/* ─── Section 5: Recuperation + Conformite + Rapport ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recuperation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Centre de recuperation</h2>
          <div className="space-y-2.5">
            {[
              { label: 'Email de recuperation', value: 'patrice@prestige.com', status: 'Verifie' },
              { label: 'Telephone de recuperation', value: '+243 81 234 56 78', status: 'Verifie' },
              { label: 'Codes de recuperation', value: '10 codes disponibles', status: 'Voir' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div><p className="text-xs font-medium text-[#0F172A]">{r.label}</p><p className="text-[10px] text-slate-400">{r.value}</p></div>
                <span className="text-[10px] font-bold text-[#22C55E]">{r.status}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition">Mettre a jour</button>
        </div>

        {/* Conformite */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Conformite & Donnees</h2>
          <div className="space-y-3">
            {[
              { icon: 'document-text', label: 'Conservation des logs', value: '365 jours', action: 'Modifier' },
              { icon: 'arrow-down-tray', label: 'Export RGPD', value: 'Telecharger vos donnees', action: 'Exporter' },
              { icon: 'xmark', label: 'Suppression des donnees', value: 'Demander la suppression', action: 'Demarrer' },
            ].map((c, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={c.icon as any} className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-[#0F172A]">{c.label}</span>
                </div>
                <div className="flex items-center justify-between ml-6">
                  <span className="text-[10px] text-slate-400">{c.value}</span>
                  <button className="text-[10px] font-bold text-[#0077B6] hover:underline">{c.action}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rapport */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Rapport securite mensuel</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Connexions', value: '23', icon: 'user', color: 'text-[#0077B6]' },
              { label: 'Tentatives bloquees', value: '23', icon: 'shield-check', color: 'text-red-500' },
              { label: 'Appareils utilises', value: '12', icon: 'computer', color: 'text-purple-600' },
              { label: 'Activites suspectes', value: '0', icon: 'warning', color: 'text-[#22C55E]' },
            ].map((r, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl text-center">
                <Icon name={r.icon as any} className={`w-5 h-5 mx-auto mb-1 ${r.color}`} />
                <p className="text-lg font-extrabold text-[#0F172A]">{r.value}</p>
                <p className="text-[9px] text-slate-400">{r.label}</p>
              </div>
            ))}
          </div>
          <button className="w-full py-2 text-xs font-bold text-[#0077B6] border border-[#0077B6]/20 rounded-lg hover:bg-[#0077B6]/5 transition flex items-center justify-center gap-1.5"><Icon name="arrow-down-tray" className="w-3 h-3" />Telecharger le rapport PDF</button>
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-[#22C55E] to-[#1a9c4a] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Votre compte est protege.</h3>
            <p className="text-xs text-white/80">92/100 score securite • 7 utilisateurs proteges par 2FA • 0 menace active</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-[#22C55E] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Voir l'audit complet</button>
      </div>
    </div>
  );
};
