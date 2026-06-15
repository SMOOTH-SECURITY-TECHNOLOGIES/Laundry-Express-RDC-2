import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { PartnerPhotoGalleryModal } from '../components/PartnerPhotoGalleryModal';
import { PartnerPresentationVideo } from '../components/PartnerPresentationVideo';
import { PartnerServiceShopSection } from '../components/partner-shop/PartnerServiceShopSection';
import { usePartnerServiceCart } from '../hooks/usePartnerServiceCart';
import { mapCatalogPartnerServiceToService } from '../utils/partner-catalog-mappers';
import { Service, Review, ServiceType, PartnerType, WorkingHours, DayWorkingHours } from '../types';
import { trackEvent } from '../utils/tracking';
import { realApi } from '../services/real-api';
import { features } from '../config/features';
import { mapPublicReviewToFrontend } from '../utils/review-mappers';
import { appEvents } from '../utils/events';
import {
  buildGalleryItems,
  flattenGallery,
  getCoverImages,
  getOpenStatusLabel,
  isValidImageUrl,
  mapApiMediaGallery,
  mapApiWorkingHours,
  mergeMediaGalleries,
  pickFirstNonEmpty,
  preferRemoteImageUrls,
  readStoredPartnerMedia,
} from './partner/profile/partnerMedia';
import { PartnerMediaGallery } from '../types';

/* ─── helpers ─── */
const tDefault = (key: string, fallback: string) => fallback;

const useT = () => {
  const { t } = useAppContext();
  return (key: string, fallback: string, opts?: Record<string, unknown>) => {
    try {
      const translated = t(key, opts);
      return translated && translated !== key ? translated : fallback;
    } catch {
      return fallback;
    }
  };
};

const dayNames: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const dayOrder: (keyof WorkingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const todayKey = dayOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

/* ─── Sub-components ─── */

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; action?: React.ReactNode }> = ({ icon, title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2.5">
      {icon && <div className="p-1.5 bg-blue-50 rounded-lg text-brand-blue">{icon}</div>}
      <h2 className="text-lg font-bold text-[#03045E]">{title}</h2>
    </div>
    {action}
  </div>
);

const TrustBadge: React.FC<{ icon: React.ReactNode; label: string; sub: string }> = ({ icon, label, sub }) => (
  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm min-w-[180px] flex-1">
    <div className="p-2 bg-blue-50 rounded-lg text-brand-blue shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-bold text-[#0F172A]">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
    <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue">{icon}</div>
    <div>
      <p className="text-xl font-extrabold text-[#0F172A]">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

const servicePriceLabel = (service: Service, currency = 'USD') => {
  const price = Number(service.price || 0);
  const suffix = service.priceModel === 'per_kg' ? '/kg' : '/article';
  return currency === 'CDF' ? `${price.toFixed(0)} CDF${suffix}` : `${price.toFixed(2)} $${suffix}`;
};

const ReviewCard: React.FC<{ review: Review; getUserById: (id: string) => any }> = ({ review, getUserById }) => {
  const user = getUserById(review.userId);
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0B5FFF]/10 flex items-center justify-center text-[#0B5FFF] font-bold text-sm">
            {(user?.name || 'C').charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-sm text-[#0F172A]">{user?.name || 'Client'}</p>
            <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded-lg">
          <Icon name="star" className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
        </div>
      </div>
      <p className="text-sm text-slate-600 italic leading-relaxed">"{review.comment}"</p>
      <div className="mt-3 flex items-center gap-1.5">
        <Icon name="badge-check" className="w-3.5 h-3.5 text-[#22C55E]" />
        <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider">Commande verifiee</span>
      </div>
    </div>
  );
};

const SafeImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const resolved = failed || !src?.trim() || !isValidImageUrl(src) ? '/images/service-placeholder.jpg' : src;
  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

const MapEmbed: React.FC<{ lat?: number; lng?: number }> = ({ lat, lng }) => {
  const latNum = lat || -4.325;
  const lngNum = lng || 15.322;
  return (
    <div className="h-64 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
      <iframe
        title="Zone de livraison"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.08}%2C${latNum - 0.08}%2C${lngNum + 0.08}%2C${latNum + 0.08}&layer=mapnik&marker=${latNum}%2C${lngNum}`}
        style={{ filter: 'grayscale(0.2) contrast(1.05)' }}
      />
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm border border-white/50">
        <Icon name="mapPin" className="w-3 h-3 text-brand-blue inline mr-1" />
        Zone couverte
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
export const PartnerDetailPage: React.FC = () => {
  const {
    activePartnerId, partners, services, getReviewsForPartner,
    setCurrentPage, updateOrderDraft, resetOrderDraft,
    addNotification, previousPage, user, getUserById, orderDraft, formatPrice,
  } = useAppContext();
  const _t = useT();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [pressingCategoryFilter, setPressingCategoryFilter] = useState<string>('all');
  const [isSharing, setIsSharing] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [partnerServicesList, setPartnerServicesList] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [partnerReviews, setPartnerReviews] = useState<Review[]>([]);
  const [publicProfile, setPublicProfile] = useState<{
    name?: string;
    address?: string;
    workingHours?: WorkingHours;
    videoUrl?: string;
    mediaGallery?: PartnerMediaGallery;
    imageUrls?: string[];
    rating?: number;
    reviewCount?: number;
  }>({});
  const [mediaVersion, setMediaVersion] = useState(0);
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0);

  const openGalleryLightbox = useCallback((index = 0) => {
    setGalleryLightboxIndex(Math.max(0, index));
    setGalleryLightboxOpen(true);
  }, []);

  const shopCart = usePartnerServiceCart();

  const basePartner = partners.find((p) => p.id === activePartnerId);
  const partner = useMemo(() => {
    if (!basePartner) return undefined;
    const stored = readStoredPartnerMedia(basePartner);
    const effectiveGallery = mergeMediaGalleries(publicProfile.mediaGallery, stored.mediaGallery);
    const derivedUrls = preferRemoteImageUrls(flattenGallery(effectiveGallery));
    return {
      ...basePartner,
      name: publicProfile.name || basePartner.name,
      address: publicProfile.address || basePartner.address,
      rating: publicProfile.rating ?? basePartner.rating,
      reviewCount: publicProfile.reviewCount ?? basePartner.reviewCount,
      workingHours: publicProfile.workingHours || basePartner.workingHours,
      videoUrl: pickFirstNonEmpty(publicProfile.videoUrl, stored.videoUrl, basePartner.videoUrl),
      mediaGallery: effectiveGallery,
      imageUrls: derivedUrls.length > 0 ? derivedUrls : stored.imageUrls.filter(isValidImageUrl),
    };
  }, [basePartner, publicProfile, mediaVersion]);
  const fallbackReviews = activePartnerId ? getReviewsForPartner(activePartnerId) : [];
  const reviews = partnerReviews.length > 0 ? partnerReviews : fallbackReviews;
  const isInOrderFlow = previousPage === 'order';
  const requestedServiceType = orderDraft.serviceType || (partner?.type === PartnerType.LAVANDIER ? ServiceType.BLANCHISSERIE : ServiceType.PRESSING);
  const isLaundryProfile = requestedServiceType === ServiceType.BLANCHISSERIE;

  const applyPublicProfile = useCallback((detail: Awaited<ReturnType<typeof realApi.getPartnerPublicProfile>>) => {
    const gallery = mapApiMediaGallery(detail.media_gallery);
    setPublicProfile({
      name: detail.name,
      address: detail.address,
      workingHours: mapApiWorkingHours(detail.working_hours),
      videoUrl: pickFirstNonEmpty(detail.video_url),
      mediaGallery: gallery,
      imageUrls: detail.image_urls?.length ? detail.image_urls : undefined,
      rating: detail.rating,
      reviewCount: detail.total_reviews,
    });
  }, []);

  useEffect(() => {
    if (!activePartnerId) {
      setPublicProfile({});
      return;
    }
    let cancelled = false;
    realApi.getPartnerPublicProfile(activePartnerId)
      .then((detail) => {
        if (!cancelled) applyPublicProfile(detail);
      })
      .catch(() => {
        if (!cancelled) setPublicProfile({});
      });
    return () => {
      cancelled = true;
    };
  }, [activePartnerId, applyPublicProfile]);

  useEffect(() => {
    const refreshMedia = () => {
      setMediaVersion((v) => v + 1);
      if (!activePartnerId) return;
      realApi.getPartnerPublicProfile(activePartnerId)
        .then(applyPublicProfile)
        .catch(() => {});
    };
    const unsubscribe = appEvents.on('data_changed', refreshMedia);
    return unsubscribe;
  }, [activePartnerId, applyPublicProfile]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activePartnerId, publicProfile.mediaGallery, mediaVersion]);

  useEffect(() => {
    if (!activePartnerId || features.useMockApi) {
      setPartnerReviews([]);
      return;
    }

    let cancelled = false;
    realApi.getPublicReviews({ partner_id: activePartnerId, limit: 20 })
      .then((rows) => {
        if (!cancelled) {
          setPartnerReviews(rows.map(mapPublicReviewToFrontend));
        }
      })
      .catch(() => {
        if (!cancelled) setPartnerReviews([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activePartnerId]);

  /* Fetch real services */
  useEffect(() => {
    if (!partner) return;
    let cancelled = false;
    const load = async () => {
      setServicesLoading(true);
      try {
        const catalog = await realApi.getPartnerCatalogServices(partner.id);
        const mapped = catalog
          .filter((s) => s.is_available)
          .map((s) => mapCatalogPartnerServiceToService(s));
        if (!cancelled) setPartnerServicesList(mapped);
      } catch {
        if (!cancelled) {
          const set = new Set(partner.serviceIds || []);
          setPartnerServicesList(services.filter(s => set.has(s.id)));
        }
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partner?.id]);

  /* Tracking + Schema */
  useEffect(() => {
    if (!partner) return;
    let userDataPayload: Record<string, unknown> = {};
    if (user) {
      const [firstName, ...rest] = user.name.split(' ');
      userDataPayload = {
        user_data: {
          email: user.email, phone_number: user.phone,
          address: { first_name: firstName, last_name: rest.join(' '), street: `${(user as any).pickupAddress?.numero || ''} ${(user as any).pickupAddress?.avenue || ''}, ${(user as any).pickupAddress?.quartier || ''}`.trim(), city: (user as any).pickupAddress?.commune, country: 'CD' },
        },
      };
    }
    trackEvent('view_item', {
      items: [{ item_id: partner.id, item_name: partner.name, item_category: partner.type }],
      ...userDataPayload,
    });
    const dayMap: Record<string, string> = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
    const formatHours = (hours?: WorkingHours) => {
      if (!hours) return [];
      return Object.entries(hours).map(([day, s]) => s.isClosed ? null : { '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${dayMap[day]}`, opens: s.open, closes: s.close }).filter(Boolean);
    };
    const partnerSchema = {
      '@context': 'https://schema.org', '@type': 'DryCleaningOrLaundry', name: partner.name, image: partner.imageUrls, url: `https://laundry.app/partner/${partner.slug}`,
      address: { '@type': 'PostalAddress', streetAddress: partner.address },
      geo: { '@type': 'GeoCoordinates', latitude: partner.coordinates?.lat, longitude: partner.coordinates?.lng },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: partner.rating, reviewCount: partner.reviewCount },
      review: reviews.map(r => ({ '@type': 'Review', author: { '@type': 'Person', name: getUserById(r.userId)?.name || 'Anonymous' }, reviewRating: { '@type': 'Rating', ratingValue: r.rating }, reviewBody: r.comment, datePublished: r.createdAt })),
      makesOffer: partnerServicesList.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.description }, ...(s.priceModel === 'per_kg' && s.price ? { priceSpecification: { '@type': 'PriceSpecification', price: s.price, priceCurrency: 'USD', unitCode: 'KGM' } } : {}) })),
      openingHoursSpecification: formatHours(partner.workingHours),
    };
    const breadcrumbSchema = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://laundry.app/' }, { '@type': 'ListItem', position: 2, name: partner.name, item: `https://laundry.app/partner/${partner.slug}` }] };
    const inject = (id: string, data: object) => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = id; s.innerHTML = JSON.stringify(data); document.head.appendChild(s); };
    inject('partner-schema', partnerSchema);
    inject('breadcrumb-schema', breadcrumbSchema);
    return () => { document.getElementById('partner-schema')?.remove(); document.getElementById('breadcrumb-schema')?.remove(); };
  }, [partner, reviews, partnerServicesList, getUserById, user]);

  /* Service grouping */
  const { pressingServices, blanchisserieServices, pressingArticleCategories } = useMemo(() => {
    const p = partnerServicesList.filter(s => s.type === ServiceType.PRESSING);
    const b = partnerServicesList.filter(s => s.type === ServiceType.BLANCHISSERIE);
    const cats = new Set<string>();
    p.forEach(s => s.articleCategories?.forEach(c => cats.add(c.name)));
    return { pressingServices: p, blanchisserieServices: b, pressingArticleCategories: Array.from(cats).sort() };
  }, [partnerServicesList]);

  const filteredPressingServices = useMemo(() => {
    if (pressingCategoryFilter === 'all') return pressingServices;
    return pressingServices.filter(s => s.articleCategories?.some(c => c.name === pressingCategoryFilter));
  }, [pressingServices, pressingCategoryFilter]);

  const activeServices = useMemo(
    () => partnerServicesList.filter(service => service.type === requestedServiceType),
    [partnerServicesList, requestedServiceType]
  );

  const otherServices = useMemo(
    () => partnerServicesList.filter(service => service.type !== requestedServiceType),
    [partnerServicesList, requestedServiceType]
  );

  const highlightedService = activeServices[0];
  const startingPriceLabel = highlightedService
    ? servicePriceLabel(highlightedService, partner?.currency)
    : isLaundryProfile
      ? 'A partir de 1.50 $/kg'
      : 'A partir de 2.00 $/article';

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Icon name="search" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">{_t('partnerDetailPage.notFound', 'Partenaire introuvable')}</p>
          <button onClick={() => setCurrentPage({ name: previousPage || 'home' })} className="mt-3 px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-700">
            {_t('partnerDetailPage.backToHome', "Retour a l'accueil")}
          </button>
        </div>
      </div>
    );
  }

  const galleryImages = buildGalleryItems(partner);
  const images = galleryImages.length > 0
    ? preferRemoteImageUrls(galleryImages.map((item) => item.src))
    : getCoverImages(partner);
  const presentationVideoUrl = pickFirstNonEmpty(publicProfile.videoUrl, partner.videoUrl);
  const openStatusLabel = getOpenStatusLabel(partner.workingHours);

  /* Mock data for demo */
  const publicStats = {
    totalOrders: partner.reviewCount > 0 ? Math.round(partner.reviewCount * 3.8) : 1245,
    satisfactionRate: Math.min(98, Math.round((partner.rating / 5) * 100)),
    avgDeliveryHours: partner.type === PartnerType.PRESSING ? 24 : 36,
    disputeRate: 0.8,
    memberSince: '2022',
    responseTime: '5 min',
    priceEstimateMin: 18,
    priceEstimateMax: 22,
  };

  const priceList = [
    { item: 'Chemise', price: 2 }, { item: 'Pantalon', price: 3 }, { item: 'Costume', price: 8 },
    { item: 'Robe', price: 6 }, { item: 'Couverture / Couette', price: 12 },
    { item: 'Rideaux (par kg)', price: 18 }, { item: 'Nettoyage a sec', price: 7 }, { item: 'Blanchisserie (linge au kg)', price: 2.5 },
  ];

  const deliveryTimes = [
    { item: 'Chemises', time: '24h' }, { item: 'Pantalons', time: '24h' },
    { item: 'Costumes', time: '24 - 48h' }, { item: 'Robes', time: '24 - 48h' },
    { item: 'Couvertures', time: '48 - 72h' }, { item: 'Rideaux', time: '48 - 72h' },
    { item: 'Nettoyage a sec', time: '24 - 48h' },
  ];

  const comparisonData = [
    { name: partner.name, rating: partner.rating, reviews: partner.reviewCount, price: '$$', time: `${publicStats.avgDeliveryHours}h`, distance: '1.2 km', delivery: 'Gratuite', verified: true },
    { name: 'CleanCare Pro', rating: 4.8, reviews: 98, price: '$$', time: '48h', distance: '2.4 km', delivery: 'Gratuite', verified: true },
    { name: 'Netto Plus', rating: 4.7, reviews: 76, price: '$$$', time: '24h', distance: '3.1 km', delivery: '1.5 $', verified: false },
  ];

  const partnerFaq = [
    { q: 'Acceptez-vous les costumes et vetements delicats ?', a: 'Oui, nous utilisons des techniques specialisees pour tous les tissus delicats.' },
    { q: 'Faites-vous le nettoyage a sec ?', a: 'Oui, nous proposons du nettoyage a sec professionnel avec des solvants ecologiques.' },
    { q: 'Proposez-vous un service le dimanche ?', a: 'Oui, nos chauffeurs assurent le ramassage et la livraison le dimanche sur reservation.' },
    { q: 'Comment se passe la livraison ?', a: 'Un chauffeur identifie vient chercher et livrer vos vetements a l adresse de votre choix.' },
    { q: 'Quels sont les moyens de paiement acceptes ?', a: 'Airtel Money, Orange Money, M-Pesa, Visa, Mastercard et paiement a la livraison.' },
    { q: 'Puis-je modifier ou annuler ma commande ?', a: 'Oui, vous pouvez modifier votre commande jusqu a 2h avant le ramassage prevu.' },
  ];

  const beforeAfter = [
    { label: 'Chemise', before: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop', after: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65bd4?w=300&h=300&fit=crop' },
    { label: 'Costume', before: 'https://images.unsplash.com/photo-1507679799987-c73715b8b3a3?w=300&h=300&fit=crop', after: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300&h=300&fit=crop' },
    { label: 'Couverture', before: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop', after: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop' },
    { label: 'Chaussures', before: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop', after: 'https://images.unsplash.com/photo-1600185365926-3a2ce3b6922d?w=300&h=300&fit=crop' },
  ];

  const handleStartGeneralOrder = () => {
    resetOrderDraft();
    updateOrderDraft({ partner, serviceType: requestedServiceType });
    setCurrentPage({ name: 'order' });
  };

  const handleShopCheckout = () => {
    if (!partner || shopCart.lines.length === 0) return;
    const primaryType = shopCart.lines[0]?.service.type || requestedServiceType;
    const serviceItems = shopCart.serviceItems;
    const totalPrice = shopCart.subtotal;
    shopCart.clearCart();
    resetOrderDraft();
    updateOrderDraft({
      partner,
      serviceType: primaryType,
      serviceItems,
      totalPrice,
      checkoutSource: 'partner_shop',
    });
    setCurrentPage({ name: 'order' });
    addNotification('Panier transfere. Finalisez votre commande.', 'success');
  };

  const shareUrl = useMemo(() => partner.slug ? `https://laundry.app/partner/${partner.slug}` : '', [partner.slug]);

  const handleShare = async () => {
    if (!partner || isSharing || !shareUrl) return;
    const title = _t('partnerDetailPage.shareTitle', `${partner.name} sur Laundry Express`, { name: partner.name });
    const text = _t('partnerDetailPage.shareText', `Decouvrez ${partner.name} sur Laundry Express !`, { name: partner.name });
    if (navigator.share) {
      setIsSharing(true);
      try { await navigator.share({ title, text, url: shareUrl }); } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) console.error(e); }
      finally { setIsSharing(false); }
    } else {
      setIsSharing(true);
      try { await navigator.clipboard.writeText(shareUrl); addNotification('Lien copie dans le presse-papiers', 'success'); }
      catch { addNotification('Impossible de copier le lien', 'error'); }
      finally { setTimeout(() => setIsSharing(false), 500); }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 pb-20 lg:pb-0">

      {/* ─── Breadcrumb ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => setCurrentPage({ name: 'home' })} className="hover:text-brand-blue transition">Accueil</button>
          <span className="text-slate-300">/</span>
          <span>Pressings</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">{partner.name}</span>
        </nav>
      </div>

      {/* ─── Hero ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cover image */}
          <div
            className={`relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden shadow-lg ${galleryImages.length > 0 ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (galleryImages.length === 0) return;
              const idx = galleryImages.findIndex((item) => item.src === images[currentImageIndex]);
              openGalleryLightbox(idx >= 0 ? idx : 0);
            }}
            onKeyDown={(e) => {
              if (galleryImages.length === 0) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const idx = galleryImages.findIndex((item) => item.src === images[currentImageIndex]);
                openGalleryLightbox(idx >= 0 ? idx : 0);
              }
            }}
            role={galleryImages.length > 0 ? 'button' : undefined}
            tabIndex={galleryImages.length > 0 ? 0 : undefined}
            aria-label={galleryImages.length > 0 ? 'Ouvrir la galerie photos' : undefined}
          >
            <SafeImage key={images[currentImageIndex]} src={images[currentImageIndex]} alt={partner.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-bold text-[#0F172A] flex items-center gap-1.5 pointer-events-none">
              <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              {openStatusLabel}
            </div>
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 text-xs font-bold text-[#0F172A] flex items-center gap-1.5 pointer-events-none">
              <Icon name="camera" className="w-3.5 h-3.5" />
              {currentImageIndex + 1} / {images.length}
            </div>
            {images.length > 1 && (
              <>
                <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p - 1 + images.length) % images.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"><Icon name="arrowLeft" className="w-4 h-4" /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(p => (p + 1) % images.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"><Icon name="arrowRight" className="w-4 h-4" /></button>
              </>
            )}
          </div>

          {/* Info Card */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#03045E] mb-2">{partner.name.toUpperCase()}</h1>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Icon key={i} name="star" className={`w-5 h-5 ${i < Math.round(partner.rating) ? 'text-yellow-400' : 'text-slate-300'}`} />)}
              </div>
              <span className="font-bold text-[#0F172A]">{partner.rating}</span>
              <span className="text-sm text-slate-500">({partner.reviewCount} avis)</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 bg-blue-50 text-brand-blue text-xs font-bold rounded-lg flex items-center gap-1">
                <Icon name="badge-check" className="w-3.5 h-3.5" />Partenaire verifie
              </span>
              <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <Icon name="trophy" className="w-3.5 h-3.5" />Top 3 Gombe
              </span>
              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <Icon name="hand-thumb-up" className="w-3.5 h-3.5" />{publicStats.satisfactionRate}% satisfaction
              </span>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <Icon name="truck" className="w-3.5 h-3.5" />Livraison gratuite
              </span>
              <span className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1">
                <Icon name="shoppingBag" className="w-3.5 h-3.5" />{publicStats.totalOrders.toLocaleString('fr-FR')} commandes
              </span>
            </div>
            {isInOrderFlow && (
              <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-blue shrink-0">
                    <Icon name={isLaundryProfile ? 'wash' : 'sparkles'} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0F172A]">
                      {isLaundryProfile ? 'Profil Lavage & Pliage au kilo' : 'Profil nettoyage specialise'}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {isLaundryProfile
                        ? 'Ce partenaire sera utilise pour une commande de linge pesee en kg, avec ramassage et pliage.'
                        : 'Ce partenaire sera utilise pour une commande par article avec traitement textile specialise.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2 text-sm text-slate-600 mb-6">
              <div className="flex items-center gap-2"><Icon name="mapPin" className="w-4 h-4 text-slate-400" />{partner.address}</div>
              <div className="flex items-center gap-2"><Icon name="truck" className="w-4 h-4 text-slate-400" />Livraison en {publicStats.avgDeliveryHours}h</div>
              <div className="flex items-center gap-2"><Icon name="calendar" className="w-4 h-4 text-slate-400" />Membre depuis {publicStats.memberSince}</div>
              <div className="flex items-center gap-2"><Icon name="clock" className="w-4 h-4 text-slate-400" />Repond generalement en {publicStats.responseTime}</div>
            </div>
            <button onClick={handleStartGeneralOrder} className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-700 transition shadow-lg shadow-brand-blue/20 mb-3">
              Commander maintenant
            </button>
            <button onClick={handleShare} className="w-full py-3 bg-white text-[#0F172A] font-bold rounded-xl border-2 border-slate-200 hover:border-brand-blue hover:text-brand-blue transition flex items-center justify-center gap-2">
              <Icon name="phone" className="w-4 h-4" />Contacter sur WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* ─── Trust Badges ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-wrap gap-3">
          <TrustBadge icon={<Icon name="badge-check" className="w-5 h-5" />} label="Partenaire verifie" sub="Controle par Laundry Express" />
          <TrustBadge icon={<Icon name="wallet" className="w-5 h-5" />} label="Paiement securise" sub="Vos paiements proteges" />
          <TrustBadge icon={<Icon name="truck" className="w-5 h-5" />} label="Livraison suivie" sub="Suivi en temps reel" />
          <TrustBadge icon={<Icon name="shield-check" className="w-5 h-5" />} label="Qualite garantie" sub="Satisfaction ou remboursement" />
          <TrustBadge icon={<Icon name="star" className="w-5 h-5" />} label="Assurance incluse" sub="Vos articles sont assures" />
          <TrustBadge icon={<Icon name="lifebuoy" className="w-5 h-5" />} label="Support dedie" sub="Assistance 7j/7" />
        </div>
      </div>

      {/* ─── Main Content + Sidebar ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Gallery — Airbnb style */}
            <section>
              <SectionTitle
                icon={<Icon name="photo" className="w-5 h-5" />}
                title="Galerie"
                action={
                  galleryImages.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => openGalleryLightbox(0)}
                      className="text-sm font-bold text-brand-blue hover:underline"
                    >
                      Voir toutes les photos ({galleryImages.length})
                    </button>
                  ) : null
                }
              />
              {galleryImages.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  Aucune photo publiee pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 h-[320px]">
                  <button
                    type="button"
                    onClick={() => openGalleryLightbox(0)}
                    className="col-span-2 md:col-span-2 row-span-2 relative rounded-xl overflow-hidden group cursor-pointer text-left"
                  >
                    <SafeImage src={galleryImages[0].src} alt={galleryImages[0].label} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <span className="text-sm font-bold text-white">{galleryImages[0].label}</span>
                    </div>
                  </button>
                  {galleryImages.slice(1, 5).map((img, i) => (
                    <button
                      key={`${img.src}-${i}`}
                      type="button"
                      onClick={() => openGalleryLightbox(i + 1)}
                      className="relative rounded-xl overflow-hidden group cursor-pointer text-left"
                    >
                      <SafeImage src={img.src} alt={img.label} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <span className="text-xs font-bold text-white">{img.label}</span>
                      </div>
                      {i === 3 && galleryImages.length > 5 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                          +{galleryImages.length - 5} photos
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {presentationVideoUrl && (
              <section data-testid="partner-presentation-video">
                <SectionTitle
                  icon={<Icon name="play" className="w-5 h-5" />}
                  title="Video de presentation"
                />
                <PartnerPresentationVideo
                  videoUrl={presentationVideoUrl}
                  partnerName={partner.name}
                />
              </section>
            )}

            <PartnerServiceShopSection
              partnerName={partner.name}
              services={partnerServicesList}
              loading={servicesLoading}
              formatPrice={formatPrice}
              cartLines={shopCart.lines}
              cartOpen={shopCart.isOpen}
              cartSubtotal={shopCart.subtotal}
              cartItemCount={shopCart.itemCount}
              onAdd={shopCart.addService}
              onOpenCart={() => shopCart.setIsOpen(true)}
              onCloseCart={() => shopCart.setIsOpen(false)}
              onCheckout={handleShopCheckout}
              onUpdateQuantity={shopCart.updateQuantity}
              onUpdateWeight={shopCart.updateWeight}
              onRemove={shopCart.removeLine}
            />

            {/* Performance Stats */}
            <section>
              <SectionTitle icon={<Icon name="chartBar" className="w-5 h-5" />} title="Performance" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={<Icon name="shoppingBag" className="w-5 h-5" />} value={publicStats.totalOrders.toLocaleString('fr-FR')} label="Commandes realisees" />
                <StatCard icon={<Icon name="hand-thumb-up" className="w-5 h-5" />} value={`${publicStats.satisfactionRate}%`} label="Taux de satisfaction" />
                <StatCard icon={<Icon name="clock" className="w-5 h-5" />} value={`${publicStats.avgDeliveryHours}h`} label="Delai moyen de livraison" />
                <StatCard icon={<Icon name="star" className="w-5 h-5" />} value={`${partner.rating} / 5`} label="Note moyenne des clients" />
                <StatCard icon={<Icon name="exclamation-circle" className="w-5 h-5" />} value={`${publicStats.disputeRate}%`} label="Taux de litige" />
                <StatCard icon={<Icon name="check" className="w-5 h-5" />} value="100%" label="Commandes reussies" />
              </div>
            </section>

            {/* Pricing + Delivery Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionTitle
                  icon={<Icon name={isLaundryProfile ? 'wash' : 'currencyDollar'} className="w-5 h-5" />}
                  title={isLaundryProfile ? 'Lavage & pliage au kilo' : 'Service selectionne'}
                  action={servicesLoading ? <span className="text-xs text-slate-400">Chargement...</span> : null}
                />
                <div className="space-y-3">
                  {activeServices.length > 0 ? activeServices.map(service => (
                    <div key={service.id} className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-blue shrink-0">
                            <Icon name={service.priceModel === 'per_kg' ? 'wash' : 'shirt'} className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-[#0F172A]">{service.title}</p>
                            <p className="text-xs text-slate-600 mt-1">{service.description || (service.priceModel === 'per_kg' ? 'Facturation selon le poids pese a la reception.' : 'Facturation par article.')}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="text-[10px] text-slate-600 bg-white rounded-full px-2 py-1 flex items-center gap-1"><Icon name="check" className="w-3 h-3 text-[#22C55E]" />Service actif</span>
                              <span className="text-[10px] text-slate-600 bg-white rounded-full px-2 py-1 flex items-center gap-1"><Icon name="truck" className="w-3 h-3 text-brand-blue" />Ramassage disponible</span>
                              {service.priceModel === 'per_kg' && <span className="text-[10px] text-slate-600 bg-white rounded-full px-2 py-1 flex items-center gap-1"><Icon name="shoppingBag" className="w-3 h-3 text-brand-blue" />Pesee au kg</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-brand-blue whitespace-nowrap">{servicePriceLabel(service, partner.currency)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                      <p className="text-sm font-extrabold text-[#0F172A]">{isLaundryProfile ? 'Lavage & pliage' : 'Nettoyage textile'}</p>
                      <p className="text-xs text-slate-600 mt-1">Ce partenaire est compatible avec le service demande. Les tarifs precis seront confirmes lors de la commande.</p>
                    </div>
                  )}

                  {otherServices.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Autres services proposes</p>
                      <div className="space-y-2">
                        {otherServices.map(service => (
                          <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon name={service.priceModel === 'per_kg' ? 'wash' : 'shirt'} className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm font-semibold text-[#0F172A] truncate">{service.title}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{servicePriceLabel(service, partner.currency)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-xs font-bold text-brand-blue"><Icon name="truck" className="w-4 h-4" />Livraison gratuite dans les zones couvertes</div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg text-xs font-bold text-[#FF7A00]"><Icon name="clock" className="w-4 h-4" />Express disponible . Livraison en 12h (+ frais)</div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-100 p-6">
                <SectionTitle icon={<Icon name="clock" className="w-5 h-5" />} title="Delais de livraison" />
                <div className="space-y-2">
                  {deliveryTimes.map(d => (
                    <div key={d.item} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2"><Icon name="shirt" className="w-4 h-4 text-slate-400" /><span className="text-sm text-[#0F172A]">{d.item}</span></div>
                      <span className="text-sm font-bold text-brand-blue">{d.time}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Coverage Zone */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionTitle icon={<Icon name="mapPin" className="w-5 h-5" />} title="Zone de livraison" action={<button className="text-sm font-bold text-brand-blue hover:underline">Voir toutes les zones</button>} />
              <MapEmbed lat={partner.coordinates?.lat} lng={partner.coordinates?.lng} />
              <div className="mt-5">
                <h4 className="text-sm font-bold text-[#0F172A] mb-3">Communes desservies et frais de livraison</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { commune: 'Gombe', cost: 'Gratuit', color: '#22C55E' },
                    { commune: 'Lingwala', cost: 'Gratuit', color: '#22C55E' },
                    { commune: 'Kinshasa', cost: '1 $', color: '#22C55E' },
                    { commune: 'Barumbu', cost: '1 $', color: '#22C55E' },
                    { commune: 'Limete', cost: '1 $', color: '#FF7A00' },
                    { commune: 'Kasa-Vubu', cost: '1 $', color: '#FF7A00' },
                    { commune: 'Bandalungwa', cost: '2 $', color: '#FF7A00' },
                    { commune: 'Ngaliema', cost: '2 $', color: '#FF7A00' },
                  ].map((zone, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-[#F8FAFC] rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span className="text-sm text-[#0F172A]">{zone.commune}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-600">{zone.cost}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Les frais varient selon la distance et le trafic. Livraison gratuite a partir de 15 $ de commande.</p>
              </div>
            </section>

            {/* Comparison */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionTitle icon={<Icon name="chartBar" className="w-5 h-5" />} title="Comparer avec d'autres pressings proches" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-2 text-slate-500 font-medium">Partenaire</th>
                      <th className="text-center py-3 px-2 text-slate-500 font-medium">Note</th>
                      <th className="text-center py-3 px-2 text-slate-500 font-medium">Prix</th>
                      <th className="text-center py-3 px-2 text-slate-500 font-medium">Delai</th>
                      <th className="text-center py-3 px-2 text-slate-500 font-medium">Distance</th>
                      <th className="text-center py-3 px-2 text-slate-500 font-medium">Livraison</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {row.verified && <Icon name="badge-check" className="w-4 h-4 text-brand-blue" />}
                            <div>
                              <p className="font-bold text-[#0F172A]">{row.name}</p>
                              {row.verified && <p className="text-[10px] text-brand-blue">Partenaire verifie</p>}
                              {i === 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded">Meilleure note</span>
                                  <span className="px-1.5 py-0.5 bg-blue-50 text-brand-blue text-[10px] font-bold rounded">Plus rapide</span>
                                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded">Plus populaire</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1"><Icon name="star" className="w-3.5 h-3.5 text-yellow-400" /><span className="font-bold">{row.rating}</span><span className="text-xs text-slate-400">({row.reviews})</span></div>
                        </td>
                        <td className="py-3 px-2 text-center text-slate-600">{row.price}</td>
                        <td className="py-3 px-2 text-center text-slate-600">{row.time}</td>
                        <td className="py-3 px-2 text-center text-slate-600">{row.distance}</td>
                        <td className="py-3 px-2 text-center"><span className={`text-xs font-bold px-2 py-1 rounded-full ${row.delivery === 'Gratuite' ? 'bg-green-50 text-[#15803d]' : 'bg-orange-50 text-[#FF7A00]'}`}>{row.delivery}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="mt-4 text-sm font-bold text-brand-blue hover:underline">Voir plus de pressings (15+)</button>
            </section>

            {/* Reviews */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle icon={<Icon name="star" className="w-5 h-5" />} title={`Avis clients (${reviews.length})`} />
                {reviews.length > 0 && <button className="text-sm font-bold text-brand-blue hover:underline">Voir tous les avis</button>}
              </div>
              {reviews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(showAllReviews ? reviews : reviews.slice(0, 4)).map(r => (
                      <ReviewCard key={r.id} review={r} getUserById={getUserById} />
                    ))}
                  </div>
                  {reviews.length > 4 && (
                    <button onClick={() => setShowAllReviews(!showAllReviews)} className="mt-4 w-full py-3 text-sm font-bold text-brand-blue border border-brand-blue/20 rounded-xl hover:bg-brand-blue/5 transition">
                      {showAllReviews ? 'Voir moins' : `Voir les ${reviews.length} avis`}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-10">
                  <Icon name="star" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">Aucun avis pour le moment</p>
                  <p className="text-sm text-slate-400 mt-1">Soyez le premier a laisser un avis apres votre commande.</p>
                </div>
              )}
            </section>

            {/* Before / After */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionTitle icon={<Icon name="photo" className="w-5 h-5" />} title="Avant / Apres" action={<button className="text-sm font-bold text-brand-blue hover:underline">Voir plus de resultats</button>} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {beforeAfter.map((ba, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden group">
                    <img src={ba.after} alt={`${ba.label} apres`} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded-full">Avant</span>
                        <span className="text-[10px] font-bold text-white bg-[#22C55E] px-2 py-1 rounded-full">Apres</span>
                      </div>
                      <p className="text-center text-xs font-bold text-white mt-1">{ba.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* About + Strengths */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionTitle icon={<Icon name="building" className="w-5 h-5" />} title="A propos du pressing" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Depuis {publicStats.memberSince}, {partner.name} accompagne les particuliers et entreprises de {partner.address.split(',')[0] || 'Kinshasa'} avec des services professionnels de lavage, repassage et nettoyage a sec.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    Notre mission : offrir qualite, rapidite et confiance a chaque client.
                  </p>
                </div>
                <div className="space-y-2">
                  {[
                    'Equipements professionnels',
                    'Produits de qualite premium',
                    'Equipe formee et experimentee',
                    'Respect des textiles',
                    'Service client reactif',
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <Icon name="check" className="w-4 h-4 text-[#22C55E] shrink-0" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <SectionTitle icon={<Icon name="question-mark-circle" className="w-5 h-5" />} title="Questions frequentes" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {partnerFaq.map((item, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8FAFC] transition">
                      <span className="font-semibold text-sm text-[#0F172A] pr-4">{item.q}</span>
                      <Icon name={openFaq === i ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-slate-600">{item.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Sticky Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              {/* CTA Card — Simplified */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-lg">
                <div className="p-4 bg-[#F8FAFC] rounded-xl mb-5">
                  <p className="text-xs text-slate-500 mb-1">Prix estime</p>
                  <p className="text-3xl font-extrabold text-[#0F172A]">{startingPriceLabel}</p>
                  <p className="text-xs text-slate-400 mt-1">Le prix final depend de votre commande.</p>
                </div>
                <div className="space-y-2 text-sm text-slate-600 mb-5">
                  <div className="flex items-center gap-2"><Icon name="clock" className="w-4 h-4 text-slate-400" />Temps estime : {publicStats.avgDeliveryHours}h</div>
                  <div className="flex items-center gap-2"><Icon name="badge-check" className="w-4 h-4 text-[#22C55E]" />Disponible aujourd'hui</div>
                </div>
                <button onClick={handleStartGeneralOrder} className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-700 transition shadow-lg shadow-brand-blue/20 mb-3">
                  Commander maintenant
                </button>
                <button onClick={handleShare} className="w-full py-3 bg-white text-[#0F172A] font-bold rounded-xl border-2 border-slate-200 hover:border-brand-blue hover:text-brand-blue transition flex items-center justify-center gap-2">
                  <Icon name="phone" className="w-4 h-4" />Contacter
                </button>
                <div className="mt-4 flex items-center gap-2">
                  <Icon name="shield-check" className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-xs text-slate-500">Paiement 100% securise</span>
                </div>
              </div>

              {/* Practical Info */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-[#0F172A] mb-4">Informations pratiques</h3>
                {partner.unavailability && partner.unavailability.length > 0 && (
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg text-sm mb-4">
                    <p className="font-bold">Indisponibilite temporaire</p>
                    {partner.unavailability.map(p => <p key={p.id}>Du {p.startDate} au {p.endDate}</p>)}
                  </div>
                )}
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-700 mb-1.5">Heures d'ouverture</p>
                    {partner.workingHours ? (
                      <div className="space-y-1">
                        {dayOrder.map(day => {
                          const hours: DayWorkingHours = partner.workingHours![day];
                          const isToday = day === todayKey;
                          return (
                            <div key={day} className={`flex justify-between py-0.5 px-2 rounded ${isToday ? 'bg-brand-blue/5 font-bold text-brand-blue' : 'text-slate-600'}`}>
                              <span>{dayNames[day]} {isToday ? "(aujourd'hui)" : ''}</span>
                              <span>{hours.isClosed ? 'Ferme' : `${hours.open} – ${hours.close}`}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400">Non renseignees</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PartnerPhotoGalleryModal
        open={galleryLightboxOpen}
        images={galleryImages}
        index={galleryLightboxIndex}
        partnerName={partner.name}
        onClose={() => setGalleryLightboxOpen(false)}
        onIndexChange={setGalleryLightboxIndex}
      />

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 p-4 shadow-lg lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-400">A partir de</p>
            <p className="text-xl font-extrabold text-[#0F172A]">{startingPriceLabel}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-[#15803d] text-xs font-bold rounded-lg">
              <Icon name="truck" className="w-3.5 h-3.5" />Livraison gratuite
            </span>
          </div>
        </div>
        <button onClick={handleStartGeneralOrder} className="block w-full py-3.5 bg-brand-blue text-white text-center font-bold rounded-xl hover:bg-brand-blue-700 transition shadow-lg shadow-brand-blue/20">
          Commander maintenant
        </button>
      </div>
    </div>
  );
};

