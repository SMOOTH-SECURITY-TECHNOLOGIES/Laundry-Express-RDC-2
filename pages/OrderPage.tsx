import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { ServiceType } from '../types';

interface EstimatorItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const estimatorItemsDefault: EstimatorItem[] = [
  { id: 'costume', name: 'Costume', price: 7.0, quantity: 0 },
  { id: 'chemise', name: 'Chemise', price: 2.0, quantity: 0 },
  { id: 'pantalon', name: 'Pantalon', price: 3.0, quantity: 0 },
];

const services = [
  {
    id: 'lessive',
    icon: 'shirt' as const,
    title: 'Lessive',
    price: '1.50$/kg',
    description: 'Lavage, sechage et pliage pour vos vetements du quotidien',
    gradient: 'from-[#0077B6]/10 to-[#00B4D8]/10',
    iconColor: 'text-[#0077B6]',
    badges: ['Lavage', 'Sechage', 'Pliage'],
  },
  {
    id: 'nettoyage',
    icon: 'sparkles' as const,
    title: 'Nettoyage a sec',
    price: '3.00$/article',
    description: 'Soins specialises pour articles delicats',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-600',
    badges: ['Specialise', 'Delicat', 'Premium'],
  },
  {
    id: 'cordonnerie',
    icon: 'shoppingBag' as const,
    title: 'Cordonnerie',
    price: '5.00$/article',
    description: 'Reparation et entretien de chaussures',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-600',
    badges: ['Reparation', 'Entretien', 'Expertise'],
  },
];

const trustBadges = [
  { icon: 'home' as const, label: 'Ramassage a domicile' },
  { icon: 'users' as const, label: 'Partenaires verifies' },
  { icon: 'clock' as const, label: 'Suivi en temps reel' },
];

const trustBenefits = [
  { icon: 'shield-check' as const, title: 'Paiement securise', description: 'Transactions 100% securisees' },
  { icon: 'home' as const, title: 'Ramassage a domicile', description: 'Nous venons chez vous' },
  { icon: 'users' as const, title: 'Partenaires verifies', description: 'Pressings de confiance' },
  { icon: 'truck' as const, title: 'Livraison rapide', description: 'Livraison sous 24h' },
  { icon: 'phone' as const, title: 'Support 24/7', description: 'Assistance a tout moment' },
];

const popularPartners = [
  {
    id: 'p1',
    name: 'Pressing Royal',
    rating: 4.8,
    delay: '2-3h',
    commune: 'Gombe',
    gradient: 'from-[#0077B6] to-[#00B4D8]',
  },
  {
    id: 'p2',
    name: 'Clean Express',
    rating: 4.6,
    delay: '1-2h',
    commune: 'Bandalungwa',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'p3',
    name: 'Mr. Pressing',
    rating: 4.9,
    delay: '3-4h',
    commune: 'Limete',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const testimonials = [
  { id: 't1', name: 'Marie K.', stars: 5, text: 'Service exceptionnel ! Mes vetements etaient impeccables. Le ramassage a domicile est tres pratique.' },
  { id: 't2', name: 'Jean P.', stars: 5, text: 'Rapide et fiable. Je recommande vivement Laundry Express pour la qualite du service.' },
  { id: 't3', name: 'Sarah L.', stars: 4, text: 'Tres satisfaite du pressing a sec. Mon costume est comme neuf !' },
];

const reassuranceCards = [
  { icon: 'shield-check' as const, title: 'Paiement', description: 'Securise et flexible' },
  { icon: 'truck' as const, title: 'Livraison', description: 'Rapide et ponctuelle' },
  { icon: 'heart' as const, title: 'Qualite', description: 'Satisfait ou rembourse' },
  { icon: 'phone' as const, title: 'Support', description: '24h/24, 7j/7' },
];

const serviceToTypeMap: Record<string, ServiceType> = {
  lessive: ServiceType.BLANCHISSERIE,
  nettoyage: ServiceType.PRESSING,
  cordonnerie: ServiceType.CORDONNERIE,
};

type Step = 0 | 1 | 2;

const stepLabels = ['Service', 'Partenaire', 'Commande'];

const partnerGradients = [
  'from-[#0077B6] to-[#00B4D8]',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-blue-500',
];

export const OrderPage: React.FC = () => {
  const { partners, services: dataServices, setCurrentPage, updateOrderDraft, formatPrice } = useAppContext();

  const [step, setStep] = useState<Step>(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [estimatorItems, setEstimatorItems] = useState<EstimatorItem[]>(estimatorItemsDefault);

  const estimatorTotal = useMemo(() => {
    return estimatorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [estimatorItems]);

  const filteredPartners = useMemo(() => {
    if (!selectedService) return [];
    const serviceType = serviceToTypeMap[selectedService];
    if (!serviceType) return [];
    return (partners || []).filter((p) => {
      if (p.serviceIds && p.serviceIds.length > 0) {
        const partnerServices = (dataServices || []).filter(
          (s) => p.serviceIds?.includes(s.id) && s.type === serviceType
        );
        if (partnerServices.length > 0) return true;
      }
      // Map service types to compatible partner types
      const compatibleTypes: Record<string, string[]> = {
        'BLANCHISSERIE': ['LAVANDIER', 'PRESSING'],
        'PRESSING': ['PRESSING'],
        'CORDONNERIE': ['PRESSING', 'LAVANDIER'],
      };
      return (compatibleTypes[serviceType] || []).includes(p.type as string);
    });
  }, [partners, dataServices, selectedService]);

  const selectedPartner = useMemo(() => {
    if (!selectedPartnerId) return null;
    return (partners || []).find((p) => p.id === selectedPartnerId) || null;
  }, [partners, selectedPartnerId]);

  const selectedServiceLabel = useMemo(() => {
    const svc = services.find((s) => s.id === selectedService);
    return svc ? svc.title : '';
  }, [selectedService]);

  const estimatedTotal = useMemo(() => {
    if (!selectedService) return 0;
    if (selectedService === 'lessive') {
      return estimatorTotal > 0 ? estimatorTotal : 0;
    }
    return estimatorTotal;
  }, [selectedService, estimatorTotal]);

  /* ─── Handlers ─── */

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    const serviceType = serviceToTypeMap[serviceId];
    updateOrderDraft({ serviceType });
    setStep(1);
  };

  const handleSelectPartner = (partnerId: string) => {
    const partner = (partners || []).find((p) => p.id === partnerId) || null;
    if (partner) {
      updateOrderDraft({ partner });
    }
    setSelectedPartnerId(partnerId);
    setStep(2);
  };

  const handleContinue = () => {
    setCurrentPage({ name: 'order' });
  };

  const handleBack = () => {
    if (step === 1) {
      setStep(0);
      setSelectedService(null);
    } else if (step === 2) {
      setStep(1);
      setSelectedPartnerId(null);
    }
  };

  const increment = (itemId: string) => {
    setEstimatorItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const decrement = (itemId: string) => {
    setEstimatorItems((prev) =>
      prev.map((item) => (item.id === itemId && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item))
    );
  };

  /* ─── Step Indicator ─── */
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
      {stepLabels.map((label, index) => {
        const isCompleted = step > index;
        const isCurrent = step === index;
        return (
          <React.Fragment key={label}>
            {index > 0 && (
              <div
                className={`hidden sm:block h-0.5 w-12 lg:w-20 transition-colors duration-300 ${
                  isCompleted ? 'bg-[#0077B6]' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#0077B6] text-white'
                    : isCurrent
                    ? 'bg-[#0077B6] text-white ring-4 ring-[#0077B6]/20'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <Icon name="check" className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  isCurrent
                    ? 'text-[#0077B6]'
                    : isCompleted
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ─── Step 0: Service Selection ─── */
  const renderStep0 = () => (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          De quel service avez-vous <span className="text-[#0077B6]">besoin</span> ?
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Choisissez le service qui correspond a vos besoins et laissez-nous nous occuper du reste.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <Icon name={badge.icon} className="w-4 h-4 text-[#0077B6]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Service Cards */}
      <section className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
          Nos Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                selectedService === service.id
                  ? 'ring-4 ring-[#0077B6] shadow-xl'
                  : 'shadow-card hover:shadow-lg'
              } bg-white dark:bg-slate-800`}
            >
              <div className={`h-40 bg-gradient-to-br ${service.gradient} flex items-center justify-center`}>
                <div className="w-20 h-20 rounded-full bg-white/80 dark:bg-slate-700/80 flex items-center justify-center">
                  <Icon name={service.icon} className={`w-10 h-10 ${service.iconColor}`} />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
                  <span className="text-lg font-bold text-[#0077B6]">{service.price}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      <Icon name="check" className="w-3 h-3 text-green-500" />
                      {badge}
                    </span>
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectService(service.id);
                  }}
                  className="w-full mt-4 bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Choisir ce service
                  <Icon name="arrowRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Benefits */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Pourquoi nous choisir ?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {trustBenefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#0077B6]/10 flex items-center justify-center">
                <Icon name={benefit.icon} className="w-7 h-7 text-[#0077B6]" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{benefit.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Estimator */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Estimation Rapide
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Ajoutez vos articles pour estimer le cout de votre commande
        </p>
        <div className="space-y-4 max-w-lg mx-auto">
          {estimatorItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.price.toFixed(2)}$ / article</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decrement(item.id)}
                  disabled={item.quantity === 0}
                  className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon name="minus" className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-lg text-gray-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => increment(item.id)}
                  className="w-9 h-9 rounded-full bg-[#0077B6] flex items-center justify-center text-white font-bold hover:bg-[#005f8f] transition-colors"
                >
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between p-4 bg-[#0077B6]/10 rounded-xl mb-4">
            <span className="font-semibold text-gray-900 dark:text-white">Total estime</span>
            <span className="text-2xl font-bold text-[#0077B6]">{estimatorTotal.toFixed(2)}$</span>
          </div>
          <button
            onClick={() => handleSelectService(selectedService || 'lessive')}
            disabled={estimatorTotal === 0}
            className="w-full bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer la commande
            <Icon name="arrowRight" className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Popular Partners */}
      <section className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
          Partenaires Populaires
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
            >
              <div className={`h-32 bg-gradient-to-r ${partner.gradient} flex items-center justify-center`}>
                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                  <Icon name="users" className="w-8 h-8 text-gray-700" />
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{partner.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Icon name="star" className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium">{partner.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="clock" className="w-4 h-4 text-gray-400" />
                    <span>{partner.delay}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="mapPin" className="w-4 h-4 text-gray-400" />
                    <span>{partner.commune}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white">
          Ce que disent nos clients
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0077B6] to-[#00B4D8] flex items-center justify-center text-white font-bold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="star"
                        className={`w-4 h-4 ${i < testimonial.stars ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reassurance */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {reassuranceCards.map((card) => (
            <div key={card.title} className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#0077B6]/10 flex items-center justify-center">
                <Icon name={card.icon} className="w-8 h-8 text-[#0077B6]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{card.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  /* ─── Step 1: Partner Selection ─── */
  const renderStep1 = () => (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#0077B6] dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        Retour aux services
      </button>

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Choisissez votre <span className="text-[#0077B6]">partenaire</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {filteredPartners.length > 0
            ? `${filteredPartners.length} partenaire${filteredPartners.length > 1 ? 's' : ''} disponible${filteredPartners.length > 1 ? 's' : ''} pour le service : ${selectedServiceLabel}`
            : 'Aucun partenaire disponible pour ce service dans votre zone.'}
        </p>
      </div>

      {/* Partner Grid */}
      {filteredPartners.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner, index) => (
            <div
              key={partner.id}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 ${
                selectedPartnerId === partner.id
                  ? 'ring-4 ring-[#0077B6] shadow-xl'
                  : ''
              }`}
            >
              {/* Gradient Header */}
              <div className={`h-36 bg-gradient-to-r ${partnerGradients[index % partnerGradients.length]} flex items-center justify-center relative`}>
                <div className="w-20 h-20 rounded-full bg-white/80 dark:bg-slate-700/80 flex items-center justify-center shadow-lg">
                  <Icon name="users" className="w-10 h-10 text-gray-700 dark:text-gray-200" />
                </div>
                {partner.isFeatured && (
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 rounded-full px-3 py-1 flex items-center gap-1 shadow">
                    <Icon name="star" className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Populaire</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{partner.name}</h3>

                {/* Meta Row */}
                <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Icon name="star" className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold">{partner.rating}</span>
                    <span className="text-gray-400">({partner.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="clock" className="w-4 h-4 text-gray-400" />
                    <span>2-4h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="mapPin" className="w-4 h-4 text-gray-400" />
                    <span>{partner.address?.split(',')[1]?.trim() || partner.address}</span>
                  </div>
                </div>

                {/* Address */}
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{partner.address}</p>

                {/* View Profile + Choose Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } } as any)}
                    className="flex-1 border border-[#0077B6] text-[#0077B6] hover:bg-[#0077B6]/5 font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    <Icon name="magnifying-glass-plus" className="w-4 h-4" />
                    Voir profil
                  </button>
                  <button
                    onClick={() => handleSelectPartner(partner.id)}
                    className="flex-1 bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                  >
                    Choisir
                    <Icon name="arrowRight" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <Icon name="search" className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Aucun partenaire trouve</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Il n'y a pas encore de partenaire disponible pour ce service. Essayez un autre service ou revenez plus tard.
          </p>
          <button
            onClick={handleBack}
            className="mt-4 bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 inline-flex items-center gap-2"
          >
            <Icon name="arrowLeft" className="w-4 h-4" />
            Voir les autres services
          </button>
        </div>
      )}
    </div>
  );

  /* ─── Step 2: Order Summary + Continue ─── */
  const renderStep2 = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#0077B6] dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        Retour aux partenaires
      </button>

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Recommandez votre <span className="text-[#0077B6]">commande</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Verifiez les details avant de confirmer.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card overflow-hidden">
        {/* Service & Partner Info */}
        <div className="p-6 space-y-6 border-b border-gray-100 dark:border-slate-700">
          {/* Service Row */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0077B6]/10 flex items-center justify-center flex-shrink-0">
              <Icon
                name={
                  selectedService === 'lessive'
                    ? 'shirt'
                    : selectedService === 'nettoyage'
                    ? 'sparkles'
                    : 'shoppingBag'
                }
                className="w-7 h-7 text-[#0077B6]"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Service</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedServiceLabel}</h3>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 bg-[#0077B6]/10 text-[#0077B6] text-xs font-semibold px-3 py-1 rounded-full">
                <Icon name="check" className="w-3 h-3" />
                Selectionne
              </span>
            </div>
          </div>

          {/* Partner Row */}
          {selectedPartner && (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0077B6] to-[#00B4D8] flex items-center justify-center flex-shrink-0">
                <Icon name="users" className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Partenaire</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h3>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{selectedPartner.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="mapPin" className="w-3.5 h-3.5" />
                    <span>{selectedPartner.address?.split(',')[1]?.trim() || selectedPartner.address}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Estimator Items Summary */}
          {estimatorItems.some((item) => item.quantity > 0) && (
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Articles estimes</p>
              {estimatorItems
                .filter((item) => item.quantity > 0)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(item.price * item.quantity).toFixed(2)}$
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total estime</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Prix variable selon le poids / nombre d'articles</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0077B6]">{estimatorTotal > 0 ? `${estimatorTotal.toFixed(2)}$` : 'A determiner'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={handleContinue}
          className="w-full bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#0077B6]/25 hover:shadow-xl hover:shadow-[#0077B6]/30"
        >
          <Icon name="shoppingBag" className="w-5 h-5" />
          Confirmer et payer
          <Icon name="arrowRight" className="w-5 h-5" />
        </button>

        <button
          onClick={handleBack}
          className="w-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <Icon name="arrowLeft" className="w-4 h-4" />
          Modifier le partenaire
        </button>
      </div>

      {/* Reassurance Mini */}
      <div className="grid grid-cols-2 gap-3">
        {reassuranceCards.map((card) => (
          <div
            key={card.title}
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-slate-700"
          >
            <div className="w-10 h-10 rounded-lg bg-[#0077B6]/10 flex items-center justify-center flex-shrink-0">
              <Icon name={card.icon} className="w-5 h-5 text-[#0077B6]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── Main Render ─── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStepIndicator()}
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </div>
  );
};
