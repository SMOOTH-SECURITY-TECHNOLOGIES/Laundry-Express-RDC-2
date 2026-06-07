import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';

type ChatbotMessage = { id: number; author: 'user' | 'bot'; text: string };

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 p-2">
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
  </div>
);

export const SupportCenterPage: React.FC = () => {
  const { user, setCurrentPage, getChatbotResponse } = useAppContext();
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'help' | 'tickets' | 'faq' | 'chat'>('help');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages([{ id: Date.now(), author: 'bot', text: "Bonjour ! Je suis l'assistant Laundry Express. Comment puis-je vous aider ?" }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: Date.now(), author: 'user', text }]);
    setUserInput('');
    setIsBotTyping(true);
    try {
      const botResponse = await getChatbotResponse(text);
      setMessages(prev => [...prev, { id: Date.now() + 1, author: 'bot', text: botResponse }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, author: 'bot', text: "Desole, je rencontre un probleme technique. Reessayez plus tard." }]);
    } finally {
      setIsBotTyping(false);
      inputRef.current?.focus();
    }
  };

  const tickets = useMemo(() => [
    { id: 'TIC-001', subject: 'Commande en retard', status: 'Ouvert', date: '15 Mai 2026', priority: 'Haute' },
    { id: 'TIC-002', subject: 'Question sur le plan', status: 'Resolu', date: '10 Mai 2026', priority: 'Normale' },
    { id: 'TIC-003', subject: 'Bug affichage profil', status: 'Ouvert', date: '12 Mai 2026', priority: 'Basse' },
  ], []);

  const faq = useMemo(() => [
    { q: 'Comment creer une promotion ?', a: 'Allez dans Promotions > Nouvelle promotion. Choisissez le type, le montant et la duree.' },
    { q: 'Comment gerer les commandes en retard ?', a: 'Allez dans Gestion commandes, filtrez par En retard et contactez le client via WhatsApp.' },
    { q: 'Comment modifier mes tarifs ?', a: 'Allez dans Mon profil > Services & tarifs. Cliquez sur le service a modifier.' },
    { q: 'Comment activer le 2FA ?', a: 'Allez dans Securite > Activer 2FA et suivez les instructions.' },
    { q: 'Comment exporter mes donnees ?', a: 'Allez dans Finances > Exporter ou Facturation > Telecharger PDF.' },
  ], []);

  if (!user) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl shadow max-w-lg mx-auto my-12">
        <Icon name="lifebuoy" className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Acces reserve</h2>
        <p className="text-slate-600 mb-6">Connectez-vous pour acceder au centre de support.</p>
        <button onClick={() => setCurrentPage({ name: 'login' })} className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-700 transition">Se connecter</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A]">Centre de support</h1>
        <p className="text-sm text-slate-500 mt-1">Besoin d'aide ? Notre equipe est disponible 24/7 pour vous accompagner.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: 'chatBubble', label: 'Chat en direct', desc: 'Reponse immediate', bg: 'bg-brand-blue/10', color: 'text-brand-blue', tab: 'chat' as const },
          { icon: 'document-text', label: 'Voir la FAQ', desc: '58 articles', bg: 'bg-green-50', color: 'text-[#22C55E]', tab: 'faq' as const },
          { icon: 'envelope', label: 'Creer un ticket', desc: 'Reponse sous 24h', bg: 'bg-purple-50', color: 'text-purple-600', tab: 'tickets' as const },
          { icon: 'pencil', label: 'Guides & tutos', desc: '12 videos', bg: 'bg-orange-50', color: 'text-[#FF7A00]', tab: 'help' as const },
        ].map((a, i) => (
          <button key={i} onClick={() => setActiveTab(a.tab)} className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition text-left">
            <div className={`p-2 rounded-xl ${a.bg} w-fit mb-2`}><Icon name={a.icon as any} className={`w-5 h-5 ${a.color}`} /></div>
            <p className="text-sm font-bold text-[#0F172A]">{a.label}</p>
            <p className="text-[10px] text-slate-400">{a.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'help' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-[#0F172A] mb-3">Guides & Documentation</h2>
              <div className="space-y-2">
                {[
                  { title: 'Demarrer avec Laundry Express', desc: 'Guide complet pour configurer votre pressing', icon: 'home', time: '10 min' },
                  { title: 'Gerer vos commandes', desc: 'Accepter, traiter et livrer vos commandes', icon: 'shoppingBag', time: '8 min' },
                  { title: 'Creer des promotions', desc: 'Attirer plus de clients avec des offres', icon: 'sparkles', time: '5 min' },
                  { title: 'Analyser vos performances', desc: 'Comprendre vos KPIs et croitre', icon: 'chartBar', time: '12 min' },
                  { title: 'Configurer les livraisons', desc: 'Zones, livreurs et tarification', icon: 'truck', time: '7 min' },
                ].map((g, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer">
                    <Icon name={g.icon as any} className="w-5 h-5 text-brand-blue" />
                    <div className="flex-1"><p className="text-xs font-bold text-[#0F172A]">{g.title}</p><p className="text-[10px] text-slate-400">{g.desc}</p></div>
                    <span className="text-[10px] text-slate-400">{g.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-[#0F172A]">Mes tickets ({tickets.length})</h2>
                <button className="px-3 py-1.5 text-[10px] font-bold bg-brand-blue text-white rounded-lg hover:bg-brand-blue-700 transition">Nouveau ticket</button>
              </div>
              <div className="space-y-2">
                {tickets.map((ticket, i) => {
                  const st = ticket.status === 'Ouvert' ? 'bg-orange-50 text-[#FF7A00]' : 'bg-green-50 text-[#22C55E]';
                  const pr = ticket.priority === 'Haute' ? 'bg-red-50 text-red-500' : ticket.priority === 'Normale' ? 'bg-blue-50 text-brand-blue' : 'bg-slate-100 text-slate-500';
                  return (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">{ticket.id}</span>
                        <div className="flex gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${pr}`}>{ticket.priority}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st}`}>{ticket.status}</span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#0F172A]">{ticket.subject}</p>
                      <p className="text-[10px] text-slate-400">{ticket.date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-[#0F172A] mb-4">Questions frequentes</h2>
              <div className="space-y-2">
                {faq.map((item, i) => (
                  <details key={i} className="group border border-slate-100 rounded-xl overflow-hidden">
                    <summary className="p-3 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition">
                      <span className="text-xs font-bold text-[#0F172A]">{item.q}</span>
                      <Icon name="chevron-down" className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-3 pt-0 text-xs text-slate-600 bg-slate-50">{item.a}</div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center"><Icon name="logo" className="w-5 h-5 text-white" /></div>
                <div><p className="text-sm font-bold text-[#0F172A]">Assistant Laundry Express</p><p className="text-[10px] text-[#22C55E]">En ligne</p></div>
              </div>
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.author === 'bot' && <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center shrink-0"><Icon name="logo" className="w-5 h-5 text-white" /></div>}
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.author === 'user' ? 'bg-brand-blue text-white rounded-br-none' : 'bg-white text-[#0F172A] rounded-bl-none border border-slate-200'}`}>{msg.text}</div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center shrink-0"><Icon name="logo" className="w-5 h-5 text-white" /></div>
                    <div className="p-2 rounded-2xl bg-white border border-slate-200"><TypingIndicator /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="flex gap-2">
                  <textarea ref={inputRef} value={userInput} onChange={e => setUserInput(e.target.value)} rows={1} placeholder="Votre message..." className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue" disabled={isBotTyping} />
                  <button type="submit" disabled={isBotTyping || !userInput.trim()} className="px-4 py-2.5 bg-brand-blue text-white rounded-xl hover:bg-brand-blue-700 disabled:bg-slate-300 transition"><Icon name="paper-plane" className="w-4 h-4" /></button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">Besoin d'aide pour analyser ?</h2>
            <p className="text-xs text-slate-400 mb-3">Notre equipe est la pour vous aider a booster vos resultats.</p>
            <button className="w-full py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-700 transition">Contacter le support</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-[#0F172A] mb-3">Statut du systeme</h2>
            <div className="space-y-2.5">
              {[
                { service: 'API', status: 'Operationnel', color: 'text-[#22C55E]' },
                { service: 'Webhooks', status: 'Operationnel', color: 'text-[#22C55E]' },
                { service: 'Paiements', status: 'Operationnel', color: 'text-[#22C55E]' },
                { service: 'Livraisons', status: 'Operationnel', color: 'text-[#22C55E]' },
                { service: 'Notifications', status: 'Operationnel', color: 'text-[#22C55E]' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-600">{s.service}</span>
                  <span className={`text-[10px] font-bold ${s.color}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] rounded-2xl p-5 text-white">
            <h2 className="text-sm font-bold mb-1">Plan Premium</h2>
            <p className="text-[10px] text-white/70 mb-3">Accedez a des analyses avancees et des rapports personnalises.</p>
            <button className="w-full py-2 bg-white text-[#0F172A] text-xs font-bold rounded-xl hover:bg-white/90 transition">Voir mon abonnement</button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-blue to-brand-blue-700 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🎧</span>
          <div>
            <h3 className="text-base font-extrabold text-white">Une question ? Notre equipe vous accompagne.</h3>
            <p className="text-xs text-white/80">Reponse moyenne : 5 min par chat. 24h par ticket.</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-white text-brand-blue font-bold rounded-xl text-sm hover:bg-white/90 transition shrink-0" onClick={() => setActiveTab('chat')}>Demarrer un chat</button>
      </div>
    </div>
  );
};

