import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '../components/Icon';
import { realApi } from '../services/real-api';

interface LandingPageProps {
  setCurrentPage: (page: { name: string; params?: Record<string, any> }) => void;
}

const SectionTag: React.FC<{ label: string; accent?: boolean }> = ({ label, accent }) => (
  <span className={`inline-block px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full ${accent ? 'bg-[#FF7A00]/10 text-[#FF7A00]' : 'bg-[#0B5FFF]/10 text-[#0B5FFF]'}`}>
    {label}
  </span>
);

const SectionHeading: React.FC<{ title: string; subtitle?: string; light?: boolean }> = ({ title, subtitle, light }) => (
  <div className="text-center mb-12">
    <h2 className={`text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-[#0F172A]'}`}>{title}</h2>
    {subtitle && <p className={`mt-4 text-lg max-w-2xl mx-auto ${light ? 'text-white/80' : 'text-slate-500'}`}>{subtitle}</p>}
  </div>
);

const useCarousel = (itemCount: number, autoPlay = true) => {
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAutoPlay = useCallback(() => {
    if (autoPlay && itemCount > 1) intervalRef.current = setInterval(() => setIndex(i => (i + 1) % itemCount), 5000);
  }, [autoPlay, itemCount]);
  const stopAutoPlay = useCallback(() => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { startAutoPlay(); return stopAutoPlay; }, [startAutoPlay, stopAutoPlay]);
  const go = (i: number) => { stopAutoPlay(); setIndex(i); startAutoPlay(); };
  return { index, go, next: () => go((index + 1) % itemCount), prev: () => go((index - 1 + itemCount) % itemCount) };
};

const useCountdown = (targetHours = 4) => {
  const [timeLeft, setTimeLeft] = useState(targetHours * 3600);
  useEffect(() => { const timer = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000); return () => clearInterval(timer); }, []);
  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  return { hrs, mins, secs, formatted: String(hrs).padStart(2,'0') + ':' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0') };
};

const featuredPartners = [
  { name: 'Pressing Royal', rating: 4.9, reviews: 328, location: 'Gombe', time: '2h', image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8c?w=400&h=300&fit=crop', logo: 'PR', sponsored: true, distance: '1.2 km', avgPrice: 3.5, verified: true },
  { name: 'CleanCare Pro', rating: 4.8, reviews: 215, location: 'Ngaliema', time: '3h', image: 'https://images.unsplash.com/photo-1517677208171-0bc06cff92a1?w=400&h=300&fit=crop', logo: 'CC', sponsored: false, distance: '2.4 km', avgPrice: 2.8, verified: true },
  { name: 'Netto Plus', rating: 4.7, reviews: 189, location: 'Kintambo', time: '2.5h', image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop', logo: 'NP', sponsored: true, distance: '0.8 km', avgPrice: 2.5, verified: true },
  { name: 'Luxury Dry Clean', rating: 4.9, reviews: 412, location: 'Gombe', time: '4h', image: 'https://images.unsplash.com/photo-1604335399105-f4c6f5e2c3f7?w=400&h=300&fit=crop', logo: 'LD', sponsored: false, distance: '1.5 km', avgPrice: 5.0, verified: true },
  { name: 'Pressing Centrale', rating: 4.6, reviews: 156, location: 'Limete', time: '3h', image: 'https://images.unsplash.com/photo-1561059488-916d69792237?w=400&h=300&fit=crop', logo: 'PC', sponsored: false, distance: '3.1 km', avgPrice: 2.2, verified: false },
  { name: 'Blanchisserie Elite', rating: 4.8, reviews: 278, location: 'Matete', time: '2h', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', logo: 'BE', sponsored: true, distance: '4.2 km', avgPrice: 3.0, verified: true },
];

const promotions = [
  { title: '-20% costumes', desc: 'Nettoyage a sec professionnel', badge: 'Sponsoris', color: '#0B5FFF', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=400&fit=crop' },
  { title: 'Livraison gratuite ce week-end', desc: 'Aucun frais de livraison samedi et dimanche', badge: 'Temps limite', color: '#FF7A00', image: 'https://images.unsplash.com/photo-1586190848861-99c9574548e3?w=600&h=400&fit=crop' },
  { title: 'Premiere commande -30%', desc: 'Nouveaux clients', badge: 'Nouveaux clients', color: '#22C55E', image: 'https://images.unsplash.com/photo-1604177095492-3d9e9e6f2d8b?w=600&h=400&fit=crop' },
  { title: 'Service Express 2h', desc: 'Nettoyage urgent', badge: 'Express', color: '#002B7F', image: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?w=600&h=400&fit=crop' },
];

const dailyDeals = [
  { title: '-30% costumes complets', partner: 'Pressing Royal', price: '8 $', oldPrice: '12 $', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=250&fit=crop' },
  { title: 'Livraison gratuite', partner: 'CleanCare Pro', price: '0 $', oldPrice: '3 $', image: 'https://images.unsplash.com/photo-1517677208171-0bc06cff92a1?w=400&h=250&fit=crop' },
  { title: 'Chemises a 2 $', partner: 'Netto Plus', price: '2 $', oldPrice: '3.5 $', image: 'https://images.unsplash.com/photo-1604335399105-f4c6f5e2c3f7?w=400&h=250&fit=crop' },
  { title: 'Robe de soiree -25%', partner: 'Luxury Dry Clean', price: '15 $', oldPrice: '20 $', image: 'https://images.unsplash.com/photo-1561059488-916d69792237?w=400&h=250&fit=crop' },
];

const testimonials = [
  { name: 'Marie K.', role: 'Cadre superieure', avatar: 'MK', text: 'Laundry Express a transforme ma routine. Livraison toujours a l heure, qualite impeccable.', rating: 5 },
  { name: 'Jean-Paul M.', role: 'Entrepreneur', avatar: 'JP', text: 'La plateforme m a apporte 40% de clients en plus. Paiements securises et rapides.', rating: 5 },
  { name: 'Sophie L.', role: 'Mere de famille', avatar: 'SL', text: 'Le service de collecte a domicile est une benediction. Je ne peux plus m en passer.', rating: 5 },
  { name: 'Patrick O.', role: 'Consultant', avatar: 'PO', text: 'Toujours repassees a la perfection. Le suivi en temps reel est top.', rating: 5 },
];

const partnerLogos = [
  { name: 'Pressing Royal', abbr: 'PR' }, { name: 'CleanCare Pro', abbr: 'CC' }, { name: 'Netto Plus', abbr: 'NP' },
  { name: 'Luxury Dry Clean', abbr: 'LD' }, { name: 'Pressing Centrale', abbr: 'PC' }, { name: 'Blanchisserie Elite', abbr: 'BE' },
  { name: 'Laundry Premium', abbr: 'LP' }, { name: 'DryClean Express', abbr: 'DC' }, { name: 'SoapClean', abbr: 'SC' },
  { name: 'Nettoyage Pro', abbr: 'NP' }, { name: 'Gombe Pressing', abbr: 'GP' }, { name: 'Kin Pressing', abbr: 'KP' },
  { name: 'Matete Clean', abbr: 'MC' }, { name: 'Royal Clean', abbr: 'RC' }, { name: 'Top Laundry', abbr: 'TL' },
];

const topPartners = [
  { rank: 1, name: 'Pressing Royal', rating: 4.9, orders: 1243, satisfaction: 98, deliveryTime: '24h', badge: 'Gold', trend: '+12%' },
  { rank: 2, name: 'Luxury Dry Clean', rating: 4.9, orders: 980, satisfaction: 97, deliveryTime: '24h', badge: 'Silver', trend: '+8%' },
  { rank: 3, name: 'CleanCare Pro', rating: 4.8, orders: 850, satisfaction: 96, deliveryTime: '30h', badge: 'Verifie', trend: '+15%' },
  { rank: 4, name: 'Blanchisserie Elite', rating: 4.8, orders: 720, satisfaction: 95, deliveryTime: '36h', badge: 'Verifie', trend: '+5%' },
  { rank: 5, name: 'Netto Plus', rating: 4.7, orders: 640, satisfaction: 94, deliveryTime: '28h', badge: 'Verifie', trend: '+10%' },
];

const howItWorks = [
  { step: '01', title: 'Planifiez la collecte', desc: 'Choisissez l heure et l adresse. Moins de 2 minutes.', icon: 'calendar' },
  { step: '02', title: 'Le chauffeur arrive', desc: 'Un agent certifie collecte vos vetements en vehicule identifie.', icon: 'truck' },
  { step: '03', title: 'Nettoyage pro', desc: 'Vos vetements sont traites par des partenaires verifies.', icon: 'sparkles' },
  { step: '04', title: 'Livraison a domicile', desc: 'Recevez vos vetements propres et repasses a votre porte.', icon: 'home' },
];

const whyChoose = [
  { title: 'Gagnez du temps', desc: 'Plus besoin de vous deplacer. Nous gerons tout de A a Z.', icon: 'clock', color: '#0B5FFF' },
  { title: 'Partenaires verifies', desc: 'Tous nos pressing sont inspectes et notes.', icon: 'badge-check', color: '#22C55E' },
  { title: 'Paiements securises', desc: 'Airtel Money, Orange Money, M-Pesa, Visa, Mastercard.', icon: 'wallet', color: '#FF7A00' },
  { title: 'Livraison fiable', desc: '99% de livraisons a l heure avec suivi GPS.', icon: 'shield-check', color: '#002B7F' },
];

const faqs = [
  { q: 'Comment fonctionne la collecte a domicile ?', a: 'Planifiez un creneau via l app. Un chauffeur arrive a l heure convenue et recupere votre linge.' },
  { q: 'Quels modes de paiement acceptez-vous ?', a: 'Airtel Money, Orange Money, M-Pesa, Visa et Mastercard. Tous securises.' },
  { q: 'Quel est le delai de livraison ?', a: 'Standard 24-48h. Express garantit 2h pour les urgents.' },
  { q: 'Comment devenir partenaire pressing ?', a: 'Cliquez sur Devenir Partenaire. Notre equipe inspecte et integre sous 48h.' },
  { q: 'Mes vetements sont endommages ?', a: 'Chaque commande est assuree jusqu a 500$. Remboursement sous 24h.' },
  { q: 'Tarifs entreprises ?', a: 'Oui, forfaits avec facturation mensuelle et service dedie.' },
];

const mapZones = [
  { name: 'Gombe', x: 52, y: 38, partners: 6 }, { name: 'Ngaliema', x: 32, y: 55, partners: 8 },
  { name: 'Limete', x: 68, y: 60, partners: 4 }, { name: 'Kintambo', x: 45, y: 30, partners: 5 },
  { name: 'Matete', x: 75, y: 50, partners: 3 }, { name: 'Masina', x: 82, y: 42, partners: 2 },
];

const fallbackOrders = [
  { id: '#12453', name: 'Patrick O.', commune: 'Gombe', time: '12 min', action: 'vient de recevoir sa livraison' },
  { id: '#12452', name: 'Marie K.', commune: 'Ngaliema', time: '19 min', action: 'a commande un pressing urgent' },
  { id: '#12451', name: 'Jean-Paul M.', commune: 'Limete', time: '24 min', action: 'a recu ses costumes nettoyes' },
  { id: '#12450', name: 'Sophie L.', commune: 'Kintambo', time: '31 min', action: 'a note son pressing 5 etoiles' },
  { id: '#12449', name: 'Antoine D.', commune: 'Gombe', time: '38 min', action: 'a commande pour la premiere fois' },
  { id: '#12448', name: 'Fatima B.', commune: 'Matete', time: '45 min', action: 'vient de recevoir sa livraison' },
];

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'a l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
};

const priceItems = [
  { item: 'Chemise', price: 2 }, { item: 'Pantalon', price: 3 }, { item: 'Costume complet', price: 8 },
  { item: 'Robe', price: 5 }, { item: 'Veste', price: 4 }, { item: 'T-shirt', price: 1.5 },
  { item: 'Jupe', price: 3 }, { item: 'Manteau', price: 6 },
];

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('Toutes les communes');
  const [selectedService, setSelectedService] = useState('Tous les services');
  const [priceQty, setPriceQty] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState(fallbackOrders);
  const dealCountdown = useCountdown(4);
  const promos = useCarousel(promotions.length);
  const tests = useCarousel(testimonials.length);

  // Fetch live order social proof with polling
  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const data = await realApi.getPublicOrderSocialProof(9);
        if (!cancelled) {
          setRecentOrders(data.map(o => ({
            id: o.order_id,
            name: o.customer_first_name,
            commune: o.commune,
            time: timeAgo(o.created_at),
            action: 'a passe une commande',
          })));
        }
      } catch {
        // Keep fallback orders on error
      }
    };
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const totalEstimate = priceItems.reduce((sum, item) => { const qty = priceQty[item.item] || 0; return sum + qty * item.price; }, 0);
  const updateQty = (item: string, delta: number) => { setPriceQty(prev => ({ ...prev, [item]: Math.max(0, (prev[item] || 0) + delta) })); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 rounded-xl bg-[#0B5FFF] flex items-center justify-center shadow-lg shadow-[#0B5FFF]/20">
                <Icon name="shirt" className="w-6 h-6 text-white" />
              </div>
              <div><span className="text-lg font-extrabold tracking-tight text-[#0F172A]">Laundry</span><span className="text-lg font-extrabold tracking-tight text-[#0B5FFF]">Express</span></div>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              {['Services','Comment ca marche','Tarifs','Partenaires','FAQ'].map(item => <button key={item} className="text-sm font-semibold text-slate-600 hover:text-[#0B5FFF] transition-colors">{item}</button>)}
            </nav>
            <div className="hidden lg:flex items-center gap-3">
              <button onClick={() => setCurrentPage({ name: 'login' })} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-[#0B5FFF] transition">Connexion</button>
              <button onClick={() => setCurrentPage({ name: 'order' })} className="px-6 py-2.5 text-sm font-bold text-white bg-[#0B5FFF] rounded-xl hover:bg-[#002B7F] transition shadow-lg shadow-[#0B5FFF]/25">Commander</button>
            </div>
            <button onClick={() => setMobileMenuOpen(o => !o)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100"><Icon name={mobileMenuOpen ? 'xmark' : 'bars3'} className="w-6 h-6" /></button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-6 space-y-4 shadow-xl">
            {['Services','Comment ca marche','Tarifs','Partenaires','FAQ'].map(item => <button key={item} className="block w-full text-left py-2 text-base font-semibold text-slate-700 hover:text-[#0B5FFF]">{item}</button>)}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button onClick={() => setCurrentPage({ name: 'login' })} className="w-full py-3 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl">Connexion</button>
              <button onClick={() => setCurrentPage({ name: 'order' })} className="w-full py-3 text-sm font-bold text-white bg-[#0B5FFF] rounded-xl">Commander maintenant</button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative pt-28 lg:pt-36 pb-8 lg:pb-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0B5FFF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF7A00]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <SectionTag label="#1 a Kinshasa" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-[#0F172A]">Pressing & <span className="text-[#0B5FFF]">Nettoyage a Sec</span> Livres a Votre Porte a Kinshasa</h1>
              <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">Planifiez votre collecte en moins de 2 minutes. Nos partenaires pressing verifies nettoient et livrent vos vetements avec qualite professionnelle.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => setCurrentPage({ name: 'order' })} className="group px-8 py-4 bg-[#0B5FFF] text-white font-bold rounded-2xl hover:bg-[#002B7F] transition shadow-xl shadow-[#0B5FFF]/25 flex items-center justify-center gap-2">Commander une collecte<Icon name="arrowRight" className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
                <button onClick={() => setCurrentPage({ name: 'become-partner' })} className="px-8 py-4 bg-white text-[#0F172A] font-bold rounded-2xl border-2 border-slate-200 hover:border-[#0B5FFF] hover:text-[#0B5FFF] transition flex items-center justify-center gap-2"><Icon name="building" className="w-5 h-5" />Devenir Partenaire</button>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2"><Icon name="star" className="w-5 h-5 text-yellow-400" /><span className="font-bold text-[#0F172A]">4.8/5</span><span className="text-sm text-slate-500">note clients</span></div>
                <div className="flex items-center gap-2"><Icon name="check" className="w-5 h-5 text-[#22C55E]" /><span className="font-bold text-[#0F172A]">2 500+</span><span className="text-sm text-slate-500">clients satisfaits</span></div>
                <div className="flex items-center gap-2"><Icon name="check" className="w-5 h-5 text-[#22C55E]" /><span className="font-bold text-[#0F172A]">15+</span><span className="text-sm text-slate-500">pressing verifies</span></div>
                <div className="flex items-center gap-2"><Icon name="check" className="w-5 h-5 text-[#22C55E]" /><span className="font-bold text-[#0F172A]">99%</span><span className="text-sm text-slate-500">livraisons a l heure</span></div>
              </div>
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Paiements acceptes</p>
                <div className="flex flex-wrap gap-3">{['Airtel Money','Orange Money','M-Pesa','Visa','Mastercard'].map(pm => <span key={pm} className="px-3 py-1.5 bg-white rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">{pm}</span>)}</div>
              </div>
            </div>
            <div className="relative">
              {/* Photo collage */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 row-span-2">
                  <img src="https://images.unsplash.com/photo-1604177095492-3d9e9e6f2d8b?w=600&h=800&fit=crop" alt="Pressing professionnel" className="w-full h-full min-h-[260px] lg:min-h-[340px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002B7F]/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-xl p-3 border border-white/50">
                    <div className="flex items-center gap-2"><Icon name="badge-check" className="w-5 h-5 text-[#22C55E]" /><span className="text-xs font-bold text-[#0F172A]">Partenaires verifies</span></div>
                  </div>
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
                  <img src="https://images.unsplash.com/photo-1517677208171-0bc06cff92a1?w=500&h=400&fit=crop" alt="Livraison a domicile" className="w-full h-full min-h-[140px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/30 to-transparent" />
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
                  <img src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&h=400&fit=crop" alt="Linge propre et repasse" className="w-full h-full min-h-[140px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-white/50">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" /><span className="text-[10px] font-bold text-[#0F172A]">Live</span></div>
                  </div>
                </div>
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-5 -left-5 lg:-left-10 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 max-w-[220px] z-10">
                <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center"><Icon name="truck" className="w-5 h-5 text-[#22C55E]" /></div><div><p className="text-xs font-bold text-[#0F172A]">En cours de livraison</p><p className="text-xs text-slate-500">Arrivee 14:30</p></div></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-[#22C55E] rounded-full" /></div>
              </div>
              {/* Rating bubble */}
              <div className="absolute top-4 -right-4 lg:-right-8 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 z-10">
                <div className="flex items-center gap-2"><Icon name="star" className="w-5 h-5 text-yellow-400" /><span className="font-bold text-lg">4.9</span></div>
                <p className="text-xs text-slate-500 mt-1">Note moyenne</p>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="mt-10 lg:mt-14">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-4 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="search" className="w-5 h-5 text-slate-400" /></div>
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un pressing, un service..." className="w-full pl-10 pr-4 py-3.5 bg-[#F8FAFC] rounded-xl text-sm font-medium text-[#0F172A] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 border border-slate-100 focus:border-[#0B5FFF]/30" />
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="mapPin" className="w-5 h-5 text-slate-400" /></div>
                  <select value={selectedCommune} onChange={e => setSelectedCommune(e.target.value)} className="w-full pl-10 pr-8 py-3.5 bg-[#F8FAFC] rounded-xl text-sm font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 border border-slate-100 focus:border-[#0B5FFF]/30 appearance-none">
                    <option>Toutes les communes</option><option>Gombe</option><option>Ngaliema</option><option>Limete</option><option>Kintambo</option><option>Matete</option><option>Masina</option>
                  </select>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="sparkles" className="w-5 h-5 text-slate-400" /></div>
                  <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full pl-10 pr-8 py-3.5 bg-[#F8FAFC] rounded-xl text-sm font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#0B5FFF]/20 border border-slate-100 focus:border-[#0B5FFF]/30 appearance-none">
                    <option>Tous les services</option><option>Pressing</option><option>Nettoyage a sec</option><option>Blanchisserie</option><option>Repassage</option>
                  </select>
                </div>
                <button onClick={() => setCurrentPage({ name: 'order' })} className="w-full py-3.5 bg-[#0B5FFF] text-white font-bold rounded-xl hover:bg-[#002B7F] transition flex items-center justify-center gap-2"><Icon name="search" className="w-5 h-5" />Rechercher</button>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase">Filtres rapides :</span>
                {['Livraison express','Note 4.5+','Ouvert maintenant','Premiere commande -30%'].map(filter => <button key={filter} className="px-3 py-1.5 bg-[#F8FAFC] rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#0B5FFF]/10 hover:text-[#0B5FFF] transition border border-slate-100">{filter}</button>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY */}
      <section className="py-6 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#22C55E]/10 rounded-full">
              <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              <span className="text-xs font-bold text-[#22C55E]">Activite en direct</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#0B5FFF]/10 flex items-center justify-center shrink-0"><Icon name="shoppingBag" className="w-5 h-5 text-[#0B5FFF]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate"><span className="text-[#0B5FFF]">{order.name}</span> {order.action}</p>
                  <p className="text-xs text-slate-500">{order.commune} . {order.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DAILY DEALS */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div><SectionTag label="Offres du jour" accent /><h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mt-3">Promotions a ne pas manquer</h2></div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#FF7A00]/10 rounded-xl"><Icon name="fire" className="w-5 h-5 text-[#FF7A00]" /><span className="text-sm font-bold text-[#FF7A00]">Expire dans {dealCountdown.formatted}</span></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dailyDeals.map(deal => (
              <div key={deal.title} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative h-40 overflow-hidden">
                  <img src={deal.image} alt={deal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FF7A00] text-white text-xs font-bold rounded-lg">-{Math.round((1 - parseFloat(deal.price) / parseFloat(deal.oldPrice)) * 100)}%</div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#0F172A] mb-1">{deal.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{deal.partner}</p>
                  <div className="flex items-center gap-2 mb-4"><span className="text-xl font-extrabold text-[#0B5FFF]">{deal.price}</span><span className="text-sm text-slate-400 line-through">{deal.oldPrice}</span></div>
                  <button onClick={() => setCurrentPage({ name: 'order' })} className="w-full py-2.5 bg-[#0B5FFF] text-white text-sm font-bold rounded-xl hover:bg-[#002B7F] transition">En profiter</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PARTNERS */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div><SectionTag label="Partenaires premium" /><h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mt-3">Pressing en vedette</h2></div>
            <button onClick={() => setCurrentPage({ name: 'home' })} className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#0B5FFF] hover:text-[#002B7F] transition">Voir tous<Icon name="arrowRight" className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPartners.map(p => (
              <div key={p.name} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.sponsored && <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#FF7A00] text-white text-xs font-bold rounded-lg">Sponsoris</span>}
                  {p.verified && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold text-[#22C55E]">
                      <Icon name="badge-check" className="w-3 h-3" />Verifie
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-xs font-bold"><Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />{p.rating}</div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-[#0F172A]">{p.name}</h3></div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Icon name="mapPin" className="w-3 h-3" />{p.location}</span>
                    <span className="flex items-center gap-1"><Icon name="truck" className="w-3 h-3" />{p.time}</span>
                    <span className="flex items-center gap-1"><Icon name="currencyDollar" className="w-3 h-3" />A partir de {p.avgPrice} $</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{p.reviews} avis</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-500">{p.distance}</span>
                    </div>
                    <button onClick={() => setCurrentPage({ name: 'order' })} className="px-4 py-2 bg-[#0B5FFF] text-white text-sm font-bold rounded-xl hover:bg-[#002B7F] transition">Commander</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMOTIONS SPONSORISEES */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div><SectionTag label="Offres exclusives" /><h2 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mt-3">Promotions sponsorisees</h2></div>
            <div className="flex gap-2">
              <button onClick={promos.prev} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0B5FFF] hover:text-[#0B5FFF] transition"><Icon name="arrowLeft" className="w-5 h-5" /></button>
              <button onClick={promos.next} className="p-2.5 rounded-xl border border-slate-200 hover:border-[#0B5FFF] hover:text-[#0B5FFF] transition"><Icon name="arrowRight" className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: 'translateX(-' + promos.index * 100 + '%)' }}>
              {promotions.map(promo => (
                <div key={promo.title} className="w-full flex-shrink-0">
                  <div className="relative h-[320px] md:h-[400px] rounded-3xl overflow-hidden">
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/80 via-[#0F172A]/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center p-8 md:p-14">
                      <div className="max-w-lg">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur text-white text-xs font-bold rounded-lg mb-4">{promo.badge}</span>
                        <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{promo.title}</h3>
                        <p className="text-lg text-white/90 mb-6">{promo.desc}</p>
                        <button onClick={() => setCurrentPage({ name: 'order' })} className="px-8 py-3.5 bg-white text-[#0F172A] font-bold rounded-xl hover:bg-slate-100 transition flex items-center gap-2">En profiter<Icon name="arrowRight" className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">{promotions.map((_,i) => <button key={i} onClick={() => promos.go(i)} className={'w-2.5 h-2.5 rounded-full transition ' + (i===promos.index?'bg-white':'bg-white/40')} />)}</div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Comment ca marche" subtitle="Quatre etapes simples pour des vetements impeccablement propres" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-slate-200" />
            {howItWorks.map(step => (
              <div key={step.step} className="relative text-center">
                <div className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center"><Icon name={step.icon as any} className="w-10 h-10 text-[#0B5FFF]" /></div>
                <span className="inline-block px-3 py-1 bg-[#0B5FFF]/10 text-[#0B5FFF] text-xs font-bold rounded-full mb-3">Etape {step.step}</span>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI CHOISIR */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Pourquoi choisir Laundry Express" subtitle="La plateforme de pressing la plus avancee de Kinshasa" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChoose.map(item => (
              <div key={item.title} className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-[#0B5FFF]/20 hover:shadow-xl hover:shadow-[#0B5FFF]/5 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors" style={{ backgroundColor: item.color + '15' }}>
                  <Icon name={item.icon as any} className="w-7 h-7" style={{ color: item.color }} />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTIMATEUR DE PRIX */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Estimez le prix de votre lessive" subtitle="Tarifs transparents, sans surprise" />
          <div className="bg-[#F8FAFC] rounded-3xl border border-slate-100 p-6 md:p-10">
            <div className="space-y-3">
              {priceItems.map(item => (
                <div key={item.item} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4"><span className="text-sm font-semibold text-[#0F172A] w-28">{item.item}</span><span className="text-sm font-bold text-[#0B5FFF]">{item.price} $</span></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(item.item, -1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600 font-bold">-</button>
                    <span className="w-6 text-center font-bold text-[#0F172A]">{priceQty[item.item] || 0}</span>
                    <button onClick={() => updateQty(item.item, 1)} className="w-8 h-8 rounded-lg bg-[#0B5FFF] flex items-center justify-center hover:bg-[#002B7F] transition text-white font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
              <div><p className="text-sm text-slate-500">Total estime</p><p className="text-3xl font-extrabold text-[#0F172A]">{totalEstimate.toFixed(2)} $</p></div>
              <button onClick={() => setCurrentPage({ name: 'order' })} className="px-8 py-4 bg-[#0B5FFF] text-white font-bold rounded-xl hover:bg-[#002B7F] transition shadow-lg shadow-[#0B5FFF]/25">Commander maintenant</button>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIQUES */}
      <section className="py-16 lg:py-20 bg-[#002B7F] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0B5FFF] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#FF7A00] rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <SectionHeading light title="La confiance de milliers a Kinshasa" subtitle="Des chiffres qui parlent de notre engagement qualite" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mt-12">
            {[{value:'2 500+',label:'Clients'},{value:'15 000+',label:'Articles nettoyes'},{value:'15+',label:'Partenaires'},{value:'99%',label:'Livraisons a l heure'},{value:'4.8/5',label:'Note moyenne'}].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-white/70 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASSEMENT */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Classement des meilleurs pressing" subtitle="Les partenaires les mieux notes ce mois-ci" />
          <div className="space-y-4">
            {topPartners.map((p,i) => (
              <div key={p.rank} className={'flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border transition hover:shadow-md ' + (i===0?'bg-yellow-50 border-yellow-200':i===1?'bg-slate-50 border-slate-200':'bg-white border-slate-100')}>
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ' + (i===0?'bg-yellow-400 text-white':i===1?'bg-slate-400 text-white':'bg-slate-100 text-slate-600')}>{p.rank}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#0F172A]">{p.name}</h4>
                    <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (p.badge==='Gold'?'bg-yellow-100 text-yellow-700':p.badge==='Silver'?'bg-slate-200 text-slate-700':'bg-[#0B5FFF]/10 text-[#0B5FFF]')}>{p.badge}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />{p.rating}</span>
                    <span>{p.orders} commandes</span>
                    <span className="flex items-center gap-1"><Icon name="shield-check" className="w-3.5 h-3.5 text-[#22C55E]" />{p.satisfaction}% satisfaction</span>
                    <span className="flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5 text-slate-400" />Livraison {p.deliveryTime}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right"><span className="text-sm font-bold text-[#22C55E]">{p.trend}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTENAIRES PAR COMMUNE */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Nos partenaires par commune" subtitle="Trouvez un pressing partenaire pres de chez vous" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mapZones.map(zone => (
              <div key={zone.name} className="group p-6 bg-[#F8FAFC] rounded-2xl border border-slate-100 hover:border-[#0B5FFF]/20 hover:shadow-lg transition text-center cursor-pointer">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#0B5FFF]/10 flex items-center justify-center group-hover:bg-[#0B5FFF] transition">
                  <Icon name="mapPin" className="w-6 h-6 text-[#0B5FFF] group-hover:text-white transition" />
                </div>
                <h3 className="font-bold text-[#0F172A]">{zone.name}</h3>
                <p className="text-sm text-[#0B5FFF] font-bold mt-1">{zone.partners} partenaires</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CARTE KINSHASA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Nous couvrons tout Kinshasa" subtitle="Trouvez un pressing partenaire pres de chez vous" />
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="relative h-[400px] md:h-[500px] bg-[#E8F4FD]">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(11,95,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,122,0,0.06) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0,43,127,0.04) 0%, transparent 60%)' }} />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #0B5FFF 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #0B5FFF 40px)', backgroundSize: '40px 40px' }} />
              {mapZones.map(zone => {
                const density = zone.partners >= 6 ? 'high' : zone.partners >= 4 ? 'medium' : 'low';
                const dotSize = density === 'high' ? 'w-6 h-6' : density === 'medium' ? 'w-5 h-5' : 'w-4 h-4';
                const dotColor = density === 'high' ? 'bg-[#FF7A00]' : density === 'medium' ? 'bg-[#0B5FFF]' : 'bg-[#22C55E]';
                const pulseColor = density === 'high' ? 'shadow-[#FF7A00]/30' : density === 'medium' ? 'shadow-[#0B5FFF]/30' : 'shadow-[#22C55E]/30';
                return (
                  <div key={zone.name} className="absolute group cursor-pointer" style={{ left: zone.x + '%', top: zone.y + '%' }}>
                    <div className="relative flex items-center justify-center">
                      <div className={`${dotSize} ${dotColor} rounded-full shadow-lg ${pulseColor} animate-pulse flex items-center justify-center`}>
                        {density === 'high' && <span className="text-[9px] font-bold text-white">{zone.partners}</span>}
                      </div>
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-1"><Icon name="mapPin" className="w-3 h-3" />{zone.name}</div>
                        <div className="text-[10px] text-white/70 mt-0.5">{zone.partners} partenaires</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="absolute bottom-6 left-6 right-6 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px]">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-white/50 flex items-center gap-2">
                  <div className="p-3 rounded-xl bg-[#F8FAFC]"><Icon name="search" className="w-5 h-5 text-[#0B5FFF]" /></div>
                  <input type="text" placeholder="Trouvez un pressing pres de chez vous..." className="flex-1 bg-transparent text-sm font-medium text-[#0F172A] placeholder:text-slate-400 outline-none" />
                  <button onClick={() => setCurrentPage({ name: 'order' })} className="px-5 py-3 bg-[#0B5FFF] text-white text-sm font-bold rounded-xl hover:bg-[#002B7F] transition">Rechercher</button>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-wrap gap-3">
              {mapZones.map(z => <span key={z.name} className="px-4 py-2 bg-[#F8FAFC] rounded-xl text-sm font-semibold text-slate-700 border border-slate-100">{z.name}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* TRACKING */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <SectionTag label="Suivi en temps reel" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] mt-3 mb-4">Suivez chaque etape de votre commande</h2>
              <p className="text-lg text-slate-500 mb-8">De la collecte a la livraison, vous savez exactement ou en est votre linge. Notifications push a chaque etape.</p>
              <div className="space-y-4">
                {[{label:'Collecte planifiee',time:'08:30',done:true},{label:'Vetements collectes',time:'09:15',done:true},{label:'Nettoyage en cours',time:'10:00',done:true},{label:'En cours de livraison',time:'13:45',done:false},{label:'Livre',time:'14:30',done:false}].map((step,i,arr) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className={'w-10 h-10 rounded-full flex items-center justify-center ' + (step.done?'bg-[#22C55E]':'bg-slate-200')}>{step.done?<Icon name="check" className="w-5 h-5 text-white" />:<div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />}</div>
                      {i<arr.length-1 && <div className={'w-0.5 h-8 ' + (step.done?'bg-[#22C55E]':'bg-slate-200')} />}
                    </div>
                    <div className="flex-1"><p className={'font-semibold ' + (step.done?'text-[#0F172A]':'text-slate-400')}>{step.label}</p><p className="text-xs text-slate-400">{step.time}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-[#0F172A] rounded-[2.5rem] p-4 shadow-2xl shadow-slate-900/20 max-w-[360px] mx-auto">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div><p className="text-xs font-bold text-slate-400 uppercase">Commande #LE-4821</p><p className="text-lg font-bold text-[#0F172A]">En cours de livraison</p></div>
                      <div className="w-12 h-12 rounded-full bg-[#0B5FFF]/10 flex items-center justify-center"><Icon name="truck" className="w-6 h-6 text-[#0B5FFF]" /></div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl"><div className="w-10 h-10 rounded-lg bg-[#0B5FFF]/10 flex items-center justify-center shrink-0"><Icon name="mapPin" className="w-5 h-5 text-[#0B5FFF]" /></div><div><p className="text-xs text-slate-400">Adresse de livraison</p><p className="text-sm font-semibold text-[#0F172A]">12 Av. de la Paix, Gombe</p></div></div>
                      <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl"><div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center shrink-0"><Icon name="clock" className="w-5 h-5 text-[#22C55E]" /></div><div><p className="text-xs text-slate-400">Livraison estimee</p><p className="text-sm font-semibold text-[#0F172A]">14:30 - 14:45</p></div></div>
                    </div>
                    <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-3/4 bg-[#0B5FFF] rounded-full" /></div>
                    <p className="text-center text-xs text-slate-400 mt-2">Arrivee dans 12 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVIS CLIENTS */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Ils nous font confiance" subtitle="Des milliers de clients satisfaits a Kinshasa" />
          <div className="relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: 'translateX(-' + tests.index * 100 + '%)' }}>
              {testimonials.map(t => (
                <div key={t.name} className="w-full flex-shrink-0 px-4">
                  <div className="max-w-3xl mx-auto bg-[#F8FAFC] rounded-3xl p-8 md:p-12 text-center">
                    <div className="flex items-center justify-center gap-1 mb-6">{[...Array(5)].map((_,i) => <Icon key={i} name="star" className={'w-6 h-6 ' + (i<t.rating?'text-yellow-400':'text-slate-300')} />)}</div>
                    <p className="text-xl md:text-2xl text-[#0F172A] leading-relaxed mb-8 font-medium italic">&quot;{t.text}&quot;</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0B5FFF] flex items-center justify-center text-white font-bold text-lg">{t.avatar}</div>
                      <div className="text-left"><p className="font-bold text-[#0F172A]">{t.name}</p><p className="text-sm text-slate-500">{t.role}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-8">
              <button onClick={tests.prev} className="p-3 rounded-full border border-slate-200 hover:border-[#0B5FFF] hover:text-[#0B5FFF] transition"><Icon name="arrowLeft" className="w-5 h-5" /></button>
              <div className="flex gap-2">{testimonials.map((_,i) => <button key={i} onClick={() => tests.go(i)} className={'w-2.5 h-2.5 rounded-full transition ' + (i===tests.index?'bg-[#0B5FFF]':'bg-slate-300')} />)}</div>
              <button onClick={tests.next} className="p-3 rounded-full border border-slate-200 hover:border-[#0B5FFF] hover:text-[#0B5FFF] transition"><Icon name="arrowRight" className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI LES CLIENTS REVIENNENT */}
      <section className="py-16 lg:py-24 bg-[#0B5FFF] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <SectionHeading light title="Pourquoi nos clients reviennent" subtitle="Des resultats qui parlent d eux-memes" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">97%</div>
              <p className="text-white/80 font-medium">recommanderaient Laundry Express</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">95%</div>
              <p className="text-white/80 font-medium">reutilisent le service chaque mois</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
              <div className="text-4xl md:text-5xl font-extrabold text-white mb-2">4.8/5</div>
              <p className="text-white/80 font-medium">satisfaction moyenne des clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS PARTENAIRES */}
      <section className="py-16 lg:py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Nos partenaires verifies" subtitle="Des pressing de confiance dans toute la ville" />
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {partnerLogos.map((logo, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-[#0B5FFF]/20 transition">
                <div className="w-9 h-9 rounded-lg bg-[#0B5FFF]/10 flex items-center justify-center text-[#0B5FFF] font-extrabold text-xs">
                  {logo.abbr}
                </div>
                <span className="text-sm font-bold text-[#0F172A]">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVENIR PARTENAIRE */}
      <section className="py-16 lg:py-24 bg-[#002B7F] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0B5FFF] rounded-full blur-3xl" /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionTag label="Pour les professionnels" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">Vous possedez un pressing ?</h2>
              <p className="text-lg text-white/80 mb-8">Augmentez votre clientele et developpez votre chiffre d affaires avec Laundry Express.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {[{icon:'users',text:'Plus de visibilite'},{icon:'shoppingBag',text:'Plus de commandes'},{icon:'wallet',text:'Paiements securises'},{icon:'chartBar',text:'Croissance business'}].map(b => (
                  <div key={b.text} className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10"><Icon name={b.icon as any} className="w-6 h-6 text-[#FF7A00]" /><span className="font-semibold text-white">{b.text}</span></div>
                ))}
              </div>
              <button onClick={() => setCurrentPage({ name: 'become-partner' })} className="px-10 py-4 bg-[#FF7A00] text-white font-bold rounded-2xl hover:bg-[#e66d00] transition shadow-xl shadow-[#FF7A00]/25 flex items-center gap-2">Devenir Partenaire<Icon name="arrowRight" className="w-5 h-5" /></button>
            </div>
            <div className="hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/30">
                <img src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=700&h=500&fit=crop" alt="Laundry Partner" className="w-full h-[400px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002B7F]/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Questions frequentes" subtitle="Tout ce que vous devez savoir avant de commander" />
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className={'rounded-2xl border transition ' + (openFaq===i?'bg-white border-[#0B5FFF]/20 shadow-lg shadow-[#0B5FFF]/5':'bg-[#F8FAFC] border-slate-100')}>
                <button onClick={() => setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-bold text-[#0F172A] pr-4">{faq.q}</span>
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ' + (openFaq===i?'bg-[#0B5FFF] text-white':'bg-slate-100 text-slate-500')}><Icon name={openFaq===i?'minus':'plus'} className="w-4 h-4" /></div>
                </button>
                {openFaq===i && <div className="px-6 pb-6"><p className="text-slate-600 leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0F172A] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
            <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B5FFF] flex items-center justify-center"><Icon name="shirt" className="w-6 h-6 text-white" /></div>
                <div><span className="text-lg font-extrabold">Laundry</span><span className="text-lg font-extrabold text-[#0B5FFF]">Express</span></div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">La marketplace de pressing et nettoyage a sec #1 a Kinshasa. Qualite, confiance, livraison.</p>
              <div className="flex gap-3">
                {['facebook','twitter','instagram','linkedin'].map(social => <a key={social} href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#0B5FFF] transition"><span className="text-xs font-bold capitalize">{social[0]}</span></a>)}
              </div>
            </div>
            {[{title:'Entreprise',links:['A propos','Carrieres','Presse','Contact']},{title:'Services',links:['Pressing','Nettoyage a sec','Blanchisserie','Entreprises']},{title:'Partenaires',links:['Devenir partenaire','Portail partenaire','Tarifs','Ressources']},{title:'Legal',links:['CGU','Confidentialite','Cookies','Mentions legales']}].map(col => (
              <div key={col.title}>
                <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{col.title}</h4>
                <ul className="space-y-3">{col.links.map(link => <li key={link}><a href="#" className="text-sm text-slate-400 hover:text-white transition">{link}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-2"><Icon name="mapPin" className="w-4 h-4" /> Kinshasa, RDC</span>
                <span className="flex items-center gap-2"><Icon name="phone" className="w-4 h-4" /> +243 81 234 5678</span>
                <span className="flex items-center gap-2"><Icon name="envelope" className="w-4 h-4" /> support@laundryexpress.cd</span>
              </div>
              <div className="flex gap-3">{['Airtel Money','Orange Money','M-Pesa','Visa','Mastercard'].map(pm => <span key={pm} className="px-2.5 py-1 bg-white/5 rounded text-xs font-medium text-slate-400">{pm}</span>)}</div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Laundry Express RDC. Tous droits reserves.</p>
            <p>Propulse par la technologie. Concu pour Kinshasa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
