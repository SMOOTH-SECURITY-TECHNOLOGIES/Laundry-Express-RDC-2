import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { PartnerPresentationVideo } from '../components/PartnerPresentationVideo';
import { PartnerServiceShopSection } from '../components/partner-shop/PartnerServiceShopSection';
import { usePartnerServiceCart } from '../hooks/usePartnerServiceCart';
import { Review, Service, WorkingHours, DayWorkingHours, Partner } from '../types';
import { realApi } from '../services/real-api';
import { pickFirstNonEmpty } from './partner/profile/partnerMedia';
import { mapCatalogPartnerServiceToService } from '../utils/partner-catalog-mappers';

/* ─── Helpers ─── */
const dayNames: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
};
const dayOrder: (keyof WorkingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const todayKey = dayOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR');

/* ─── Sub-Components ─── */
const MapPlaceholder: React.FC<{ lat?: number; lng?: number }> = ({ lat, lng }) => (
  <div className="h-48 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-200">
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #cbd5e1 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #cbd5e1 20px)',
      backgroundSize: '20px 20px',
    }} />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <Icon name="mapPin" className="w-8 h-8 text-[#0B5FFF] mx-auto mb-1" />
        <p className="text-xs text-slate-500 font-medium">{lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Carte indisponible'}</p>
      </div>
    </div>
  </div>
);

const BadgeCheck: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg text-xs font-bold text-[#15803d]">
    <Icon name="check" className="w-3.5 h-3.5" />
    <span>{label}</span>
  </div>
);

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
            <p className="text-xs text-slate-400">{formatDate(review.createdAt)}</p>
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

/* ─── Main Page ─── */
export const MiniSitePage: React.FC = () => {
  const {
    partners, getReviewsForPartner, getUserById, activePartnerId,
    setCurrentPage, updateOrderDraft, resetOrderDraft, formatPrice, addNotification,
  } = useAppContext();
  const shopCart = usePartnerServiceCart();
  const [activeImage, setActiveImage] = useState(0);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [displayServices, setDisplayServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [publicVideoUrl, setPublicVideoUrl] = useState<string | undefined>();

  // Resolve partner
  const slug = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[0] === 'mini-site' ? parts[1] : '';
  }, []);

  const partner = useMemo<Partner | null>(() => {
    if (activePartnerId) {
      const p = partners.find(pt => pt.id === activePartnerId);
      if (p) return p;
    }
    if (slug) {
      return partners.find(pt => pt.slug === slug) || null;
    }
    return null;
  }, [partners, activePartnerId, slug]);

  const reviews = useMemo(() => {
    return partner ? getReviewsForPartner(partner.id) : [];
  }, [partner, getReviewsForPartner]);

  useEffect(() => {
    if (!partner?.id) {
      setPublicVideoUrl(undefined);
      return;
    }
    let cancelled = false;
    realApi.getPartnerPublicProfile(partner.id)
      .then((detail) => {
        if (!cancelled) setPublicVideoUrl(pickFirstNonEmpty(detail.video_url));
      })
      .catch(() => {
        if (!cancelled) setPublicVideoUrl(undefined);
      });
    return () => { cancelled = true; };
  }, [partner?.id]);

  // Fetch real services
  useEffect(() => {
    if (!partner) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingServices(true);
      setServicesError(null);
      try {
        const catalogServices = await realApi.getPartnerCatalogServices(partner.id);
        if (!cancelled) {
          setDisplayServices(
            catalogServices.filter((s) => s.is_available).map((s) => mapCatalogPartnerServiceToService(s)),
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setServicesError(err.message || 'Erreur de chargement des services');
          setDisplayServices([]);
        }
      } finally {
        if (!cancelled) setIsLoadingServices(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [partner?.id]);

  // Show sticky CTA after scrolling past hero
  useEffect(() => {
    const onScroll = () => setShowStickyCTA(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Icon name="search" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Partenaire introuvable</p>
          <a href="https://laundry.app" className="mt-3 inline-block px-4 py-2 bg-[#0B5FFF] text-white rounded-lg text-sm hover:bg-[#002B7F]">
            Retour a l'accueil
          </a>
        </div>
      </div>
    );
  }

  const images = partner.imageUrls?.length > 0 ? partner.imageUrls : ['/images/service-placeholder.jpg'];
  const presentationVideoUrl = pickFirstNonEmpty(publicVideoUrl, partner.videoUrl);

  const handleShopCheckout = () => {
    if (!partner || shopCart.lines.length === 0) return;
    const primaryType = shopCart.lines[0]?.service.type;
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

  // Mock stats
  const publicStats = {
    totalOrders: partner.reviewCount > 0 ? Math.round(partner.reviewCount * 3.8) : 1245,
    satisfactionRate: Math.min(98, Math.round((partner.rating / 5) * 100)),
    avgDeliveryHours: 24,
    disputeRate: 0.8,
    memberSince: '2022',
    responseTime: '5 min',
  };

  const partnerFaq = [
    { q: 'Acceptez-vous les costumes ?', a: 'Oui, nous nettoyons et repassons tous types de costumes avec des techniques professionnelles.' },
    { q: 'Nettoyez-vous les tapis ?', a: 'Oui, nous proposons un service de nettoyage a sec pour tapis et moquettes.' },
    { q: 'Ramassage le dimanche ?', a: 'Oui, nos chauffeurs sont disponibles 7j/7 selon les horaires affiches.' },
    { q: 'Quel delai pour un costume ?', a: 'Le delai standard est de 24h a 48h selon la complexite du traitement.' },
  ];

  const comparisonStats = [
    { label: 'Note', partnerValue: partner.rating.toFixed(1), avgValue: '4.5', better: true },
    { label: 'Delai moyen', partnerValue: `${publicStats.avgDeliveryHours}h`, avgValue: '36h', better: publicStats.avgDeliveryHours <= 36 },
    { label: 'Commandes', partnerValue: String(publicStats.totalOrders), avgValue: '640', better: publicStats.totalOrders > 640 },
    { label: 'Taux litige', partnerValue: `${publicStats.disputeRate}%`, avgValue: '2.1%', better: publicStats.disputeRate < 2.1 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      {/* ─── Sticky Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {partner.imageUrls?.[0] ? (
              <img src={partner.imageUrls[0]} alt={partner.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#0B5FFF] flex items-center justify-center text-white font-bold">{partner.name.charAt(0)}</div>
            )}
            <div>
              <span className="font-bold text-[#0F172A] text-sm">{partner.name}</span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Icon name="star" className="w-3 h-3 text-yellow-400" />
                <span>{partner.rating}</span>
                <span>({partner.reviewCount} avis)</span>
              </div>
            </div>
          </div>
          <a href={`https://laundry.app/partner/${partner.slug}`} className="px-5 py-2.5 bg-[#0B5FFF] text-white text-sm font-bold rounded-xl hover:bg-[#002B7F] transition shadow-sm">
            Commander
          </a>
        </div>
      </header>

      {/* ─── Sticky Bottom CTA (mobile) — Enriched ─── */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 p-4 shadow-lg lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400">A partir de</p>
              <p className="text-xl font-extrabold text-[#0F172A]">2 $</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-[#15803d] text-xs font-bold rounded-lg">
                <Icon name="truck" className="w-3.5 h-3.5" />Livraison gratuite
              </span>
            </div>
          </div>
          <a href={`https://laundry.app/partner/${partner.slug}`} className="block w-full py-3.5 bg-[#0B5FFF] text-white text-center font-bold rounded-xl hover:bg-[#002B7F] transition">
            Commander chez {partner.name}
          </a>
        </div>
      )}

      {/* ─── Hero Gallery (Airbnb style) ─── */}
      <div className="relative pt-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[320px] md:h-[420px]">
          <div className="md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden group">
            <img src={images[0]} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden group hidden md:block">
              <img src={img} alt={`${partner.name} ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-5xl mx-auto pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-[#22C55E] text-white text-xs font-bold rounded-lg flex items-center gap-1"><Icon name="badge-check" className="w-3 h-3" />Partenaire verifie</span>
            {partner.isFeatured && <span className="px-2.5 py-1 bg-[#FF7A00] text-white text-xs font-bold rounded-lg">En vedette</span>}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-2">{partner.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm mb-3">
            <span className="flex items-center gap-1.5"><Icon name="star" className="w-4 h-4 text-yellow-400" />{partner.rating} ({partner.reviewCount} avis)</span>
            <span className="flex items-center gap-1.5"><Icon name="mapPin" className="w-4 h-4" />{partner.address}</span>
            <span className="flex items-center gap-1.5"><Icon name="clock" className="w-4 h-4" />Livraison {publicStats.avgDeliveryHours}h</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1"><Icon name="trophy" className="w-3 h-3" />Top 3 {partner.address.split(',')[0] || 'Kinshasa'}</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1">{publicStats.satisfactionRate}% satisfaction</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1"><Icon name="truck" className="w-3 h-3" />Livraison gratuite</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1">{publicStats.totalOrders.toLocaleString('fr-FR')} commandes</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* ─── Trust Badges (enriched) ─── */}
        <div className="flex flex-wrap gap-3">
          {[
            { icon: <Icon name="badge-check" className="w-5 h-5" />, label: 'Partenaire verifie', sub: 'Identite & local confirmes' },
            { icon: <Icon name="shield-check" className="w-5 h-5" />, label: 'Assurance qualite', sub: 'Satisfait ou rembourse' },
            { icon: <Icon name="shield" className="w-5 h-5" />, label: 'Paiements securises', sub: 'Cryptage SSL 256-bit' },
            { icon: <Icon name="truck" className="w-5 h-5" />, label: 'Livraison suivie', sub: 'Notifications en temps reel' },
            { icon: <Icon name="clock" className="w-5 h-5" />, label: 'Reponse rapide', sub: `Moyenne ${publicStats.responseTime}` },
            { icon: <Icon name="hand-thumb-up" className="w-5 h-5" />, label: `${publicStats.satisfactionRate}% reussite`, sub: 'Sur toutes les commandes' },
          ].map((badge, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm min-w-[180px] flex-1">
              <div className="p-2 bg-blue-50 rounded-lg text-brand-blue shrink-0">{badge.icon}</div>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{badge.label}</p>
                <p className="text-xs text-slate-500">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {presentationVideoUrl && (
          <section className="bg-white rounded-2xl border border-slate-100 p-6" data-testid="partner-presentation-video">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
              <Icon name="play" className="w-5 h-5 text-[#0B5FFF]" />Video de presentation
            </h2>
            <PartnerPresentationVideo videoUrl={presentationVideoUrl} partnerName={partner.name} />
          </section>
        )}

        <PartnerServiceShopSection
          partnerName={partner.name}
          services={displayServices}
          loading={isLoadingServices}
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

        {/* ─── Public Statistics (6 cards) ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Icon name="chartBar" className="w-5 h-5 text-[#0B5FFF]" />Statistiques publiques
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="shoppingBag" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.totalOrders.toLocaleString('fr-FR')}</div>
                <div className="text-xs text-slate-500">Commandes realisees</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="heart" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.satisfactionRate}%</div>
                <div className="text-xs text-slate-500">Satisfaction clients</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="clock" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.avgDeliveryHours}h</div>
                <div className="text-xs text-slate-500">Delai moyen</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="shield-check" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.disputeRate}%</div>
                <div className="text-xs text-slate-500">Taux de litige</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="calendar" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.memberSince}</div>
                <div className="text-xs text-slate-500">Membre depuis</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-xl">
              <div className="p-2.5 bg-blue-50 rounded-lg text-brand-blue"><Icon name="chatBubble" className="w-5 h-5" /></div>
              <div>
                <div className="text-xl font-extrabold text-[#0F172A]">{publicStats.responseTime}</div>
                <div className="text-xs text-slate-500">Temps de reponse</div>
              </div>
            </div>
          </div>
        </section>

        {servicesError && (
          <div className="bg-white rounded-2xl border border-orange-100 p-4 text-sm text-orange-700">
            {servicesError}
          </div>
        )}

        {/* ─── Comparison (horizontal table like PartnerDetailPage) ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Icon name="chartBar" className="w-5 h-5 text-[#0B5FFF]" />Comparer avec d'autres pressings proches
          </h2>
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
                {[
                  { name: partner.name, rating: partner.rating.toFixed(1), reviews: partner.reviewCount, price: '2 $/kg', time: `${publicStats.avgDeliveryHours}h`, distance: '0 km', delivery: 'Gratuite', verified: true },
                  { name: 'CleanCare Pro', rating: '4.2', reviews: 89, price: '3 $/kg', time: '36h', distance: '1.2 km', delivery: '1 $', verified: false },
                  { name: 'Netto Plus', rating: '4.5', reviews: 156, price: '2.5 $/kg', time: '48h', distance: '2.5 km', delivery: '1.5 $', verified: true },
                ].map((row, i) => (
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

        {/* ─── Coverage Zone ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Icon name="mapPin" className="w-5 h-5 text-[#0B5FFF]" />Zone de livraison
          </h2>
          <MapPlaceholder lat={partner.coordinates?.lat} lng={partner.coordinates?.lng} />
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

        {/* ─── Reviews ─── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Icon name="star" className="w-5 h-5 text-[#0B5FFF]" />Avis verifies
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-[#0F172A]">{partner.rating}</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="star" className={`w-4 h-4 ${i < Math.round(partner.rating) ? 'text-yellow-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <span className="text-sm text-slate-500">{partner.reviewCount} avis</span>
            </div>
          </div>
          {reviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(showAllReviews ? reviews : reviews.slice(0, 4)).map(r => (
                  <ReviewCard key={r.id} review={r} getUserById={getUserById} />
                ))}
              </div>
              {reviews.length > 4 && (
                <button onClick={() => setShowAllReviews(!showAllReviews)} className="mt-4 w-full py-3 text-sm font-bold text-[#0B5FFF] border border-[#0B5FFF]/20 rounded-xl hover:bg-[#0B5FFF]/5 transition">
                  {showAllReviews ? 'Voir moins' : `Voir les ${reviews.length} avis`}
                </button>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Icon name="star" className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Aucun avis pour le moment</p>
              <p className="text-sm text-slate-400">Soyez le premier a noter cet etablissement.</p>
            </div>
          )}
        </section>

        {/* ─── Short About ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-3 flex items-center gap-2">
            <Icon name="building" className="w-5 h-5 text-[#0B5FFF]" />Presentation
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Depuis {publicStats.memberSince}, {partner.name} accompagne les particuliers et entreprises de {partner.address.split(',')[0] || 'Kinshasa'} avec des services professionnels de lavage, repassage et nettoyage a sec. Notre equipe qualifiee utilise des equipements modernes pour garantir la meilleure qualite a chaque commande.
          </p>
        </section>

        {/* ─── FAQ ─── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
            <Icon name="question-mark-circle" className="w-5 h-5 text-[#0B5FFF]" />Questions frequentes
          </h2>
          <div className="space-y-2">
            {partnerFaq.map((item, i) => (
              <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8FAFC] transition">
                  <span className="font-semibold text-sm text-[#0F172A]">{item.q}</span>
                  <Icon name={openFaq === i ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-slate-600">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Sticky CTA Card (desktop sidebar emulation) — Simplified ─── */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 p-6 shadow-lg">
          <div className="p-4 bg-[#F8FAFC] rounded-xl mb-5">
            <p className="text-xs text-slate-500 mb-1">Prix estime</p>
            <p className="text-3xl font-extrabold text-[#0F172A]">A partir de 2 $</p>
            <p className="text-xs text-slate-400 mt-1">Le prix final depend de votre commande.</p>
          </div>
          <div className="space-y-2 text-sm text-slate-600 mb-5">
            <div className="flex items-center gap-2"><Icon name="clock" className="w-4 h-4 text-slate-400" />Temps estime : {publicStats.avgDeliveryHours}h</div>
            <div className="flex items-center gap-2"><Icon name="badge-check" className="w-4 h-4 text-[#22C55E]" />Disponible aujourd'hui</div>
          </div>
          <a href={`https://laundry.app/partner/${partner.slug}`} className="block w-full py-3.5 bg-[#0B5FFF] text-white text-center font-bold rounded-xl hover:bg-[#002B7F] transition shadow-lg shadow-[#0B5FFF]/20 mb-3">
            Commander maintenant
          </a>
          <div className="mt-4 flex items-center gap-2">
            <Icon name="shield-check" className="w-4 h-4 text-[#22C55E]" />
            <span className="text-xs text-slate-500">Paiement 100% securise</span>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="font-bold text-lg">{partner.name}</h3>
              <p className="text-white/70 text-sm mt-1">{partner.address}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/80">
              <span>Propulse par</span>
              <a href="https://laundry.app" className="font-bold text-white hover:underline">Laundry Express RDC</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-white/50">
            &copy; {new Date().getFullYear()} {partner.name}. Tous droits reserves.
          </div>
        </div>
      </footer>

      {/* Mobile bottom spacer */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

