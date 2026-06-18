import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Service, ServiceType, formatAddress } from '../types';
import { ServiceSelectionPage } from '../components/order-marketplace/ServiceSelectionPage';
import { OrderAddressPaymentPage } from './OrderAddressPaymentPage';
import { SmartPriceEstimator } from '../components/SmartPriceEstimator';
import { FabricAnalysisModal } from '../components/FabricAnalysisModal';
import { calculateSubtotal } from '../utils/order-pricing';
import { realApi } from '../services/real-api';
import { DEFAULT_ORDER_ADDONS, mapOrderAddOnFromApi, OrderAddOnUiItem } from '../utils/order-addons';

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
    gradient: 'from-brand-blue/10 to-[#00B4D8]/10',
    iconColor: 'text-brand-blue',
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
    gradient: 'from-brand-blue to-[#00B4D8]',
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
  { label: 'Service', detail: 'Nettoyage à sec' },
  { label: 'Partenaire', detail: 'Prestige Pressing' },
  { label: 'Articles', detail: 'Vos articles' },
  { label: 'Adresse & paiement', detail: 'Règlement' },
  { label: 'Confirmation', detail: 'Commande reçue' },
];

const partnerGradients = [
  'from-brand-blue to-[#00B4D8]',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-rose-500 to-red-500',
  'from-indigo-500 to-blue-500',
];

export const OrderPage: React.FC = () => {
  const {
    partners, services: dataServices, setCurrentPage, updateOrderDraft, formatPrice, orderDraft,
    user, addOrderToHistory, setActiveOrder, addNotification, isLoading, reviews,
  } = useAppContext();

  const [step, setStep] = useState<Step>(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [estimatorItems, setEstimatorItems] = useState<EstimatorItem[]>(estimatorItemsDefault);
  const [pickupTime, setPickupTime] = useState('Aujourd hui, 16h-18h');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [specialInstructions, setSpecialInstructions] = useState(orderDraft.clientDetails?.pickupAddress?.reference || '');
  const [partnerFilter, setPartnerFilter] = useState<'popular' | 'nearby' | 'fast' | 'rated'>('popular');
  const [partnerSort, setPartnerSort] = useState<'recommended' | 'rating' | 'delivery'>('recommended');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    serviceOptions.filter((option) => option.defaultSelected).map((option) => option.id)
  );
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [addOnItems, setAddOnItems] = useState<OrderAddOnUiItem[]>(DEFAULT_ORDER_ADDONS);
  const [laundryWeightKg, setLaundryWeightKg] = useState(5);
  const [showPriceEstimator, setShowPriceEstimator] = useState(false);
  const [showFabricAnalysis, setShowFabricAnalysis] = useState(false);

  const isPartnerShopCheckout = orderDraft.checkoutSource === 'partner_shop';
  const manualNavRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    realApi.getOrderAddOns()
      .then((response) => {
        if (cancelled) return;
        const active = (response.add_ons || []).filter((item) => item.is_active);
        if (active.length > 0) {
          setAddOnItems(active.map(mapOrderAddOnFromApi));
        }
      })
      .catch(() => {
        // Keep DEFAULT_ORDER_ADDONS when API unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (manualNavRef.current) return;
    if (!orderDraft.partner && !orderDraft.serviceType) return;

    if (orderDraft.serviceType) {
      setSelectedService(serviceTypeToServiceMap[orderDraft.serviceType]);
    }

    if (orderDraft.partner) {
      setSelectedPartnerId(orderDraft.partner.id);
      const hasShopCart = (orderDraft.serviceItems?.length || 0) > 0 && (orderDraft.totalPrice || 0) > 0;
      if (hasShopCart && orderDraft.checkoutSource === 'partner_shop') {
        setStep(2);
        return;
      }
      if (hasShopCart) {
        setStep(3);
        return;
      }
      setStep(orderDraft.serviceType ? 2 : 1);
      return;
    }

    setStep(1);
  }, [orderDraft.partner, orderDraft.serviceType, orderDraft.serviceItems, orderDraft.totalPrice]);

  const estimatorTotal = useMemo(() => {
    return estimatorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [estimatorItems]);

  const selectedEstimatorItems = useMemo(() => {
    return estimatorItems.filter((item) => item.quantity > 0);
  }, [estimatorItems]);

  const isLaundryFlow = selectedService === 'lessive';

  const addOnTotal = useMemo(() => {
    if (isLaundryFlow) return 0;
    return addOnItems
      .filter((item) => selectedAddOnIds.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
  }, [isLaundryFlow, selectedAddOnIds]);

  const optionsTotal = useMemo(() => {
    return serviceOptions
      .filter((option) => selectedOptionIds.includes(option.id))
      .reduce((sum, option) => sum + option.price, 0);
  }, [selectedOptionIds]);

  const deliveryFee = selectedOptionIds.includes('pickup') ? 2 : 0;
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
        'BLANCHISSERIE': ['LAVANDIER'],
        'PRESSING': ['PRESSING'],
        'CORDONNERIE': ['PRESSING', 'LAVANDIER'],
      };
      return (compatibleTypes[serviceType] || []).includes(p.type as string);
    });
  }, [partners, dataServices, selectedService]);

  const visiblePartners = useMemo(() => {
    const userCommune = user?.pickupAddress?.commune?.toLowerCase();
    const partnerScore = (partner: typeof filteredPartners[number], index: number) => {
      const address = partner.address?.toLowerCase() || '';
      const proximity = userCommune && address.includes(userCommune) ? 20 : 0;
      const featured = partner.isFeatured ? 25 : 0;
      const rating = Number(partner.rating || 0) * 10;
      const reviews = Math.min(Number(partner.reviewCount || 0), 200) / 10;
      const speed = 10 - (index % 3) * 2;
      return featured + rating + reviews + proximity + speed;
    };

    const sorted = [...filteredPartners].sort((a, b) => {
      if (partnerSort === 'rating' || partnerFilter === 'rated') {
        return Number(b.rating || 0) - Number(a.rating || 0) || Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
      }
      if (partnerSort === 'delivery' || partnerFilter === 'fast') {
        return filteredPartners.indexOf(a) - filteredPartners.indexOf(b);
      }
      if (partnerFilter === 'nearby') {
        const aNearby = userCommune && a.address?.toLowerCase().includes(userCommune) ? 1 : 0;
        const bNearby = userCommune && b.address?.toLowerCase().includes(userCommune) ? 1 : 0;
        return bNearby - aNearby || Number(b.rating || 0) - Number(a.rating || 0);
      }
      return partnerScore(b, filteredPartners.indexOf(b)) - partnerScore(a, filteredPartners.indexOf(a));
    });

    return sorted;
  }, [filteredPartners, partnerFilter, partnerSort, user?.pickupAddress?.commune]);

  const partnerServiceAccent = selectedService === 'nettoyage'
    ? {
      gradient: 'from-violet-500 to-fuchsia-500',
      soft: 'bg-violet-50 text-violet-700',
      border: 'border-violet-500',
      button: 'bg-violet-600 hover:bg-violet-700',
      ring: 'ring-violet-600',
      icon: 'sparkles' as const,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=640&q=80',
    }
    : selectedService === 'cordonnerie'
      ? {
        gradient: 'from-orange-500 to-amber-500',
        soft: 'bg-orange-50 text-orange-700',
        border: 'border-orange-500',
        button: 'bg-orange-600 hover:bg-orange-700',
        ring: 'ring-orange-600',
        icon: 'shoppingBag' as const,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=640&q=80',
      }
      : {
        gradient: 'from-brand-blue to-[#00B4D8]',
        soft: 'bg-blue-50 text-brand-blue',
        border: 'border-brand-blue',
        button: 'bg-brand-blue hover:bg-brand-blue-700',
        ring: 'ring-brand-blue',
        icon: 'wash' as const,
        image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=640&q=80',
      };

  const marketplaceServices = useMemo<Service[]>(() => {
    return services.map((localService) => {
      const serviceType = serviceToTypeMap[localService.id];
      const backendService = (dataServices || []).find((service) => service.type === serviceType);
      const fallbackPrice = Number(localService.price.match(/[\d.]+/)?.[0] || 0);

      return {
        id: localService.id,
        type: serviceType,
        title: backendService?.title || localService.title,
        description: backendService?.description || localService.description,
        iconName: backendService?.iconName || localService.icon,
        imageUrl: backendService?.imageUrl || '',
        priceModel: backendService?.priceModel || (localService.id === 'lessive' ? 'per_kg' : 'per_item'),
        price: Number(backendService?.price || fallbackPrice),
        articleCategories: backendService?.articleCategories,
      };
    });
  }, [dataServices]);

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
      priceModel: catalogService?.priceModel || (selectedService === 'lessive' ? 'per_kg' : 'per_item'),
      price: catalogService?.price || (selectedService === 'lessive' ? 1.5 : estimatorItemsDefault[0].price),
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

  const laundryPricePerKg = selectedServiceDefinition?.price || 1.5;
  const laundrySubtotal = isLaundryFlow ? laundryWeightKg * laundryPricePerKg : 0;
  const partnerShopSubtotal = isPartnerShopCheckout
    ? (orderDraft.totalPrice ?? calculateSubtotal(orderDraft.serviceItems ?? []))
    : 0;
  const orderSubtotal = isPartnerShopCheckout
    ? partnerShopSubtotal
    : isLaundryFlow ? laundrySubtotal : estimatorTotal + addOnTotal;
  const orderTotal = orderSubtotal + optionsTotal + deliveryFee;
  const articleCount = isPartnerShopCheckout
    ? (orderDraft.serviceItems ?? []).reduce((sum, si) => {
      if (si.items) return sum + si.items.reduce((s, item) => s + item.quantity, 0);
      if (si.weight) return sum + 1;
      return sum;
    }, 0)
    : isLaundryFlow
      ? laundryWeightKg
      : selectedEstimatorItems.reduce((sum, item) => sum + item.quantity, 0) + selectedAddOnIds.length;

  useEffect(() => {
    if (isPartnerShopCheckout) return;

    if (!selectedServiceDefinition) {
      updateOrderDraft({ serviceItems: [], totalPrice: 0 });
      return;
    }

    if (selectedServiceDefinition.priceModel === 'per_kg') {
      updateOrderDraft({
        serviceItems: laundryWeightKg > 0 ? [{
          service: selectedServiceDefinition,
          weight: laundryWeightKg,
        }] : [],
        totalPrice: orderTotal,
      });
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
  }, [estimatorItems, laundryWeightKg, orderTotal, selectedAddOnIds, selectedServiceDefinition, updateOrderDraft, isPartnerShopCheckout]);

  /* ─── Handlers ─── */

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    const serviceType = serviceToTypeMap[serviceId];
    updateOrderDraft({ serviceType, checkoutSource: 'marketplace' });
    manualNavRef.current = true;
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { manualNavRef.current = false; }, 200);
  };

  const handleSelectPartner = (partnerId: string) => {
    const partner = (partners || []).find((p) => p.id === partnerId) || null;
    if (partner) {
      updateOrderDraft({ partner });
    }
    setSelectedPartnerId(partnerId);
    manualNavRef.current = true;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { manualNavRef.current = false; }, 200);
  };

  const handleContinue = () => {
    if (orderSubtotal === 0) return;
    manualNavRef.current = true;
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { manualNavRef.current = false; }, 200);
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
    manualNavRef.current = true;
    if (step === 1) {
      setStep(0);
      setSelectedService(null);
      updateOrderDraft({ serviceType: undefined, partner: undefined, checkoutSource: undefined });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 2) {
      if (isPartnerShopCheckout && orderDraft.partner) {
        setCurrentPage({ name: 'partner-detail', params: { partnerId: orderDraft.partner.id } } as any);
        return;
      }
      setStep(1);
      setSelectedPartnerId(null);
      updateOrderDraft({ partner: undefined });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (step === 3) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => { manualNavRef.current = false; }, 200);
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
                  isCompleted ? 'bg-brand-blue' : 'bg-gray-200 dark:bg-slate-700'
                }`}
              />
            )}
            <div className="flex min-w-[112px] items-start gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-brand-blue text-white'
                    : isCurrent
                    ? 'bg-brand-blue text-white ring-4 ring-brand-blue/20'
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
                      ? 'text-brand-blue'
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

  const renderMarketplaceStep0 = () => (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowPriceEstimator(true)} className="flex items-center gap-2 rounded-xl border border-[#005bd8] bg-[#005bd8]/10 px-4 py-2.5 text-sm font-black text-[#005bd8] hover:bg-[#005bd8]/20">
          <Icon name="currencyDollar" className="h-4 w-4" />
          Estimer le prix (IA)
        </button>
      </div>
      <ServiceSelectionPage
      services={marketplaceServices}
      partners={partners || []}
      reviews={reviews || []}
      estimateItems={estimatorItems}
      estimateTotal={estimatorTotal}
      isLoading={isLoading}
      formatPrice={formatPrice}
      onSelectService={handleSelectService}
      onIncrementEstimate={increment}
      onDecrementEstimate={decrement}
      onContinueEstimate={() => handleSelectService(selectedService || 'lessive')}
      onChoosePartner={handleSelectPartner}
    />
    </div>
  );

  /* ─── Step 0: Service Selection ─── */
  const renderStep0 = () => (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          De quel service avez-vous <span className="text-brand-blue">besoin</span> ?
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
              <Icon name={badge.icon} className="w-4 h-4 text-brand-blue" />
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
                  ? 'ring-4 ring-brand-blue shadow-xl'
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
                  <span className="text-lg font-bold text-brand-blue">{service.price}</span>
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
                  className="w-full mt-4 bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
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
              <div className="w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <Icon name={benefit.icon} className="w-7 h-7 text-brand-blue" />
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
                  className="w-9 h-9 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold hover:bg-brand-blue-700 transition-colors"
                >
                  <Icon name="plus" className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between p-4 bg-brand-blue/10 rounded-xl mb-4">
            <span className="font-semibold text-gray-900 dark:text-white">Total estime</span>
            <span className="text-2xl font-bold text-brand-blue">{estimatorTotal.toFixed(2)}$</span>
          </div>
          <button
            onClick={() => handleSelectService(selectedService || 'lessive')}
            disabled={estimatorTotal === 0}
            className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-[#00B4D8] flex items-center justify-center text-white font-bold text-lg">
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
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                <Icon name={card.icon} className="w-8 h-8 text-brand-blue" />
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
    <div className="space-y-8 max-w-7xl mx-auto">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        Retour aux services
      </button>

      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Choisissez votre <span className="text-brand-blue">partenaire</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          {visiblePartners.length > 0
            ? `${visiblePartners.length} partenaire${visiblePartners.length > 1 ? 's' : ''} disponible${visiblePartners.length > 1 ? 's' : ''} pour le service : ${isLaundryFlow ? 'Lavage & pliage au kilo' : selectedServiceLabel}`
            : 'Aucun partenaire disponible pour ce service dans votre zone.'}
        </p>
      </div>

      {visiblePartners.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            {[
              { id: 'popular', label: 'Populaire', icon: 'star' },
              { id: 'nearby', label: 'Proximite', icon: 'mapPin' },
              { id: 'fast', label: 'Delai de livraison', icon: 'clock' },
              { id: 'rated', label: 'Mieux notes', icon: 'star' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPartnerFilter(filter.id as typeof partnerFilter)}
                className={`h-11 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-brand-blue/30 ${
                  partnerFilter === filter.id
                    ? `${partnerServiceAccent.border} text-brand-blue bg-white`
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-blue/50'
                }`}
              >
                <Icon name={filter.icon as any} className="w-4 h-4" />
                {filter.label}
              </button>
            ))}
          </div>

          <label className="h-11 rounded-lg border border-gray-200 bg-white px-4 flex items-center gap-3 text-sm text-gray-500">
            Trier par
            <select
              value={partnerSort}
              onChange={(event) => setPartnerSort(event.target.value as typeof partnerSort)}
              className="bg-transparent text-gray-900 font-bold focus:outline-none"
              aria-label="Trier les partenaires"
            >
              <option value="recommended">Recommande</option>
              <option value="rating">Note</option>
              <option value="delivery">Livraison</option>
            </select>
          </label>
        </div>
      )}

      {visiblePartners.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {visiblePartners.map((partner, index) => {
            const imageUrl = partner.imageUrls?.find(Boolean) || partnerServiceAccent.image;
            const deliveryHour = index === 0 ? '14h00' : index === 1 ? '15h00' : '16h00';
            const onTimeRate = Math.max(92, 98 - index * 3);
            const responseMinutes = Math.max(2, 3 + index * 2);
            const neighborhood = partner.address?.split(',')[1]?.trim() || partner.address?.split(',')[0]?.trim() || 'Kinshasa';

            return (
              <article
                key={partner.id}
                className={`relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-card hover:shadow-xl transition-all duration-300 ${
                  selectedPartnerId === partner.id ? `ring-4 ${partnerServiceAccent.ring}/20` : ''
                }`}
              >
                <div className={`relative h-40 bg-gradient-to-r ${partnerServiceAccent.gradient}`}>
                  <img src={imageUrl} alt="" className="absolute inset-0 h-full w-1/2 object-cover opacity-90" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-transparent to-black/5" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white shadow-lg flex flex-col items-center justify-center text-center">
                    <Icon name={partnerServiceAccent.icon} className="w-8 h-8 text-gray-900" />
                    <span className="text-[10px] font-black text-gray-900 uppercase mt-1 leading-tight">{partner.name.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                  {(partner.isFeatured || index === 0) && (
                    <div className="absolute top-3 right-16 rounded-full bg-white/95 px-3 py-1 flex items-center gap-1 shadow-sm">
                      <Icon name="star" className="w-3.5 h-3.5 text-gray-800" />
                      <span className="text-xs font-bold text-gray-900">Populaire</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute top-4 right-4 text-white hover:scale-110 transition"
                    aria-label={`Ajouter ${partner.name} aux favoris`}
                  >
                    <Icon name="heart" className="w-7 h-7" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    {isLaundryFlow && (
                      <span className={`inline-flex items-center gap-1 rounded-full ${partnerServiceAccent.soft} text-xs font-bold px-3 py-1 mb-3`}>
                        <Icon name="wash" className="w-3.5 h-3.5" />
                        Specialiste lavage au kilo
                      </span>
                    )}
                    <h3 className="text-2xl font-extrabold text-gray-900">{partner.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="star" className="w-4 h-4 text-yellow-400" />
                        <strong className="text-gray-900">{Number(partner.rating || 0).toFixed(1)}</strong>
                        <span>({partner.reviewCount || 0} avis)</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="inline-flex items-center gap-1"><Icon name="clock" className="w-4 h-4 text-gray-400" />2-4h</span>
                      <span className="text-gray-300">|</span>
                      <span className="inline-flex items-center gap-1"><Icon name="mapPin" className="w-4 h-4 text-gray-400" />{neighborhood}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 line-clamp-1">{partner.address}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                      <Icon name="check" className="w-4 h-4 text-emerald-600" />
                      {onTimeRate}% livraisons a temps
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                      <Icon name="fire" className="w-4 h-4 text-brand-blue" />
                      Repond en &lt; {responseMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                      <Icon name="shield-check" className="w-4 h-4 text-brand-blue" />
                      Partenaire verifie
                    </span>
                  </div>

                  <div className={`rounded-xl ${partnerServiceAccent.soft} p-4 flex items-center justify-between gap-4`}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
                        <Icon name="truck" className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Ramassage aujourd'hui</p>
                        <p className="text-sm text-gray-600">Disponible entre 16h00 - 18h00</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Livraison estimee</p>
                      <p className="font-extrabold text-brand-blue">Demain avant {deliveryHour}</p>
                    </div>
                  </div>

                  {isLaundryFlow && (
                    <div className="rounded-xl bg-brand-blue/10 p-3 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-700">Tarif lavage & pliage</span>
                      <span className="font-extrabold text-brand-blue">{formatPrice(laundryPricePerKg)} / kg</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        updateOrderDraft({ partner, serviceType: selectedService ? serviceToTypeMap[selectedService] : undefined });
                        setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } } as any);
                      }}
                      className={`border ${partnerServiceAccent.border} text-brand-blue hover:bg-brand-blue/5 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                    >
                      <Icon name="magnifying-glass-plus" className="w-4 h-4" />
                      Voir le profil
                    </button>
                    <button
                      onClick={() => handleSelectPartner(partner.id)}
                      className={`${partnerServiceAccent.button} text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-blue/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/30`}
                    >
                      Choisir ce partenaire
                      <Icon name="arrowRight" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
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
            className="mt-4 bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 inline-flex items-center gap-2"
          >
            <Icon name="arrowLeft" className="w-4 h-4" />
            Voir les autres services
          </button>
        </div>
      )}

      {visiblePartners.length > 0 && (
        <>
          <section className="rounded-2xl bg-white border border-gray-100 shadow-card p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                ['shield-check', 'Paiement securise', 'Transactions 100% protegees'],
                ['archive-box', 'Articles assures', 'Vos articles sont couverts'],
                ['badge-check', 'Partenaires verifies', 'Selectionnes avec soin'],
                ['lifebuoy', 'Support 24/7', 'Assistance a tout moment'],
                ['heart', 'Satisfait ou rembourse', 'Garantie satisfaction'],
              ].map(([icon, title, description]) => (
                <div key={title} className="flex items-center gap-3 lg:border-r last:border-r-0 border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                    <Icon name={icon as any} className="w-6 h-6 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 text-sm text-gray-500">
            <span>Besoin d'aide pour choisir ?</span>
            <a href="tel:+243812345678" className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline">
              <Icon name="phone" className="w-4 h-4" />
              +243 81 234 5678
            </a>
            <button type="button" onClick={() => setCurrentPage({ name: 'support' })} className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline">
              <Icon name="chatBubble" className="w-4 h-4" />
              Chattez avec nous
            </button>
          </div>
        </>
      )}
    </div>
  );

  /* ─── Step 2: Order Builder ─── */
  const renderStep2 = () => (
    <div className="space-y-8">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-[#00B4D8] transition-colors font-medium"
      >
        <Icon name="arrowLeft" className="w-5 h-5" />
        {isPartnerShopCheckout ? 'Retour a la boutique' : 'Retour aux partenaires'}
      </button>

      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {isPartnerShopCheckout ? (
            <>Verifiez votre <span className="text-brand-blue">commande</span></>
          ) : (
            <>Preparez votre <span className="text-brand-blue">commande</span></>
          )}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2">
          {isPartnerShopCheckout
            ? 'Verifiez les services selectionnes, choisissez vos options puis continuez vers l adresse et le paiement.'
            : 'Ajoutez les articles, choisissez vos options et verifiez le recapitulatif avant de continuer.'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => setShowFabricAnalysis(true)} className="flex items-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-black text-purple-700 hover:bg-purple-100">
              <Icon name="camera" className="h-4 w-4" />
              Analyser le tissu (IA)
            </button>
          </div>
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isPartnerShopCheckout ? 'Services selectionnes' : isLaundryFlow ? 'Poids estime du linge' : 'Vos articles'}
                </h2>
              </div>
              {!isLaundryFlow && !isPartnerShopCheckout && (
                <button
                  type="button"
                  onClick={addNextArticle}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-blue-700"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  Ajouter un autre article
                </button>
              )}
            </div>

            {isPartnerShopCheckout ? (
              <div className="space-y-3">
                {(orderDraft.serviceItems ?? []).map((si) => {
                  const lineTotal = si.weight && si.service
                    ? (si.service.price || 0) * si.weight
                    : (si.items ?? []).reduce((sum, item) => sum + item.article.price * item.quantity, 0);
                  const label = si.weight && si.service
                    ? `${si.service.title} (${si.weight} kg)`
                    : (si.items ?? []).map((item) => `${item.quantity}x ${item.article.name}`).join(', ') || si.service.title;
                  return (
                    <div
                      key={si.service.id}
                      className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-700/40"
                    >
                      {si.service.imageUrl ? (
                        <img src={si.service.imageUrl} alt={si.service.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
                          <Icon name="shoppingBag" className="w-7 h-7 text-brand-blue" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{si.service.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                      </div>
                      <p className="font-bold text-brand-blue shrink-0">{formatPrice(lineTotal)}</p>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => orderDraft.partner && setCurrentPage({ name: 'partner-detail', params: { partnerId: orderDraft.partner.id } } as any)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-blue-700 mt-2"
                >
                  <Icon name="pencil" className="w-4 h-4" />
                  Modifier le panier
                </button>
              </div>
            ) : isLaundryFlow ? (
              <div className="rounded-2xl border border-blue-100 dark:border-slate-700 bg-blue-50/70 dark:bg-slate-700/40 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-blue uppercase">Facturation au kilo</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">Lavage & pliage</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Indiquez le poids estime de votre sac. Le partenaire pese le linge a la reception et ajuste le total si necessaire.
                    </p>
                    <div className="grid grid-cols-3 gap-3 mt-5">
                      {[3, 5, 8].map((weight) => (
                        <button
                          key={weight}
                          type="button"
                          onClick={() => setLaundryWeightKg(weight)}
                          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                            laundryWeightKg === weight
                              ? 'border-brand-blue bg-white text-brand-blue shadow-sm'
                              : 'border-blue-100 bg-white/70 text-gray-700 hover:border-brand-blue/50'
                          }`}
                        >
                          {weight} kg
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:w-72 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setLaundryWeightKg((value) => Math.max(1, value - 1))}
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-600 flex items-center justify-center text-brand-blue hover:border-brand-blue"
                        aria-label="Diminuer le poids"
                      >
                        <Icon name="minus" className="w-4 h-4" />
                      </button>
                      <div className="text-center">
                        <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{laundryWeightKg}</p>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">kg estimes</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLaundryWeightKg((value) => value + 1)}
                        className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-600 flex items-center justify-center text-brand-blue hover:border-brand-blue"
                        aria-label="Augmenter le poids"
                      >
                        <Icon name="plus" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Prix / kg</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(laundryPricePerKg)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-900 dark:text-white">Sous-total linge</span>
                      <span className="text-2xl font-extrabold text-brand-blue">{formatPrice(laundrySubtotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                          className="w-9 h-9 rounded-full bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:border-brand-blue hover:text-brand-blue transition-colors"
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
              </>
            )}
          </section>

          {selectedPartner && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">2</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Partenaire selectionne</h2>
              </div>
              <div className="flex flex-col lg:flex-row gap-5">
                {partnerImageUrl ? (
                  <img src={partnerImageUrl} alt={selectedPartner.name} className="w-full lg:w-56 h-36 rounded-xl object-cover bg-gray-100" />
                ) : (
                  <div className="w-full lg:w-56 h-36 rounded-xl bg-gradient-to-br from-brand-blue to-[#00B4D8] flex items-center justify-center">
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
                        <Icon name={icon as any} className="w-4 h-4 text-brand-blue mb-1" />
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                    <button onClick={openPartnerProfile} className="border border-gray-200 dark:border-slate-700 hover:border-brand-blue text-brand-blue font-semibold py-3 px-4 rounded-xl transition-colors">
                      Voir le profil
                    </button>
                    <button onClick={handleBack} className="bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors">
                      Changer de partenaire
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">3</span>
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
                  <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-3">
                    <Icon name={stage.icon as any} className="w-7 h-7 text-brand-blue" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white">{stage.title}</p>
                  <p className="text-sm text-brand-blue font-semibold">{stage.main}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stage.sub}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">4</span>
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
                        checked ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200 dark:border-slate-700 hover:border-brand-blue/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-brand-blue border-brand-blue text-white' : 'border-gray-300 dark:border-slate-600'}`}>
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
                  <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">5</span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Adresse de ramassage</h2>
                </div>
                <button type="button" onClick={() => setCurrentPage({ name: 'profile' })} className="text-sm font-semibold text-brand-blue inline-flex items-center gap-1">
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
                    <Icon name="mapPin" className="w-7 h-7 text-brand-blue mx-auto mb-1" />
                    <span className="text-xs">Zone de ramassage confirmee</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {!isLaundryFlow && (
            <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">6</span>
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
                        checked ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200 dark:border-slate-700 hover:border-brand-blue/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-brand-blue border-brand-blue text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                          {checked && <Icon name="check" className="w-3.5 h-3.5" />}
                        </span>
                        <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0" />
                        <span className="min-w-0">
                          <span className="block font-bold text-sm text-gray-900 dark:text-white">{item.name}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</span>
                          <span className="block text-sm font-bold text-brand-blue mt-2">+ {formatPrice(item.price)}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                <Icon name="shoppingBag" className="w-5 h-5 text-brand-blue" />
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
                    <div className="w-24 h-20 rounded-lg bg-brand-blue/10 flex items-center justify-center">
                      <Icon name="building" className="w-8 h-8 text-brand-blue" />
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
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {isPartnerShopCheckout
                  ? `Services boutique (${articleCount})`
                  : isLaundryFlow ? `Linge estime (${laundryWeightKg} kg)` : `Articles (${articleCount})`}
              </p>
              {isPartnerShopCheckout ? (
                <>
                  {(orderDraft.serviceItems ?? []).map((si) => {
                    if (si.weight && si.service) {
                      return (
                        <div key={si.service.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {si.service.title} ({si.weight} kg)
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatPrice((si.service.price || 0) * si.weight)}
                          </span>
                        </div>
                      );
                    }
                    return si.items?.map((item) => (
                      <div key={`${si.service.id}-${item.article.id}`} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{item.quantity}x {item.article.name}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.article.price * item.quantity)}</span>
                      </div>
                    ));
                  })}
                  {articleCount === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Votre panier boutique est vide.</p>
                  )}
                </>
              ) : isLaundryFlow ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
                    {laundryWeightKg} kg x {formatPrice(laundryPricePerKg)}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatPrice(laundrySubtotal)}</span>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            <div className="space-y-3 py-5 border-b border-gray-100 dark:border-slate-700 text-sm">
              <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Sous-total</span><span className="font-bold text-gray-900 dark:text-white">{formatPrice(orderSubtotal)}</span></div>
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
                <p className="text-3xl font-bold text-brand-blue">{formatPrice(orderTotal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-5">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm flex justify-between">
                <span className="text-amber-800 font-semibold">Economies</span>
                <span className="text-amber-800 font-bold">{formatPrice(0)}</span>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm flex justify-between">
                <span className="text-blue-900 font-semibold">Delai estime</span>
                <span className="text-brand-blue font-bold">24h</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={orderSubtotal === 0}
              className="w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 shadow-lg shadow-brand-blue/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span>{orderSubtotal > 0 ? 'Continuer' : isLaundryFlow ? 'Indiquez le poids' : 'Ajoutez un article'}</span>
              <span className="text-sm font-normal opacity-90">Adresse et paiement</span>
              <Icon name="arrowRight" className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 space-y-5">
            {reassuranceCards.map((card) => (
              <div key={card.title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                  <Icon name={card.icon} className="w-5 h-5 text-brand-blue" />
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
    <OrderAddressPaymentPage
      onBack={() => {
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  );

  /* ─── Main Render ─── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <SmartPriceEstimator isOpen={showPriceEstimator} onClose={() => setShowPriceEstimator(false)} />
      <FabricAnalysisModal isOpen={showFabricAnalysis} onClose={() => setShowFabricAnalysis(false)} onComplete={(svc) => { setShowFabricAnalysis(false); handleSelectService(svc === 'CORDONNERIE' ? 'cordonnerie' : 'nettoyage'); }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step !== 3 && renderStepIndicator()}
        <div>
          {step === 0 && renderMarketplaceStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};
