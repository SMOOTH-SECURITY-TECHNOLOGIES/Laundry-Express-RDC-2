import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Service, ServiceType, formatAddress } from '../types';

interface EstimatorItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  quantity: number;
}

const estimatorItemsDefault: EstimatorItem[] = [
  {
    id: 'costume',
    name: 'Costume',
    description: 'Nettoyage a sec professionnel',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=160&q=80',
    price: 7.0,
    quantity: 0,
  },
  {
    id: 'chemise',
    name: 'Chemise',
    description: 'Lavage et repassage',
    imageUrl: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=160&q=80',
    price: 2.0,
    quantity: 0,
  },
  {
    id: 'pantalon',
    name: 'Pantalon',
    description: 'Nettoyage a sec',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=160&q=80',
    price: 3.0,
    quantity: 0,
  },
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
  { icon: 'shield-check' as const, title: 'Paiement securise', description: 'Transactions 100% protegees' },
  { icon: 'heart' as const, title: 'Satisfait ou rembourse', description: 'Satisfaction garantie' },
  { icon: 'truck' as const, title: 'Livraison suivie', description: 'Suivi en temps reel' },
  { icon: 'phone' as const, title: 'Support 24/7', description: 'Nous sommes toujours la' },
  { icon: 'shield' as const, title: 'Assurance textile incluse', description: 'Vos articles sont proteges' },
];

const serviceOptions = [
  { id: 'pickup', title: 'Ramassage a domicile', description: 'Nous venons chez vous recuperer votre linge.', price: 0, defaultSelected: true },
  { id: 'express', title: 'Livraison express', description: 'Livraison prioritaire en moins de 24h.', price: 3, defaultSelected: false },
  { id: 'priority', title: 'Traitement prioritaire', description: 'Votre commande sera traitee en priorite.', price: 5, defaultSelected: false },
  { id: 'premium_packaging', title: 'Emballage premium', description: 'Emballage individuel et protection renforcee.', price: 2, defaultSelected: false },
  { id: 'hanger', title: 'Hanger service', description: 'Vetements sur cintres inclus.', price: 1, defaultSelected: false },
];

const addOnItems = [
  {
    id: 'chaussures',
    name: 'Nettoyage chaussures',
    description: 'Entretien complet de vos chaussures.',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=180&q=80',
    price: 5,
  },
  {
    id: 'repassage-premium',
    name: 'Repassage premium',
    description: 'Repassage vapeur professionnel.',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=180&q=80',
    price: 3,
  },
  {
    id: 'desodorisation',
    name: 'Desodorisation textile',
    description: 'Elimine les odeurs et rafraichit.',
    imageUrl: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=180&q=80',
    price: 2,
  },
  {
    id: 'sac-transport',
    name: 'Sac de transport',
    description: 'Sac premium pour votre linge.',
    imageUrl: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=180&q=80',
    price: 2,
  },
];

const serviceToTypeMap: Record<string, ServiceType> = {
  lessive: ServiceType.BLANCHISSERIE,
  nettoyage: ServiceType.PRESSING,
  cordonnerie: ServiceType.CORDONNERIE,
};

const serviceTypeToServiceMap: Record<ServiceType, string> = {
  [ServiceType.BLANCHISSERIE]: 'lessive',
  [ServiceType.PRESSING]: 'nettoyage',
  [ServiceType.CORDONNERIE]: 'cordonnerie',
};

type Step = 0 | 1 | 2 | 3;

const stepLabels = [
  { label: 'Service', detail: 'Nettoyage a sec' },
  { label: 'Partenaire', detail: 'Prestige Pressing' },
  { label: 'Commande', detail: 'Vos articles' },
  { label: 'Adresse', detail: 'Ou livrer ?' },
  { label: 'Paiement', detail: 'Paiement securise' },
  { label: 'Confirmation', detail: 'Commande recue' },
];

const partnerGradients = [
  'from-[#0077B6] to-[#00B4D8]',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-blue-500',
];

export const OrderPage: React.FC = () => {
  const {
    partners, services: dataServices, setCurrentPage, updateOrderDraft, formatPrice, orderDraft,
    user, addOrderToHistory, setActiveOrder, addNotification, isLoading,
  } = useAppContext();

  const [step, setStep] = useState<Step>(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [estimatorItems, setEstimatorItems] = useState<EstimatorItem[]>(estimatorItemsDefault);
  const [pickupTime, setPickupTime] = useState('Aujourd hui, 16h-18h');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [specialInstructions, setSpecialInstructions] = useState(orderDraft.clientDetails?.pickupAddress?.reference || '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    serviceOptions.filter((option) => option.defaultSelected).map((option) => option.id)
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  useEffect(() => {
    if (step >= 2) return;
    if (!orderDraft.partner && !orderDraft.serviceType) return;

    if (orderDraft.serviceType) {
      setSelectedService(serviceTypeToServiceMap[orderDraft.serviceType]);
    }

    if (orderDraft.partner) {
      setSelectedPartnerId(orderDraft.partner.id);
      setStep(orderDraft.serviceType ? 2 : 1);
      return;
    }

    setStep(1);
  }, [orderDraft.partner, orderDraft.serviceType, step]);

  const estimatorTotal = useMemo(() => {
    return estimatorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [estimatorItems]);

  const selectedEstimatorItems = useMemo(() => {
    return estimatorItems.filter((item) => item.quantity > 0);
  }, [estimatorItems]);

  const addOnTotal = useMemo(() => {
    return addOnItems
      .filter((item) => selectedAddOnIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [selectedAddOnIds]);

  const optionsTotal = useMemo(() => {
    return serviceOptions
      .filter((option) => selectedOptionIds.includes(option.id))
      .reduce((sum, option) => sum + option.price, 0);
  }, [selectedOptionIds]);

  const deliveryFee = selectedOptionIds.includes('pickup') ? 2 : 0;
  const orderTotal = estimatorTotal + addOnTotal + optionsTotal + deliveryFee;
  const articleCount = selectedEstimatorItems.reduce((sum, item) => sum + item.quantity, 0) + selectedAddOnIds.length;
  const addressLine = user?.pickupAddress ? formatAddress(user.pickupAddress) : 'Adresse a completer dans votre profil';

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

  const partnerImageUrl = selectedPartner?.imageUrls?.find(Boolean);

  const selectedServiceLabel = useMemo(() => {
    const svc = services.find((s) => s.id === selectedService);
    return svc ? svc.title : '';
  }, [selectedService]);

  const selectedServiceDefinition = useMemo<Service | null>(() => {
    if (!selectedService) return null;

    const serviceType = serviceToTypeMap[selectedService];
    const localService = services.find((s) => s.id === selectedService);
    const partnerService = selectedPartner?.serviceIds
      ? (dataServices || []).find((service) => selectedPartner.serviceIds?.includes(service.id) && service.type === serviceType)
      : null;
    const catalogService = partnerService || (dataServices || []).find((service) => service.type === serviceType);

    return {
      id: catalogService?.id || selectedService,
      type: serviceType,
      title: catalogService?.title || localService?.title || 'Service',
      description: catalogService?.description || localService?.description || '',
      iconName: catalogService?.iconName || localService?.icon || 'shirt',
      imageUrl: catalogService?.imageUrl || '',
      priceModel: 'per_item',
      price: catalogService?.price || estimatorItemsDefault[0].price,
      articleCategories: catalogService?.articleCategories,
    };
  }, [dataServices, selectedPartner, selectedService]);

  const estimatedTotal = useMemo(() => {
    if (!selectedService) return 0;
    if (selectedService === 'lessive') {
      return estimatorTotal > 0 ? estimatorTotal : 0;
    }
    return estimatorTotal;
  }, [selectedService, estimatorTotal]);

  useEffect(() => {
    if (!selectedServiceDefinition) {
      updateOrderDraft({ serviceItems: [], totalPrice: 0 });
      return;
    }

    const selectedItems = estimatorItems
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        article: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
        },
        quantity: item.quantity,
      }));

    const selectedAddOns = addOnItems
      .filter((item) => selectedAddOnIds.includes(item.id))
      .map((item) => ({
        article: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
        },
        quantity: 1,
      }));

    const draftItems = [...selectedItems, ...selectedAddOns];

    updateOrderDraft({
      serviceItems: draftItems.length > 0 ? [{
        service: selectedServiceDefinition,
        items: draftItems,
      }] : [],
      totalPrice: orderTotal,
    });
  }, [estimatorItems, orderTotal, selectedAddOnIds, selectedServiceDefinition, updateOrderDraft]);

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
    if (estimatorTotal === 0) return;
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmOrder = async () => {
    if (!selectedPartner || !user) {
      setCurrentPage({ name: 'login' });
      return;
    }

    const clientDetails = {
      name: user.name,
      phone: user.phone,
      pickupAddress: {
        ...user.pickupAddress,
        reference: specialInstructions || user.pickupAddress.reference,
      },
    };

    updateOrderDraft({ clientDetails, pickupTime });

    try {
      const createdOrder = await addOrderToHistory({
        partner: selectedPartner,
        serviceItems: orderDraft.serviceItems || [],
        clientDetails,
        pickupTime,
        appliedPromoCode: orderDraft.appliedPromoCode,
        useLoyaltyPoints: orderDraft.loyaltyPointsToRedeem,
        paymentMethod,
        discountAmount: orderDraft.discountAmount,
        pointsDiscount: orderDraft.pointsDiscount,
        referralDiscount: orderDraft.referralDiscount,
        totalPrice: orderTotal,
      });

      setActiveOrder(createdOrder);
      addNotification('Commande creee avec succes. Vous pouvez maintenant la suivre.', 'success');
      setCurrentPage({ name: 'tracking' });
    } catch {
      // addOrderToHistory already shows the backend error.
    }
  };

  const handleBack = () => {
    if (step === 1) {
      setStep(0);
      setSelectedService(null);
    } else if (step === 2) {
      setStep(1);
      setSelectedPartnerId(null);
    } else if (step === 3) {
      setStep(2);
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

  const removeItem = (itemId: string) => {
    setEstimatorItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: 0 } : item))
    );
  };

  const addNextArticle = () => {
    const nextItem = estimatorItems.find((item) => item.quantity === 0);
    if (!nextItem) {
      addNotification('Tous les articles courants sont deja dans la commande.', 'info');
      return;
    }
    increment(nextItem.id);
  };

  const toggleServiceOption = (optionId: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const toggleAddOn = (itemId: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const openPartnerProfile = () => {
    if (!selectedPartner) return;
    setCurrentPage({ name: 'partner-detail', params: { partnerId: selectedPartner.id } });
  };

  /* ─── Step Indicator ─── */
  const renderStepIndicator = () => {
    const visualStep = step;

    return (
    <div className="flex items-start justify-center gap-2 sm:gap-3 mb-10 overflow-x-auto pb-2">
      {stepLabels.map((item, index) => {
        const isCompleted = visualStep > index;
        const isCurrent = visualStep === index;
        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <div
                className={`hidden sm:block h-0.5 w-10 lg:w-20 mt-4 transition-colors duration-300 ${
                  isCompleted ? 'bg-[#0077B6]' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div className="flex min-w-[112px] items-start gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
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
              <div className="hidden sm:block min-w-0">
                <p
                  className={`text-sm font-semibold leading-tight ${
                    isCurrent
                      ? 'text-[#0077B6]'
                      : isCompleted
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{item.detail}</p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
  };

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

  /* ─── Step 2: Order Builder ─── */
  const renderStep2 = () => (
    <div className="space-y-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#0077B6] dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        Retour aux partenaires
      </button>

      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Preparez votre <span className="text-[#0077B6]">commande</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
          Ajoutez les articles, choisissez vos options et verifiez le recapitulatif avant de continuer.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vos articles</h2>
              </div>
              <button
                type="button"
                onClick={addNextArticle}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#0077B6] hover:text-[#005f8f]"
              >
                <Icon name="plus" className="w-4 h-4" />
                Ajouter un autre article
              </button>
            </div>

            <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_120px_130px_120px_40px] gap-4 px-2 pb-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>Article</span>
              <span className="text-right">Prix unitaire</span>
              <span className="text-center">Quantite</span>
              <span className="text-right">Sous-total</span>
              <span />
            </div>

            <div className="space-y-3">
              {estimatorItems.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_120px_130px_120px_40px] gap-4 items-center p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/40"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  <p className="md:text-right font-semibold text-gray-900 dark:text-white">{formatPrice(item.price)}</p>
                  <div className="flex items-center md:justify-center gap-3">
                    <button
                      onClick={() => decrement(item.id)}
                      disabled={item.quantity === 0}
                      className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Retirer ${item.name}`}
                    >
                      <Icon name="minus" className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => increment(item.id)}
                      className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:border-[#0077B6] hover:text-[#0077B6] transition-colors"
                      aria-label={`Ajouter ${item.name}`}
                    >
                      <Icon name="plus" className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="md:text-right font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={item.quantity === 0}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Supprimer ${item.name}`}
                  >
                    <Icon name="xmark" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {selectedPartner && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">2</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Partenaire selectionne</h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-5">
                {partnerImageUrl ? (
                  <img src={partnerImageUrl} alt={selectedPartner.name} className="w-full lg:w-56 h-36 rounded-xl object-cover bg-gray-100" />
                ) : (
                  <div className="w-full lg:w-56 h-36 rounded-xl bg-gradient-to-br from-[#0077B6] to-[#00B4D8] flex items-center justify-center">
                    <Icon name="building" className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1">
                      <Icon name="badge-check" className="w-3.5 h-3.5" />
                      Partenaire certifie
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1"><Icon name="star" className="w-4 h-4 text-yellow-400" /> {selectedPartner.rating} ({selectedPartner.reviewCount} avis)</span>
                    <span className="inline-flex items-center gap-1"><Icon name="mapPin" className="w-4 h-4" /> {selectedPartner.address?.split(',')[1]?.trim() || selectedPartner.address}</span>
                    <span className="inline-flex items-center gap-1"><Icon name="calendar" className="w-4 h-4" /> 240 commandes ce mois</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                    {[
                      ['home', 'Livraison 24h', 'Delai moyen'],
                      ['truck', 'Ramassage disponible', 'A domicile'],
                      ['shield-check', 'Qualite garantie', 'Controle qualite'],
                    ].map(([icon, title, desc]) => (
                      <div key={title} className="rounded-xl border border-gray-100 dark:border-slate-700 p-3">
                        <Icon name={icon as any} className="w-4 h-4 text-[#0077B6] mb-1" />
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <button onClick={openPartnerProfile} className="border border-gray-200 dark:border-slate-700 hover:border-[#0077B6] text-[#0077B6] font-semibold py-3 px-4 rounded-xl transition-colors">
                      Voir le profil
                    </button>
                    <button onClick={handleBack} className="bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                      Changer de partenaire
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">3</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Delais estimes</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: 'shoppingBag', title: 'Ramassage', main: "Aujourd'hui", sub: '14h00' },
                { icon: 'calendar-days', title: 'Traitement', main: '6 heures', sub: 'Prioritaire disponible' },
                { icon: 'shirt', title: 'Pret', main: 'Demain', sub: '10h00' },
                { icon: 'truck', title: 'Livraison', main: 'Demain avant', sub: '18h00' },
              ].map((stage) => (
                <div key={stage.title} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#0077B6]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon name={stage.icon as any} className="w-7 h-7 text-[#0077B6]" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{stage.title}</p>
                  <p className="text-sm text-[#0077B6] font-semibold">{stage.main}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stage.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">4</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Options de service</h2>
              </div>
              <div className="space-y-3">
                {serviceOptions.map((option) => {
                  const checked = selectedOptionIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleServiceOption(option.id)}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        checked ? 'border-[#0077B6] bg-[#0077B6]/5' : 'border-gray-200 dark:border-slate-700 hover:border-[#0077B6]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-[#0077B6] border-[#0077B6] text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                          {checked && <Icon name="check" className="w-3.5 h-3.5" />}
                        </span>
                        <span className="flex-1">
                          <span className="block font-bold text-gray-900 dark:text-white text-sm">{option.title}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.description}</span>
                        </span>
                        <span className={`text-sm font-bold ${option.price === 0 ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                          {option.price === 0 ? 'Gratuit' : `+ ${formatPrice(option.price)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">5</span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Adresse de ramassage</h2>
                </div>
                <button type="button" onClick={() => setCurrentPage({ name: 'profile' })} className="text-sm font-semibold text-[#0077B6] inline-flex items-center gap-1">
                  <Icon name="pencil" className="w-4 h-4" />
                  Modifier
                </button>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                <h3 className="font-bold text-gray-900 dark:text-white">{addressLine}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kinshasa, Republique Democratique du Congo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nom</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Client'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Telephone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.phone || 'A completer'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-gray-100 dark:bg-slate-700 h-28 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-300">
                    <Icon name="mapPin" className="w-7 h-7 text-[#0077B6] mx-auto mb-1" />
                    <span className="text-xs">Zone de ramassage confirmee</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-[#0077B6] text-white text-sm font-bold flex items-center justify-center">6</span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vous pourriez aussi avoir besoin de</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {addOnItems.map((item) => {
                const checked = selectedAddOnIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAddOn(item.id)}
                    className={`text-left rounded-xl border p-3 transition ${
                      checked ? 'border-[#0077B6] bg-[#0077B6]/5' : 'border-gray-200 dark:border-slate-700 hover:border-[#0077B6]/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-[#0077B6] border-[#0077B6] text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                        {checked && <Icon name="check" className="w-3.5 h-3.5" />}
                      </span>
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
                      <span className="min-w-0">
                        <span className="block font-bold text-sm text-gray-900 dark:text-white">{item.name}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</span>
                        <span className="block text-sm font-bold text-[#0077B6] mt-2">+ {formatPrice(item.price)}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#0077B6]/10 flex items-center justify-center">
                <Icon name="shoppingBag" className="w-5 h-5 text-[#0077B6]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recapitulatif de commande</h2>
            </div>

            {selectedPartner && (
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Partenaire</p>
                <div className="flex gap-3 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
                  {partnerImageUrl ? (
                    <img src={partnerImageUrl} alt={selectedPartner.name} className="w-24 h-20 rounded-lg object-cover bg-gray-100" />
                  ) : (
                    <div className="w-24 h-20 rounded-lg bg-[#0077B6]/10 flex items-center justify-center">
                      <Icon name="building" className="w-8 h-8 text-[#0077B6]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{selectedPartner.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"><Icon name="star" className="inline w-3.5 h-3.5 text-yellow-400" /> {selectedPartner.rating} ({selectedPartner.reviewCount} avis)</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"><Icon name="mapPin" className="inline w-3.5 h-3.5" /> {selectedPartner.address?.split(',')[1]?.trim() || selectedPartner.address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"><Icon name="home" className="inline w-3.5 h-3.5" /> Livraison 24h</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 border-b border-gray-100 dark:border-slate-700 pb-5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Articles ({articleCount})</p>
              {selectedEstimatorItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.quantity * item.price)}</span>
                </div>
              ))}
              {addOnItems.filter((item) => selectedAddOnIds.includes(item.id)).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">1x {item.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.price)}</span>
                </div>
              ))}
              {articleCount === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez au moins un article pour continuer.</p>
              )}
            </div>

            <div className="space-y-3 py-5 border-b border-gray-100 dark:border-slate-700 text-sm">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Sous-total</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(estimatorTotal + addOnTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Livraison</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Options</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(optionsTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Taxes</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(0)}</span></div>
            </div>

            <div className="py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Total estime</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prix variable selon le poids / nombre d'articles</p>
                </div>
                <p className="text-3xl font-bold text-[#0077B6]">{formatPrice(orderTotal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-5">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm flex justify-between">
                <span className="text-amber-800 font-semibold">Economies</span>
                <span className="text-amber-800 font-bold">{formatPrice(0)}</span>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm flex justify-between">
                <span className="text-blue-900 font-semibold">Delai estime</span>
                <span className="text-[#0077B6] font-bold">24h</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={estimatorTotal === 0}
              className="w-full bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#0077B6]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span>{estimatorTotal > 0 ? 'Continuer' : 'Ajoutez un article'}</span>
              <span className="text-sm font-normal opacity-90">Adresse et paiement</span>
              <Icon name="arrowRight" className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 space-y-5">
            {reassuranceCards.map((card) => (
              <div key={card.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0077B6]/10 flex items-center justify-center shrink-0">
                  <Icon name={card.icon} className="w-5 h-5 text-[#0077B6]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{card.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );

  /* ─── Step 3: Address + Payment ─── */
  const renderStep3 = () => (
    <div className="space-y-8 max-w-2xl mx-auto">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#0077B6] dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        Retour a la commande
      </button>

      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Adresse et <span className="text-[#0077B6]">paiement</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Confirmez le ramassage et choisissez comment regler la commande.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0077B6]/10 flex items-center justify-center shrink-0">
              <Icon name="mapPin" className="w-6 h-6 text-[#0077B6]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Adresse de ramassage</p>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{user?.name || 'Client'}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {user?.pickupAddress ? formatAddress(user.pickupAddress) : 'Aucune adresse enregistree'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.phone}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="pickupTime" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Creneau de ramassage
            </label>
            <select
              id="pickupTime"
              value={pickupTime}
              onChange={(event) => setPickupTime(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0077B6]/30 focus:border-[#0077B6]"
            >
              <option>Aujourd hui, 16h-18h</option>
              <option>Aujourd hui, 18h-20h</option>
              <option>Demain, 08h-10h</option>
              <option>Demain, 10h-12h</option>
              <option>Demain, 14h-16h</option>
            </select>
          </div>

          <div>
            <label htmlFor="specialInstructions" className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Instructions pour le chauffeur
            </label>
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(event) => setSpecialInstructions(event.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0077B6]/30 focus:border-[#0077B6]"
              placeholder="Ex: appeler en arrivant, portail noir, 2e etage..."
            />
          </div>

          <div>
            <p className="block text-sm font-bold text-gray-900 dark:text-white mb-3">Mode de paiement</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'cash', label: 'Cash', desc: 'A la livraison', icon: 'currencyDollar' },
                { id: 'mobile_money', label: 'Mobile Money', desc: 'M-Pesa / Airtel', icon: 'phone' },
                { id: 'card', label: 'Carte', desc: 'Visa / Mastercard', icon: 'credit-card' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as 'cash' | 'mobile_money' | 'card')}
                  className={`p-4 rounded-xl border text-left transition ${
                    paymentMethod === method.id
                      ? 'border-[#0077B6] bg-[#0077B6]/5 ring-2 ring-[#0077B6]/20'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-[#0077B6]/50'
                  }`}
                >
                  <Icon name={method.icon as any} className="w-5 h-5 text-[#0077B6] mb-2" />
                  <p className="font-bold text-gray-900 dark:text-white">{method.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{method.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total a confirmer</span>
            <span className="text-3xl font-bold text-[#0077B6]">{formatPrice(orderTotal)}</span>
          </div>
          <button
            onClick={handleConfirmOrder}
            disabled={isLoading || !user || estimatorTotal === 0}
            className="w-full bg-[#0077B6] hover:bg-[#005f8f] text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#0077B6]/25 hover:shadow-xl hover:shadow-[#0077B6]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Icon name="check" className="w-5 h-5" />
            {isLoading ? 'Creation en cours...' : 'Confirmer la commande'}
          </button>
        </div>
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
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
};
