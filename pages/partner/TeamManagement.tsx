import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Icon } from '../../components/Icon';
import { PartnerSection } from '../../types';
import { findPartner } from '../../utils/findPartner';

interface TeamProps { setSection?: (section: PartnerSection) => void; }

export const TeamManagement: React.FC<TeamProps> = ({ setSection }) => {
  const { user, partners, getAllUsers } = useAppContext();
  const [search, setSearch] = useState('');

  const partner = useMemo(() => findPartner(partners, user?.partnerId), [partners, user]);

  const teamMembers = useMemo(() => [
    { id: '1', name: 'Patrice M.', role: 'Proprietaire', phone: '+243 81 234 56 78', status: 'Actif', lastActivity: 'Aujourd\'hui', avatar: 'PM', online: true, deliveries: 0, commands: 45, rating: 0, productivity: 100 },
    { id: '2', name: 'Marie T.', role: 'Manager', phone: '+243 82 345 67 89', status: 'Actif', lastActivity: 'Il y a 5 min', avatar: 'MT', online: true, deliveries: 0, commands: 37, rating: 4.8, productivity: 96 },
    { id: '3', name: 'Alain B.', role: 'Manager', phone: '+243 83 456 78 90', status: 'Conge', lastActivity: 'Hier', avatar: 'AB', online: false, deliveries: 0, commands: 31, rating: 4.7, productivity: 95 },
    { id: '4', name: 'Jean L.', role: 'Livreur', phone: '+243 84 567 89 01', status: 'En tournee', lastActivity: 'Il y a 2 min', avatar: 'JL', online: true, deliveries: 42, commands: 0, rating: 4.9, productivity: 98 },
    { id: '5', name: 'David K.', role: 'Livreur', phone: '+243 85 678 90 12', status: 'Absent', lastActivity: 'Hier, 18:45', avatar: 'DK', online: false, deliveries: 0, commands: 0, rating: 4.7, productivity: 0 },
    { id: '6', name: 'Sarah M.', role: 'Agent', phone: '+243 86 789 01 23', status: 'Actif', lastActivity: 'Il y a 1h', avatar: 'SM', online: true, deliveries: 0, commands: 22, rating: 4.6, productivity: 93 },
    { id: '7', name: 'Paul N.', role: 'Agent', phone: '+243 87 890 12 34', status: 'Actif', lastActivity: 'Il y a 3h', avatar: 'PN', online: true, deliveries: 0, commands: 18, rating: 4.5, productivity: 90 },
    { id: '8', name: 'Lucie K.', role: 'Agent', phone: '+243 88 901 23 45', status: 'Actif', lastActivity: 'Il y a 30 min', avatar: 'LK', online: true, deliveries: 0, commands: 15, rating: 4.4, productivity: 88 },
    { id: '9', name: 'Eric M.', role: 'Livreur', phone: '+243 89 012 34 56', status: 'En tournee', lastActivity: 'Il y a 10 min', avatar: 'EM', online: true, deliveries: 28, commands: 0, rating: 4.8, productivity: 97 },
    { id: '10', name: 'Grace N.', role: 'Agent', phone: '+243 90 123 45 67', status: 'Actif', lastActivity: 'Il y a 45 min', avatar: 'GN', online: true, deliveries: 0, commands: 20, rating: 4.5, productivity: 91 },
    { id: '11', name: 'Francois L.', role: 'Livreur', phone: '+243 91 234 56 78', status: 'Actif', lastActivity: 'Il y a 15 min', avatar: 'FL', online: true, deliveries: 35, commands: 0, rating: 4.9, productivity: 99 },
    { id: '12', name: 'Nadia P.', role: 'Agent', phone: '+243 92 345 67 89', status: 'Absent', lastActivity: 'Avant-hier', avatar: 'NP', online: false, deliveries: 0, commands: 12, rating: 4.3, productivity: 85 },
  ], []);

  const filteredMembers = useMemo(() => {
    if (!search) return teamMembers;
    const q = search.toLowerCase();
    return teamMembers.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.phone.includes(q));
  }, [teamMembers, search]);

  const stats = useMemo(() => ({
    total: teamMembers.length,
    present: teamMembers.filter(m => m.status === 'Actif' || m.status === 'En tournee').length,
    drivers: teamMembers.filter(m => m.role === 'Livreur' && m.status !== 'Absent').length,
    managers: teamMembers.filter(m => m.role === 'Manager').length,
    pendingInvites: 2,
    productivity: 92,
  }), [teamMembers]);

  const activity = useMemo(() => [
    { user: 'Marie T.', action: 'a accepte la commande', detail: 'CMD-203', time: 'Il y a 5 min', icon: 'check', color: 'text-[#22C55E]' },
    { user: 'Jean L.', action: 'a livre la commande', detail: 'CMD-198', time: 'Il y a 12 min', icon: 'truck', color: 'text-[#0077B6]' },
    { user: 'David K.', action: 'a mis a jour le statut', detail: 'CMD-201', time: 'Il y a 20 min', icon: 'pencil', color: 'text-[#FF7A00]' },
    { user: 'Sarah M.', action: 'a ajoute un nouveau client', detail: 'Patrick M.', time: 'Il y a 35 min', icon: 'user', color: 'text-purple-600' },
    { user: 'Patrice', action: 'a cree une promotion', detail: 'COSTUME15', time: 'Il y a 1h', icon: 'sparkles', color: 'text-[#FF7A00]' },
  ], []);

  const pendingInvites = useMemo(() => [
    { email: 'livreur@prestige.cd', role: 'Livreur', sent: 'Il y a 2 jours' },
    { email: 'agent@prestige.cd', role: 'Agent', sent: 'Il y a 3 heures' },
  ], []);

  if (!partner) return null;

  const getRoleBadge = (role: string) => {
    const r: Record<string, { color: string; bg: string }> = {
      'Proprietaire': { color: 'text-yellow-700', bg: 'bg-yellow-50' },
      'Manager': { color: 'text-[#0077B6]', bg: 'bg-blue-50' },
      'Livreur': { color: 'text-[#22C55E]', bg: 'bg-green-50' },
      'Agent': { color: 'text-purple-600', bg: 'bg-purple-50' },
    };
    return r[role] || { color: 'text-slate-600', bg: 'bg-slate-50' };
  };

  const getStatusBadge = (status: string) => {
    const s: Record<string, { color: string; bg: string }> = {
      'Actif': { color: 'text-[#22C55E]', bg: 'bg-green-50' },
      'En tournee': { color: 'text-[#0077B6]', bg: 'bg-blue-50' },
      'Absent': { color: 'text-red-500', bg: 'bg-red-50' },
      'Conge': { color: 'text-purple-600', bg: 'bg-purple-50' },
    };
    return s[status] || { color: 'text-slate-600', bg: 'bg-slate-50' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Gestion d'equipe</h1>
          <p className="text-sm text-slate-500 mt-1">Gerez vos employs, roles, acces et performances.</p>
        </div>
        <button className="px-4 py-2 bg-[#0077B6] text-white text-xs font-bold rounded-xl hover:bg-[#005f8f] transition flex items-center gap-2"><Icon name="plus" className="w-4 h-4" />Inviter un membre</button>
      </div>

      {/* ─── Section 1: 6 KPI Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total employes', value: String(stats.total), change: '+2 ce mois', icon: 'users', bg: 'bg-blue-50', color: 'text-[#0077B6]' },
          { label: "Presents aujourd'hui", value: String(stats.present), sub: `${Math.round((stats.present / stats.total) * 100)}% de l'equipe`, icon: 'user', bg: 'bg-green-50', color: 'text-[#22C55E]' },
          { label: 'Livreurs actifs', value: String(stats.drivers), sub: 'En tournee', icon: 'truck', bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'Managers', value: String(stats.managers), sub: `${Math.round((stats.managers / stats.total) * 100)}% de l'equipe`, icon: 'shield-check', bg: 'bg-cyan-50', color: 'text-cyan-600' },
          { label: 'Invitations en attente', value: String(stats.pendingInvites), sub: 'A rejoindre', icon: 'envelope', bg: 'bg-orange-50', color: 'text-[#FF7A00]' },
          { label: 'Productivite equipe', value: `${stats.productivity}%`, sub: 'Excellent', icon: 'chartBar', bg: 'bg-emerald-50', color: 'text-emerald-600' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition">
            <div className={`p-2 rounded-xl ${kpi.bg} w-fit mb-2`}><Icon name={kpi.icon as any} className={`w-4 h-4 ${kpi.color}`} /></div>
            <p className="text-[10px] text-slate-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-extrabold text-[#0F172A]">{kpi.value}</p>
            {kpi.change && <p className="text-[10px] font-bold text-[#22C55E]">{kpi.change}</p>}
            {kpi.sub && !kpi.change && <p className="text-[10px] text-slate-400">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* ─── Section 2: Organigramme + Section 3: Membres ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organigramme */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-4">Structure de l'equipe</h2>
          <div className="flex flex-col items-center">
            {/* Proprietaire */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0077B6] to-[#005f8f] flex items-center justify-center text-white text-lg font-bold mb-1">PM</div>
            <p className="text-xs font-bold text-[#0F172A]">Patrice</p>
            <p className="text-[10px] text-slate-400">Proprietaire</p>
            <div className="w-0.5 h-4 bg-slate-200 my-1" />
            {/* Managers */}
            <div className="flex gap-8">
              {['Marie T.', 'Alain B.'].map((name, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] text-xs font-bold">{name.split(' ').map(n => n[0]).join('')}</div>
                  <p className="text-[10px] font-bold text-[#0F172A]">{name}</p>
                  <p className="text-[9px] text-slate-400">{i === 0 ? 'Manager operations' : 'Manager support'}</p>
                </div>
              ))}
            </div>
            <div className="w-0.5 h-4 bg-slate-200 my-1" />
            {/* Agents + Livreurs */}
            <div className="flex gap-4 flex-wrap justify-center">
              {[{ name: 'Jean L.', role: 'Livreur' }, { name: 'David K.', role: 'Livreur' }, { name: 'Sarah M.', role: 'Agent' }, { name: 'Paul N.', role: 'Agent' }].map((m, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">{m.name.split(' ').map(n => n[0]).join('')}</div>
                  <p className="text-[9px] font-bold text-[#0F172A]">{m.name}</p>
                  <p className="text-[8px] text-slate-400">{m.role}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">{stats.total} employs au total</p>
          </div>
        </div>

        {/* Membres equipe */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Membres de l'equipe</h2>
          </div>
          <div className="relative mb-3">
            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Rechercher un membre..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0077B6]" />
          </div>
          <div className="space-y-2">
            {filteredMembers.slice(0, 6).map((m, i) => {
              const role = getRoleBadge(m.role);
              const status = getStatusBadge(m.status);
              return (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-[#0077B6]/10 flex items-center justify-center text-[#0077B6] font-bold text-[10px]">{m.avatar}</div>
                      {m.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{m.name}</p>
                      <p className="text-[9px] text-slate-400">{m.role} • {m.lastActivity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{m.status}</span>
                    <button className="p-1 hover:bg-slate-200 rounded"><Icon name="pencil" className="w-3 h-3 text-slate-400" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline text-center">Voir tous les membres →</button>
        </div>
      </div>

      {/* ─── Section 4: Permissions + Planning + Presence ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permissions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Roles & permissions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                <th className="text-left py-2 text-[9px] text-slate-500">PERMISSION</th>
                <th className="text-center py-2 text-[9px] text-slate-500">PROPRIO.</th>
                <th className="text-center py-2 text-[9px] text-slate-500">MANAGER</th>
                <th className="text-center py-2 text-[9px] text-slate-500">LIVREUR</th>
                <th className="text-center py-2 text-[9px] text-slate-500">AGENT</th>
              </tr></thead>
              <tbody>
                {[
                  { perm: 'Voir commandes', p: true, m: true, l: true, a: false },
                  { perm: 'Modifier commandes', p: true, m: true, l: false, a: false },
                  { perm: 'Livraison', p: true, m: true, l: true, a: false },
                  { perm: 'Finances', p: true, m: true, l: false, a: false },
                  { perm: 'Facturation', p: true, m: true, l: false, a: false },
                  { perm: 'Profil', p: true, m: true, l: false, a: false },
                  { perm: 'Promotions', p: true, m: true, l: false, a: false },
                  { perm: 'Gestion equipe', p: true, m: false, l: false, a: false },
                  { perm: 'Acces aux rapports', p: true, m: true, l: false, a: false },
                  { perm: 'Acces API', p: true, m: false, l: false, a: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 text-[10px] font-medium text-[#0F172A]">{row.perm}</td>
                    {[row.p, row.m, row.l, row.a].map((v, j) => (
                      <td key={j} className="text-center py-1.5"><Icon name={v ? 'check' : 'xmark'} className={`w-3.5 h-3.5 mx-auto ${v ? 'text-[#22C55E]' : 'text-slate-300'}`} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Planning */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Planning hebdomadaire</h2>
            <span className="text-[10px] font-medium text-slate-400">12 – 18 Mai 2026</span>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-1 text-[9px] mb-2">
              <span className="text-slate-400"></span>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <span key={d} className="text-center font-bold text-slate-500">{d}</span>)}
            </div>
            {[
              { name: 'Marie T.', schedule: ['09-18h', '09-18h', '09-18h', '09-18h', '09-18h', '09-13h', 'Repos'] },
              { name: 'Jean L.', schedule: ['08-17h', '08-17h', '08-17h', '08-17h', '08-17h', '08-17h', 'Repos'] },
              { name: 'David K.', schedule: ['Repos', '08-17h', '08-17h', '08-17h', '08-17h', '08-17h', 'Repos'] },
              { name: 'Sarah M.', schedule: ['08-16h', '08-16h', '08-16h', '08-16h', '08-16h', 'Repos', 'Repos'] },
              { name: 'Paul N.', schedule: ['10h-18h', '10h-18h', '10h-18h', '10h-18h', '10h-18h', '10h-18h', 'Repos'] },
            ].map((person, i) => (
              <div key={i} className="grid grid-cols-8 gap-1 items-center mb-1">
                <span className="text-[9px] font-medium text-[#0F172A] truncate">{person.name.split(' ')[0]}</span>
                {person.schedule.map((s, j) => (
                  <div key={j} className={`text-center py-0.5 rounded text-[8px] ${s === 'Repos' ? 'bg-red-50 text-red-400' : 'bg-green-50 text-[#22C55E] font-medium'}`}>{s}</div>
                ))}
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline text-center">Gerer les plannings →</button>
        </div>

        {/* Presence */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Presence aujourd'hui</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="75 25" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-extrabold text-[#0F172A]">{stats.total}</span><span className="text-[9px] text-slate-400">Employes</span></div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /><span className="text-slate-600">{stats.present} Presents</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-slate-600">{stats.total - stats.present - 1} Absents</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /><span className="text-slate-600">1 Conge</span></div>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500">PRESENTS ({stats.present})</p>
            {teamMembers.filter(m => m.status === 'Actif' || m.status === 'En tournee').slice(0, 4).map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1"><div className="w-6 h-6 rounded-full bg-[#22C55E]/10 flex items-center justify-center text-[10px] font-bold text-[#22C55E]">{m.avatar}</div><span className="text-[10px] font-medium text-[#0F172A]">{m.name}</span></div>
            ))}
            <p className="text-[10px] font-bold text-slate-500 mt-2">ABSENTS ({stats.total - stats.present - 1})</p>
            {teamMembers.filter(m => m.status === 'Absent' || m.status === 'Conge').map((m, i) => (
              <div key={i} className="flex items-center gap-2 py-1"><div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-500">{m.avatar}</div><span className="text-[10px] font-medium text-slate-500">{m.name}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 5: Performance + Activite + Invitations ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Performance de l'equipe</h2>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">30 derniers jours</span>
          </div>
          <div className="space-y-2">
            {teamMembers.filter(m => m.commands > 0 || m.deliveries > 0).sort((a, b) => (b.commands + b.deliveries) - (a.commands + a.deliveries)).slice(0, 5).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-[#0077B6]/10 text-[#0077B6]'}`}>{m.avatar}</div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">{m.name}</p>
                    <p className="text-[9px] text-slate-400">{m.role} • {m.commands > 0 ? `${m.commands} commandes` : `${m.deliveries} livraisons`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-0.5"><Icon name="star" className="w-3 h-3 text-yellow-400" /><span className="text-xs font-bold">{m.rating}</span></div>
                  <p className="text-[9px] text-[#22C55E]">{m.productivity}% reussite</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline text-center">Voir le rapport complet →</button>
        </div>

        {/* Activite */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Activite recente</h2>
          <div className="space-y-2.5">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-slate-100 shrink-0"><Icon name={a.icon as any} className={`w-3 h-3 ${a.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#0F172A]"><strong>{a.user}</strong> {a.action} <span className="text-slate-400">{a.detail}</span></p>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline text-center">Voir toute l'activite →</button>
        </div>

        {/* Invitations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#0F172A]">Invitations en attente</h2>
            <button className="text-[10px] font-bold text-[#0077B6] hover:underline">Envoyer une invitation</button>
          </div>
          <div className="space-y-2.5">
            {pendingInvites.map((inv, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-[#0F172A]">{inv.email}</p>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{inv.role}</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Envoyee {inv.sent}</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 text-[10px] font-bold bg-[#0077B6] text-white rounded-lg hover:bg-[#005f8f] transition">Relancer</button>
                  <button className="flex-1 py-1.5 text-[10px] font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">Annuler</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 6: Securite + Utilisation + Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Securite */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Securite de l'equipe</h2>
          <div className="space-y-3">
            {[
              { icon: 'shield-check', label: 'Authentication 2FA', value: '7 / 12 actives', pct: 58 },
              { icon: 'user', label: 'Sessions actives', value: '12 sessions' },
              { icon: 'check', label: 'Derniere connexion suspecte', value: 'Aucune', color: 'text-[#22C55E]' },
              { icon: 'document-text', label: 'Journal des connexions', value: 'Voir l\'historique', link: true },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2"><Icon name={s.icon as any} className="w-4 h-4 text-slate-400" /><span className="text-xs text-slate-600">{s.label}</span></div>
                <span className={`text-xs font-bold ${s.color || 'text-[#0F172A]'}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Utilisation limites */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Utilisation de vos limites</h2>
          <div className="space-y-3">
            {[
              { label: 'Membres de l\'equipe', used: 12, max: 15 },
              { label: 'Automatisations', used: 3, max: 10 },
              { label: 'Stockage documents', used: 1.2, max: 5, unit: ' GB' },
              { label: 'API requests (mois)', used: 2340, max: 10000 },
            ].map((l, i) => {
              const pct = Math.round((l.used / l.max) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600">{l.label}</span>
                    <span className="text-xs font-bold text-[#0F172A]">{l.used.toLocaleString('fr-FR')}{(l as any).unit || ''} / {l.max.toLocaleString('fr-FR')}{(l as any).unit || ''}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-[#FF7A00]' : 'bg-[#0077B6]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-bold text-[#0077B6] hover:underline text-center">Voir toutes les limites</button>
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Actions rapides</h2>
          <div className="space-y-2">
            {[
              { icon: 'plus', label: 'Ajouter un membre', color: 'text-[#0077B6]' },
              { icon: 'shield-check', label: 'Creer un role personnalise', color: 'text-purple-600' },
              { icon: 'pencil', label: 'Gerer les permissions', color: 'text-[#FF7A00]' },
              { icon: 'arrow-down-tray', label: 'Exporter la liste de l\'equipe', color: 'text-[#22C55E]' },
              { icon: 'chartBar', label: 'Voir le rapport d\'activite', color: 'text-cyan-600' },
            ].map((a, i) => (
              <button key={i} className="w-full flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-left">
                <Icon name={a.icon as any} className={`w-4 h-4 ${a.color}`} />
                <span className="text-xs font-medium text-[#0F172A]">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Footer CTA ─── */}
      <div className="bg-gradient-to-r from-[#0077B6] to-[#005f8f] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">👥</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Votre equipe a traite 578 commandes ce mois-ci.</h3>
            <p className="text-xs text-white/80">92% satisfaction clients • 98% livraisons reussies • 5 min temps moyen de reponse</p>
          </div>
        </div>
        {setSection && <button onClick={() => setSection('analytics')} className="px-5 py-2.5 bg-white text-[#0077B6] font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0">Voir le rapport d'equipe</button>}
      </div>
    </div>
  );
};
