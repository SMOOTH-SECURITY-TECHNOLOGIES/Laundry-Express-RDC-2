
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { apiSubmitPartnerApplication } from '../constants';
import { PartnerType } from '../types';

const stats = [
  { value: '500+', label: 'livraisons mensuelles', icon: 'truck' as const },
  { value: '4', label: 'communes couvertes', icon: 'mapPin' as const },
  { value: '24h/24', label: 'missions disponibles', icon: 'clock' as const },
  { value: '98%', label: 'paiements à temps', icon: 'shield-check' as const },
];

const steps = [
  { num: 1, title: 'Candidature', desc: 'Votre compagnie soumet sa flotte, ses zones et son responsable.', icon: 'user' as const },
  { num: 2, title: 'Validation admin', desc: 'Laundry Express vérifie les coordonnées, documents et capacités.', icon: 'document-text' as const },
  { num: 3, title: 'Cockpit logistique', desc: 'Le manager reçoit un accès au dashboard logistique.', icon: 'computer' as const },
  { num: 4, title: 'Chauffeurs', desc: 'Les chauffeurs sont ajoutés puis reliés à la compagnie.', icon: 'truck' as const },
  { num: 5, title: 'Missions', desc: 'Les missions sont dispatchées, suivies et payées dans la plateforme.', icon: 'wallet' as const },
];

const operatingFlow = [
  { title: 'Compte manager', desc: 'Accès au cockpit, fleet, dispatch, tracking et rapports.', icon: 'shield-check' as const },
  { title: 'Comptes chauffeurs', desc: 'Accès séparé au driver dashboard pour missions, disponibilité et revenus.', icon: 'user' as const },
  { title: 'Contrôle Laundry', desc: 'Les rôles logistiques sont activés après approbation, jamais par auto-inscription.', icon: 'badge-check' as const },
];

const zones = [
  { name: 'Zone 1', communes: 'Gombe, Kintambo', price: '3 USD' },
  { name: 'Zone 2', communes: 'Ngaliema, Bandalungwa', price: '4 USD' },
  { name: 'Zone 3', communes: 'Lingwala, Kalamu', price: '5 USD' },
  { name: 'Zone 4', communes: 'Masina, Limete', price: '6 – 7 USD' },
  { name: 'Hors zone', communes: 'Autres communes', price: '0,80 USD / km' },
];

const bonuses = [
  { label: 'Livraison express (< 2h)', percent: '+30%', icon: 'sparkles' as const },
  { label: 'Livraison de nuit (après 20h)', percent: '+20%', icon: 'moon' as const },
  { label: 'Articles lourds / encombrants (>15Kg)', percent: '+15%', icon: 'fire' as const },
  { label: 'Week-end et jours fériés', percent: '+10%', icon: 'calendar' as const },
];

const requirements = [
  "Pièce d'identité valide",
  'Numéro de téléphone actif',
  'Moto ou véhicule en bon état',
  'Permis de conduire valide',
  'Casier judiciaire acceptable',
  'Disponibilité régulière',
];

const advantages = [
  { title: 'Missions régulières', icon: 'calendar' as const },
  { title: 'Paiements sécurisés', icon: 'shield-check' as const },
  { title: 'Gestion numérique', icon: 'computer' as const },
  { title: 'Historique complet', icon: 'document-text' as const },
  { title: 'Support dédié', icon: 'lifebuoy' as const },
  { title: 'Croissance du chiffre d\'affaires', icon: 'chartBar' as const },
];

const testimonials = [
  { name: 'Jean Mukendi', role: 'Partenaire logistique', quote: 'Je reçois désormais des missions chaque semaine et les paiements sont rapides.', rating: 5 },
  { name: 'Patrick Ilunga', role: 'Chauffeur indépendant', quote: 'Grâce à Laundry Express, j\'ai augmenté mes revenus de 40% en 3 mois.', rating: 5 },
  { name: 'Sandra Mutombo', role: 'Responsable flotte', quote: 'La plateforme est simple et nos chauffeurs l\'adoptent facilement.', rating: 5 },
];

const faqItems = [
  { q: 'Comment suis-je payé ?', a: 'Les paiements sont effectués chaque semaine par Mobile Money ou virement bancaire. Le montant inclut le tarif de base de la zone plus les bonus éventuels.' },
  { q: 'À quelle fréquence ?', a: 'Les paiements sont hebdomadaires. Vous recevez un récapitulatif de toutes les livraisons effectuées et le montant total est transféré.' },
  { q: 'Qui fournit les clients ?', a: 'Laundry Express gère toute la relation client. Vous recevez simplement les missions de collecte et de livraison via l\'application.' },
  { q: 'Puis-je refuser une mission ?', a: 'Oui, vous pouvez refuser ou ignorer une mission. Cependant, un taux d\'acceptation élevé vous donne accès à plus de missions et aux bonus.' },
  { q: 'Comment sont calculés les bonus ?', a: 'Les bonus sont calculés automatiquement selon la nature de la livraison : express (+30%), nuit (+20%), lourds (+15%), week-end (+10%).' },
];

const zoneRatePerDay = [18, 24, 30, 36, 15];

export const LogisticsPartnershipPage: React.FC = () => {
  const { setCurrentPage, addNotification } = useAppContext();

  const [deliveriesPerDay, setDeliveriesPerDay] = useState(10);
  const [daysPerWeek, setDaysPerWeek] = useState(6);
  const [selectedZone, setSelectedZone] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [form, setForm] = useState({ company: '', owner: '', phone: '', email: '', fleetType: '', vehicleCount: '', zones: '', message: '', capacity: '' });

  const revenue = useMemo(() => {
    const daily = deliveriesPerDay * zoneRatePerDay[selectedZone];
    const weekly = daily * daysPerWeek;
    const monthly = Math.round(weekly * 4.33);
    return { daily, weekly, monthly };
  }, [deliveriesPerDay, daysPerWeek, selectedZone]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const application = {
        companyName: form.company,
        partnerType: PartnerType.LOGISTICS,
        contactName: form.owner,
        phone: form.phone,
        email: form.email,
        address: form.zones || '',
        message: `Type flotte: ${form.fleetType}\nVéhicules: ${form.vehicleCount}\nZones: ${form.zones}\n${form.message}`,
        capacity: form.vehicleCount || form.capacity,
      };
      await apiSubmitPartnerApplication(application);
      addNotification('Candidature envoyée avec succès !', 'success');
      setFormSubmitted(true);
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "Une erreur s'est produite. Veuillez réessayer.", 'error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-br from-brand-blue to-brand-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
                <Icon name="truck" className="w-4 h-4" />
                Partenariat Logistique
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                Développez votre activité de livraison avec <span className="text-brand-orange">Laundry Express</span>
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8">
                Recevez des missions de collecte et de livraison chaque jour à Kinshasa grâce à notre plateforme.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })} className="px-6 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                  Devenir partenaire
                  <Icon name="arrowRight" className="w-4 h-4" />
                </button>
                <a href="tel:+243812345678" className="px-6 py-3 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/25 transition-colors border border-white/30 flex items-center justify-center gap-2">
                  <Icon name="phone" className="w-4 h-4" />
                  Parler à un conseiller
                </a>
              </div>
              <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                {['Missions garanties', 'Paiements rapides', 'Support dédié 24/7', 'Gestion simplifiée'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-xs text-blue-100">
                    <Icon name="check" className="w-3.5 h-3.5 text-green-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 hidden lg:flex justify-center">
              <div className="relative w-[420px] h-[340px]">
                {/* Background cityscape silhouette */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/10 to-transparent rounded-3xl" />
                {/* Phone mockup */}
                <div className="absolute top-4 right-8 w-48 bg-white rounded-3xl shadow-2xl overflow-hidden z-10">
                  <div className="bg-brand-blue px-4 py-3">
                    <p className="text-[10px] text-white/70">Nouvelle mission</p>
                    <p className="text-xs font-bold text-white">Collecte Gombe</p>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[10px]">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><Icon name="mapPin" className="w-3 h-3 text-green-600" /></div>
                      <span className="text-gray-700">Collecte — Gombe</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><Icon name="mapPin" className="w-3 h-3 text-blue-600" /></div>
                      <span className="text-gray-700">Livraison — Limete</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <span className="text-[10px] text-gray-500">3.2 km</span>
                      <span className="text-sm font-bold text-brand-blue">7.5 USD</span>
                    </div>
                    <button className="w-full py-1.5 bg-brand-blue text-white text-[10px] font-bold rounded-lg">Accepter la mission</button>
                  </div>
                </div>
                {/* Driver silhouette */}
                <div className="absolute bottom-8 left-8 w-44 h-44 bg-gradient-to-br from-brand-blue/20 to-brand-blue/5 rounded-2xl flex items-center justify-center">
                  <Icon name="truck" className="w-16 h-16 text-brand-blue/40" />
                </div>
                {/* Decorative dots */}
                <div className="absolute top-12 left-12 w-3 h-3 bg-brand-orange rounded-full" />
                <div className="absolute top-24 right-4 w-2 h-2 bg-green-400 rounded-full" />
                <div className="absolute bottom-20 right-20 w-2 h-2 bg-brand-blue rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-2">
                <Icon name={s.icon} className="w-6 h-6 text-brand-blue" />
              </div>
              <p className="text-2xl font-extrabold text-brand-dark">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-dark mb-12">Comment ça marche ?</h2>
        <div className="relative">
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-gray-200" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center relative">
                <div className="w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center mx-auto mb-3 relative z-10 shadow-lg shadow-brand-blue/25">
                  <Icon name={step.icon} className="w-6 h-6" />
                </div>
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-5 bg-brand-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center z-20">{step.num}</span>
                <h3 className="font-bold text-brand-dark text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Flux d’accès contrôlé</p>
              <h2 className="mt-1 text-xl font-extrabold text-brand-dark">Une candidature logistique ne crée pas un compte client</h2>
            </div>
            <button onClick={() => setCurrentPage({ name: 'login' })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue/90">
              Accès existant
              <Icon name="arrowRight" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {operatingFlow.map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10">
                  <Icon name={item.icon} className="h-5 w-5 text-brand-blue" />
                </div>
                <h3 className="text-sm font-extrabold text-brand-dark">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUR ROLE / YOUR ROLE ─── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-brand-blue to-brand-blue-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4">Notre rôle</h3>
              <ul className="space-y-3 mb-6">
                {['Trouver les clients', 'Encaisser les paiements', 'Gérer les commandes', 'Assurer le support 24/7'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <Icon name="check" className="w-4 h-4 text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Phone mockup */}
            <div className="absolute -bottom-4 -right-4 w-36 bg-white rounded-2xl shadow-xl overflow-hidden rotate-6 opacity-90">
              <div className="bg-brand-blue px-3 py-2">
                <p className="text-[8px] text-white/70">Commande à collecter</p>
                <p className="text-[10px] font-bold text-white">Gombe → Limete</p>
              </div>
              <div className="p-2 space-y-1">
                <div className="flex justify-between text-[8px]"><span className="text-gray-500">Distance</span><span className="font-bold text-brand-dark">3.2 km</span></div>
                <div className="flex justify-between text-[8px]"><span className="text-gray-500">Rétribution</span><span className="font-bold text-brand-blue">7.5 USD</span></div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-orange to-orange-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-4">Votre rôle</h3>
              <ul className="space-y-3 mb-6">
                {['Fournir des chauffeurs ou véhicules', 'Effectuer les collectes', 'Réaliser les livraisons', 'Respecter les délais'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-orange-100">
                    <Icon name="check" className="w-4 h-4 text-white shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Helmet + box mockup */}
            <div className="absolute -bottom-4 -right-4 w-36 h-28 bg-white/10 rounded-2xl flex items-center justify-center rotate-[-6deg]">
              <div className="text-center">
                <Icon name="shield-check" className="w-10 h-10 text-white/60 mx-auto" />
                <p className="text-[8px] text-white/60 mt-1">Laundry Express</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REVENUE CALCULATOR + PRICING + BONUSES ─── */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-brand-dark mb-12">Combien pouvez-vous gagner ?</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calculator */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h3 className="font-bold text-brand-dark mb-4">Calculateur de revenus</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Livraisons par jour</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDeliveriesPerDay(Math.max(1, deliveriesPerDay - 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">-</button>
                    <span className="text-xl font-bold text-brand-dark w-8 text-center">{deliveriesPerDay}</span>
                    <button onClick={() => setDeliveriesPerDay(Math.min(30, deliveriesPerDay + 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Jours travaillés / semaine</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setDaysPerWeek(Math.max(1, daysPerWeek - 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">-</button>
                    <span className="text-xl font-bold text-brand-dark w-8 text-center">{daysPerWeek}</span>
                    <button onClick={() => setDaysPerWeek(Math.min(7, daysPerWeek + 1))} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Zone</label>
                  <select value={selectedZone} onChange={(e) => setSelectedZone(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue">
                    {zones.map((z, i) => <option key={i} value={i}>{z.name} ({z.communes})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-green-600">{revenue.daily} $</p>
                  <p className="text-[10px] text-gray-500">Journalier</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-brand-blue">{revenue.weekly} $</p>
                  <p className="text-[10px] text-gray-500">Hebdomadaire</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-purple-600">{revenue.monthly} $</p>
                  <p className="text-[10px] text-gray-500">Mensuel estimé</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 text-center">Ces estimations sont indicatives et peuvent varier.</p>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h3 className="font-bold text-brand-dark mb-4">Tarification par zone</h3>
              <div className="space-y-2">
                {zones.map((z) => (
                  <div key={z.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{z.name}</p>
                      <p className="text-[10px] text-gray-500">{z.communes}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-blue">{z.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bonuses */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
              <h3 className="font-bold text-brand-dark mb-4">Gagnez davantage</h3>
              <div className="space-y-3">
                {bonuses.map((b) => (
                  <div key={b.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Icon name={b.icon} className="w-4 h-4 text-brand-blue" />
                      <span className="text-sm text-brand-dark">{b.label}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{b.percent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REQUIREMENTS + ADVANTAGES + TESTIMONIALS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Requirements */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <h3 className="font-bold text-brand-dark mb-4">Conditions pour rejoindre le réseau</h3>
            <ul className="space-y-2.5">
              {requirements.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="check" className="w-4 h-4 text-brand-blue shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Advantages */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <h3 className="font-bold text-brand-dark mb-4">Pourquoi rejoindre Laundry Express ?</h3>
            <div className="grid grid-cols-2 gap-3">
              {advantages.map((a) => (
                <div key={a.title} className="text-center p-3 bg-gray-50 rounded-xl">
                  <Icon name={a.icon} className="w-5 h-5 text-brand-blue mx-auto mb-1" />
                  <p className="text-xs font-semibold text-brand-dark">{a.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
            <h3 className="font-bold text-brand-dark mb-4">Ils nous font confiance</h3>
            <div className="space-y-4">
              {testimonials.map((t, i) => (
                <div key={t.name} className={`p-4 rounded-xl border ${i === 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-brand-blue text-white' : 'bg-brand-blue/10 text-brand-blue'}`}>{t.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{t.name}</p>
                      <p className="text-[10px] text-gray-500">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: t.rating }).map((_, j) => <Icon key={j} name="star" className="w-3 h-3 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-gray-600 italic leading-relaxed">"{t.quote}"</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Icon name="arrowLeft" className="w-3.5 h-3.5 text-gray-400" /></button>
              {[0, 1, 2].map((d) => <div key={d} className={`w-2 h-2 rounded-full ${d === 0 ? 'bg-brand-blue' : 'bg-gray-300'}`} />)}
              <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"><Icon name="arrowRight" className="w-3.5 h-3.5 text-gray-400" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ + APPLICATION FORM ─── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-extrabold text-brand-dark mb-6">Questions fréquentes</h2>
              <div className="space-y-2">
                {faqItems.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                      <span className="text-sm font-semibold text-brand-dark">{item.q}</span>
                      <Icon name={openFaq === i ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-gray-600">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Application Form */}
            <div id="application-form">
              <h2 className="text-2xl font-extrabold text-brand-dark mb-6">Rejoignez notre réseau logistique</h2>
              {formSubmitted ? (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-card">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="check" className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2 text-center">Candidature envoyée</h3>
                  <p className="text-sm text-gray-500 text-center">Notre équipe vérifie votre flotte et vos zones avant activation.</p>
                  <div className="mt-6 space-y-3 text-sm">
                    {[
                      'Un administrateur valide la candidature dans Candidatures.',
                      'La compagnie est créée comme partenaire logistique.',
                      'Le responsable reçoit un accès logistics-manager au cockpit.',
                      'Les chauffeurs sont ajoutés ou reliés à cette compagnie.',
                    ].map((item, index) => (
                      <div key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-blue text-xs font-bold text-white">{index + 1}</span>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Nom de l'entreprise *</label>
                      <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" placeholder="Ex: Express Delivery SARL" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Responsable *</label>
                      <input required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" placeholder="Ex: Jean Mukendi" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Téléphone *</label>
                      <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" placeholder="+243 81 234 5678" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" placeholder="exemple@email.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Type de flotte</label>
                      <select value={form.fleetType} onChange={(e) => setForm({ ...form, fleetType: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue">
                        <option value="">Sélectionnez</option>
                        <option value="moto">Motos</option>
                        <option value="voiture">Voitures</option>
                        <option value="camionnette">Camionnettes</option>
                        <option value="mixte">Flotte mixte</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre de véhicules</label>
                      <select value={form.vehicleCount} onChange={(e) => setForm({ ...form, vehicleCount: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue">
                        <option value="">Sélectionnez</option>
                        <option value="1">1</option>
                        <option value="2-5">2 – 5</option>
                        <option value="6-10">6 – 10</option>
                        <option value="10+">10+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Zones couvertes</label>
                    <input value={form.zones} onChange={(e) => setForm({ ...form, zones: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue" placeholder="Ex: Gombe, Kintambo, Limete..." />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Message (optionnel)</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-none" placeholder="Parlez-nous de votre activité..." />
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="mt-1 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                    <span className="text-xs text-gray-500">J'accepte les conditions générales d'utilisation et la politique de confidentialité.</span>
                  </label>
                  <button type="submit" className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                    Envoyer ma candidature
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'shield-check' as const, title: 'Paiement sécurisé', desc: 'Transactions 100% protégées' },
              { icon: 'badge-check' as const, title: 'Partenaires vérifiés', desc: 'Sélectionnés avec soin' },
              { icon: 'lifebuoy' as const, title: 'Support 24/7', desc: 'Assistance à tout moment' },
              { icon: 'shield' as const, title: 'Assurance incluse', desc: 'Couverture en cas d\'incident' },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <Icon name={b.icon} className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-dark">{b.title}</p>
                  <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
