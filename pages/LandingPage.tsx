import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useAppContext } from '../context/AppContext';
import { realApi } from '../services/real-api';
import { Advertisement, Partner, Review, Service } from '../types';
import { trackEvent } from '../utils/tracking';

interface LandingPageProps {
  setCurrentPage: (page: { name: string; params?: Record<string, any> }) => void;
}

type EstimateLine = {
  id: string;
  label: string;
  price: number;
};

const COMMUNES = ['Gombe', 'Ngaliema', 'Limete', 'Kintambo', 'Bandalungwa', 'Matete', 'Masina'];
const pageBand = 'bg-surface-muted text-content-primary';
const cardClass = 'border border-surface-border-subtle bg-surface-card shadow-card';

const serviceAccent = (index: number) =>
  [
    { bg: 'from-blue-500/10 to-surface-card', text: '#005bd8', icon: 'wash' },
    { bg: 'from-violet-500/10 to-surface-card', text: '#6b4ce6', icon: 'sparkles' },
    { bg: 'from-orange-500/10 to-surface-card', text: '#f97316', icon: 'shoppingBag' },
  ][index % 3];

const getCommune = (address?: string) => {
  if (!address) return 'Kinshasa';
  const match = COMMUNES.find((commune) => address.toLowerCase().includes(commune.toLowerCase()));
  return match || address.split(',').map((part) => part.trim()).filter(Boolean).at(-1) || 'Kinshasa';
};

const servicePriceLabel = (service: Service, formatPrice: (price: number) => string) => {
  const price = service.price || service.articleCategories?.flatMap((cat) => cat.items).find((item) => item.price > 0)?.price || 0;
  if (!price) return 'Tarif disponible chez le partenaire';
  return `A partir de ${formatPrice(price)}${service.priceModel === 'per_kg' ? '/kg' : '/article'}`;
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    Object.entries(attrs).forEach(([key, value]) => {
      if (key !== 'content') element?.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }
  if (attrs.content) element.setAttribute('content', attrs.content);
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card/80 p-8 text-center">
    <Icon name="cloud" className="mx-auto h-10 w-10 text-[#005bd8]" />
    <h3 className="mt-4 font-black text-content-primary">{title}</h3>
    <p className="mt-2 text-sm text-content-muted">{description}</p>
  </div>
);

const SectionHeading: React.FC<{ title: string; subtitle?: string; light?: boolean }> = ({ title, subtitle, light }) => (
  <div className="mx-auto mb-6 max-w-3xl text-center sm:mb-8">
    <h2 className={`text-2xl font-black tracking-normal sm:text-3xl md:text-4xl ${light ? 'text-white' : 'text-content-primary'}`}>{title}</h2>
    {subtitle && <p className={`mt-3 text-base md:text-lg ${light ? 'text-white/75' : 'text-content-muted'}`}>{subtitle}</p>}
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ setCurrentPage }) => {
  const {
    isLoading,
    services,
    partners,
    logisticsPartners,
    reviews,
    promoCodes,
    advertisements,
    siteContent,
    formatPrice,
    setActivePartnerId,
  } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [estimateQty, setEstimateQty] = useState<Record<string, number>>({});
  const [openFaq, setOpenFaq] = useState<string | null>(siteContent.faq?.[0]?.id || null);
  const [socialProofCount, setSocialProofCount] = useState(0);

  useEffect(() => {
    document.title = 'Laundry Express RDC | Lessive, Nettoyage a Sec et Livraison a Domicile';
    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: 'Commandez votre lessive, nettoyage a sec ou cordonnerie a Kinshasa avec ramassage et livraison a domicile.',
    });
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: 'Laundry Express RDC | Services de nettoyage livres a domicile',
    });
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: 'Marketplace de lessive, nettoyage a sec et cordonnerie avec partenaires verifies a Kinshasa.',
    });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    const schemaId = 'landing-schema';
    document.getElementById(schemaId)?.remove();
    const schema = document.createElement('script');
    schema.id = schemaId;
    schema.type = 'application/ld+json';
    schema.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Laundry Express RDC',
      areaServed: 'Kinshasa, RDC',
      url: window.location.origin,
      serviceType: services.map((service) => service.title),
      aggregateRating: reviews.length
        ? { '@type': 'AggregateRating', ratingValue: averageRating(reviews), reviewCount: reviews.length }
        : undefined,
    });
    document.head.appendChild(schema);
    trackEvent('home_view', { source: 'public_homepage' });
  }, [reviews, services]);

  useEffect(() => {
    let cancelled = false;
    realApi
      .getPublicOrderSocialProof(30)
      .then((orders) => {
        if (!cancelled) setSocialProofCount(orders.length);
      })
      .catch(() => {
        if (!cancelled) setSocialProofCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAdvertisements = useMemo(
    () => advertisements.filter((advertisement) => advertisement.isActive).slice(0, 4),
    [advertisements]
  );

  const featuredPartners = useMemo(
    () => partners.filter((partner) => partner.isFeatured).sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 6),
    [partners]
  );

  const sponsoredPartners = useMemo(() => {
    const promotedPartnerIds = new Set(promoCodes.filter((promo) => promo.isActive && promo.partnerId).map((promo) => promo.partnerId));
    return partners
      .filter((partner) => promotedPartnerIds.has(partner.id) || partner.enabledFeatures?.promotions)
      .sort((a, b) => Number(promotedPartnerIds.has(b.id)) - Number(promotedPartnerIds.has(a.id)) || b.rating - a.rating)
      .slice(0, 6);
  }, [partners, promoCodes]);

  const popularPartners = useMemo(
    () =>
      [...partners]
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 6),
    [partners]
  );

  const rankedPartners = useMemo(() => [...partners].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 10), [partners]);

  const featuredReviews = useMemo(() => reviews.filter((review) => review.rating >= 4 && review.comment).slice(0, 6), [reviews]);

  const activePromotion = useMemo(() => {
    const ad = advertisements.find((item) => item.isActive);
    if (ad) return { title: ad.title, description: ad.description, imageUrl: ad.imageUrl, code: '' };
    const promo = promoCodes.find((item) => item.isActive);
    if (promo) {
      return {
        title: `${promo.discountType === 'percentage' ? promo.discountValue + '%' : formatPrice(promo.discountValue)} de reduction`,
        description: promo.description || 'Offre disponible sur Laundry Express.',
        imageUrl: '',
        code: promo.code,
      };
    }
    return null;
  }, [advertisements, promoCodes, formatPrice]);

  const estimateItems = useMemo<EstimateLine[]>(() => {
    const articleItems = services
      .flatMap((service) => service.articleCategories?.flatMap((category) => category.items) || [])
      .filter((item) => item.price > 0)
      .slice(0, 6)
      .map((item) => ({ id: item.id, label: item.name, price: item.price }));

    if (articleItems.length) return articleItems;
    return services
      .filter((service) => service.price && service.price > 0)
      .slice(0, 6)
      .map((service) => ({ id: service.id, label: service.title, price: service.price || 0 }));
  }, [services]);

  const subtotal = estimateItems.reduce((sum, item) => sum + (estimateQty[item.id] || 0) * item.price, 0);
  const delivery = subtotal > 0 ? 2 : 0;
  const total = subtotal + delivery;
  const coveredCommunes = useMemo(() => {
    const values = Array.from(new Set(partners.map((partner) => getCommune(partner.address)).filter(Boolean)));
    return values.length ? values : COMMUNES;
  }, [partners]);

  const activityStats = [
    { label: 'Satisfaction client', value: '97%', icon: 'hand-thumb-up' },
    { label: 'Livraisons reussies', value: '99%', icon: 'truck' },
    { label: 'Temps de ramassage', value: '22 min', icon: 'clock' },
    { label: 'Note moyenne', value: reviews.length ? `${averageRating(reviews)}/5` : '4.8/5', icon: 'star' },
  ];

  const marketplaceStats = [
    { value: `${Math.max(2500, reviews.length * 18)}+`, label: 'Clients satisfaits' },
    { value: `${Math.max(15000, partners.reduce((sum, partner) => sum + partner.reviewCount, 0) * 8)}+`, label: 'Articles traites' },
    { value: '99%', label: 'Livraisons reussies' },
    { value: reviews.length ? `${averageRating(reviews)}/5` : '4.8/5', label: 'Note moyenne' },
  ];

  const startOrder = (source: string) => {
    trackEvent('order_started', { source });
    setCurrentPage({ name: 'order' });
  };

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    trackEvent('service_selected', { service_id: serviceId });
  };

  const viewPartner = (partner: Partner) => {
    setActivePartnerId(partner.id);
    trackEvent('partner_clicked', { partner_id: partner.id, partner_name: partner.name });
    setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } });
  };

  const updateEstimate = (id: string, delta: number) => {
    setEstimateQty((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    trackEvent('estimate_used', { item_id: id });
  };

  const search = () => {
    trackEvent('search_started', { service_id: selectedServiceId, commune: selectedCommune });
    startOrder('hero_search');
  };

  return (
    <div className="min-h-screen overflow-hidden bg-surface-page text-content-primary">
      <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3" aria-label="Accueil Laundry Express">
            <Icon name="logo" className="h-9 w-9 text-[#005bd8]" />
            <span className="text-base font-black sm:text-xl">Laundry Express</span>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-bold text-content-muted lg:flex">
            <a href="#home">Accueil</a>
            <button onClick={() => setCurrentPage({ name: 'tracking' })}>Suivre ma commande</button>
            <button onClick={() => setCurrentPage({ name: 'become-partner' })}>Devenir partenaire</button>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <select aria-label="Langue" className="rounded-full border border-surface-border bg-surface-muted px-3 py-2 text-sm font-bold text-content-primary">
              <option>Francais</option>
              <option>English</option>
            </select>
            <ThemeSwitcher />
            <button onClick={() => setCurrentPage({ name: 'login' })} className="font-bold text-content-primary">Connexion</button>
            <button onClick={() => setCurrentPage({ name: 'register' })} className="rounded-full bg-[#005bd8] px-5 py-2.5 font-black text-white">Inscription</button>
          </div>
          <button onClick={() => setMenuOpen((value) => !value)} className="rounded-xl p-2 lg:hidden" aria-label="Menu">
            <Icon name={menuOpen ? 'xmark' : 'bars3'} className="h-6 w-6" />
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-surface-border bg-surface-card px-4 py-4 lg:hidden">
            <div className="flex gap-2 mb-3">
              <button onClick={() => { setMenuOpen(false); setCurrentPage({ name: 'login' }); }} className="flex-1 rounded-xl border-2 border-[#005bd8] py-3 text-sm font-bold text-[#005bd8]">
                Connexion
              </button>
              <button onClick={() => { setMenuOpen(false); setCurrentPage({ name: 'register' }); }} className="flex-1 rounded-xl bg-[#005bd8] py-3 text-sm font-bold text-white">
                Inscription
              </button>
            </div>
            <hr className="mb-2 border-surface-border"/>
            {['Accueil', 'Suivre ma commande', 'Devenir partenaire', 'FAQ'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMenuOpen(false);
                  if (item === 'Accueil') window.scrollTo({ top: 0, behavior: 'smooth' });
                  if (item === 'Suivre ma commande') setCurrentPage({ name: 'tracking' });
                  if (item === 'Devenir partenaire') setCurrentPage({ name: 'become-partner' });
                  if (item === 'FAQ') document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block w-full py-3 text-left font-bold"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      <main id="home">
        <section className="relative overflow-hidden bg-gradient-to-br from-surface-card via-surface-muted to-surface-page">
          <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-[#005bd8]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#ff7a00]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-16">
          <div className="min-w-0">
            <h1 className="text-3xl font-black leading-tight tracking-normal min-[380px]:text-4xl md:text-6xl">
              Commandez. <span className="text-[#005bd8]">Suivez.</span> Recevez.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-content-muted sm:text-lg sm:leading-8">
              La premiere plateforme de nettoyage suivie en temps reel a Kinshasa. Lessive, pressing et cordonnerie livres a votre porte.
            </p>
            <div className={`mt-6 rounded-3xl p-3 ${cardClass}`}>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={selectedServiceId} onChange={(event) => selectService(event.target.value)} className="min-w-0 rounded-2xl border border-surface-border bg-surface-card px-4 py-4 font-bold text-content-primary outline-none focus:ring-4 focus:ring-blue-500/30">
                  <option value="">Quel service recherchez-vous ?</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.title}</option>
                  ))}
                </select>
                <select value={selectedCommune} onChange={(event) => setSelectedCommune(event.target.value)} className="min-w-0 rounded-2xl border border-surface-border bg-surface-card px-4 py-4 font-bold text-content-primary outline-none focus:ring-4 focus:ring-blue-500/30">
                  <option value="">Commune</option>
                  {coveredCommunes.map((commune) => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                </select>
                <button onClick={search} className="min-h-[48px] rounded-2xl bg-[#005bd8] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#005bd8]/25 sm:px-8 sm:py-4 sm:text-base">Rechercher</button>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => startOrder('hero_primary')} className="min-h-[48px] rounded-2xl bg-[#005bd8] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#005bd8]/25 sm:px-8 sm:py-4 sm:text-base">Commander maintenant</button>
              <a href="#partners" className="min-h-[48px] rounded-2xl border border-surface-border bg-surface-card px-6 py-3 text-center text-sm font-black text-content-primary shadow-sm sm:px-8 sm:py-4 sm:text-base">Voir les partenaires</a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-content-muted">
              {[
                ['credit-card', 'Paiement securise'],
                ['clock-history', 'Suivi temps reel'],
                ['badge-check', 'Partenaires verifies'],
                ['lifebuoy', 'Reclamations protegees'],
              ].map(([icon, label], index) => (
                <React.Fragment key={label}>
                  {index > 0 && <span className="hidden text-surface-border sm:inline">|</span>}
                  <span className="flex items-center gap-1.5"><Icon name={icon as any} className="h-3.5 w-3.5 text-[#005bd8]" />{label}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
          <img src="/partner-hero-illustration.svg" alt="Pressing, chauffeur et commande mobile Laundry Express" className="w-full drop-shadow-2xl" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className={`grid gap-3 rounded-3xl p-4 md:grid-cols-4 ${cardClass}`}>
            {activityStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-2xl bg-surface-muted p-4 sm:gap-4 sm:p-5">
                <Icon name={stat.icon as any} className="h-8 w-8 text-[#005bd8]" />
                <div>
                  <p className="text-xl font-black text-[#005bd8] sm:text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-sm font-bold text-content-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto max-w-7xl">
          <SectionHeading title="Nos services" subtitle="Choisissez un service, comparez les partenaires et planifiez votre ramassage." />
          {isLoading ? (
            <SkeletonGrid />
          ) : services.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {services.slice(0, 3).map((service, index) => {
                const accent = serviceAccent(index);
                return (
                  <article key={service.id} className={`overflow-hidden rounded-3xl border border-surface-border-subtle bg-gradient-to-br ${accent.bg} p-5 shadow-card`}>
                    {service.imageUrl ? <img src={service.imageUrl} alt={service.title} loading="lazy" className="h-44 w-full rounded-2xl object-cover" /> : <div className="flex h-44 items-center justify-center rounded-2xl bg-surface-card"><Icon name={accent.icon as any} className="h-12 w-12" style={{ color: accent.text }} /></div>}
                    <h3 className="mt-5 text-2xl font-black">{service.title}</h3>
                    <p className="mt-2 min-h-[52px] text-sm leading-6 text-content-muted">{service.description}</p>
                    <p className="mt-4 font-black" style={{ color: accent.text }}>{servicePriceLabel(service, formatPrice)}</p>
                    <p className="mt-1 text-sm font-bold text-content-muted">Temps moyen selon partenaire</p>
                    <button onClick={() => startOrder(`service_${service.id}`)} className="mt-5 w-full rounded-2xl bg-[#005bd8] py-3 font-black text-white">Commander</button>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Services indisponibles" description="Les services publies depuis le backend apparaitront ici." />
          )}
          </div>
        </section>

        <section id="partners" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
          <SectionHeading title="Estimez votre commande" subtitle="Calculez le cout de votre nettoyage en quelques clics." />
          {estimateItems.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                {estimateItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-surface-border-subtle bg-surface-card p-4 shadow-sm min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                    <div className="min-w-0">
                      <p className="font-black">{item.label}</p>
                      <p className="text-sm text-content-muted">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 min-[380px]:justify-end">
                      <button onClick={() => updateEstimate(item.id, -1)} className="rounded-full border border-surface-border-subtle bg-surface-card p-2"><Icon name="minus" className="h-4 w-4" /></button>
                      <span className="w-6 text-center font-black">{estimateQty[item.id] || 0}</span>
                      <button onClick={() => updateEstimate(item.id, 1)} className="rounded-full bg-[#005bd8] p-2 text-white"><Icon name="plus" className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-card">
                <h3 className="text-xl font-black">Recapitulatif</h3>
                <div className="mt-5 space-y-2">
                  <SummaryLine label="Sous-total" value={formatPrice(subtotal)} />
                  <SummaryLine label="Livraison" value={formatPrice(delivery)} />
                  <SummaryLine label="Total" value={formatPrice(total)} strong />
                </div>
                <button onClick={() => startOrder('estimate')} className="mt-6 w-full rounded-2xl bg-[#005bd8] py-4 font-black text-white shadow-lg shadow-[#005bd8]/25">Commander maintenant</button>
                <div className="mt-4 grid grid-cols-1 gap-3 text-center text-xs font-bold text-content-muted min-[380px]:grid-cols-2">
                  <span className="rounded-xl bg-surface-muted p-2">Paiement securise</span>
                  <span className="rounded-xl bg-surface-muted p-2">Suivi en temps reel</span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Estimateur en attente" description="Ajoutez des articles/prix aux services backend pour activer le calcul." />
          )}
          </div>
        </section>

        <section id="partners-grid" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading title="Publicites et offres en cours" subtitle="Campagnes actives publiees depuis le backend." />
          {activeAdvertisements.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {activeAdvertisements.map((advertisement) => (
                <AdvertisementCard
                  key={advertisement.id}
                  advertisement={advertisement}
                  onClick={() => {
                    trackEvent('promotion_clicked', { advertisement_id: advertisement.id });
                    if (advertisement.linkUrl) window.open(advertisement.linkUrl, '_blank', 'noopener,noreferrer');
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune publicite active" description="Les bannieres publicitaires activees depuis le backend apparaitront ici." />
          )}
        </section>

        <section className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto max-w-7xl">
          <SectionHeading title="Partenaires recommandes" subtitle="Les etablissements notes et selectionnes par nos clients." />
          {(featuredPartners.length || popularPartners.length) ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[...featuredPartners, ...popularPartners.filter((p) => !featuredPartners.find((f) => f.id === p.id))].slice(0, 6).map((partner, index) => <PartnerCard key={partner.id} partner={partner} rank={index + 1} badge={featuredPartners.find((f) => f.id === partner.id) ? 'Selectionne' : 'Populaire'} tone={index % 2 === 0 ? 'green' : 'blue'} onView={() => viewPartner(partner)} onOrder={() => startOrder(`recommanded_partner_${partner.id}`)} />)}
            </div>
          ) : (
            <EmptyState title="Aucun partenaire recommande" description="Les partenaires les mieux notes apparaitront ici." />
          )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Partenaires sponsorises" subtitle="Partenaires avec promotions ou campagnes actives." />
          {sponsoredPartners.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {sponsoredPartners.map((partner, index) => <PartnerCard key={partner.id} partner={partner} rank={index + 1} badge="Sponsorise" tone="orange" onView={() => viewPartner(partner)} onOrder={() => startOrder(`sponsored_partner_${partner.id}`)} />)}
            </div>
          ) : (
            <EmptyState title="Aucun partenaire sponsorise" description="Les partenaires avec promotions actives apparaitront ici." />
          )}
        </section>

        {activePromotion && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06105f] via-[#003b9a] to-[#ff7a00] p-6 text-white shadow-2xl shadow-[#06105f]/20 md:grid-cols-[1fr_auto] md:p-10">
              <div>
                <p className="text-sm font-black uppercase text-[#9bc8ff]">Promotion</p>
                <h2 className="mt-2 text-3xl font-black">{activePromotion.title}</h2>
                <p className="mt-2 text-white/75">{activePromotion.description}</p>
                {activePromotion.code && <p className="mt-4 inline-flex rounded-full bg-surface-card px-4 py-2 font-black text-content-primary">Code: {activePromotion.code}</p>}
              </div>
              <button onClick={() => { trackEvent('promotion_clicked', { code: activePromotion.code }); startOrder('promotion'); }} className="rounded-2xl bg-surface-card px-8 py-4 font-black text-content-primary">Commander maintenant</button>
            </div>
          </section>
        )}

        <section className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto max-w-7xl">
          <SectionHeading title="Comment ca marche" subtitle="De la commande a la livraison, chaque etape est securisee." />
          <div className="grid gap-5 md:grid-cols-5">
            {[
              ['shoppingBag', 'Commandez'],
              ['user', 'Ramassage'],
              ['sparkles', 'Nettoyage'],
              ['truck', 'Livraison'],
              ['hand-thumb-up', 'Avis'],
            ].map(([icon, step], index) => (
              <div key={step} className="rounded-3xl border border-surface-border-subtle bg-surface-card p-5 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#005bd8]">
                  <Icon name={icon as any} className="h-6 w-6 text-white" />
                </div>
                <p className="mt-4 font-black">{step}</p>
                <p className="mt-1 text-xs font-bold text-content-muted">{index < 4 ? 'Etape ' + (index + 1) : 'Termine'}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Pourquoi Laundry Express est different" subtitle="Pas simplement un annuaire. Une plateforme operationnelle de confiance." />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['shoppingBag', 'Commande en 2 clics', 'Choisissez votre service, selectionnez un partenaire et planifiez le ramassage.'],
              ['credit-card', 'Paiement securise', 'Payez en toute confiance. Vos donnees sont protegees et votre argent est en securite.'],
              ['clock-history', 'Suivi en temps reel', 'Chaque etape de votre commande est visible : ramassage, nettoyage, livraison.'],
              ['document-text', 'Preuves de remise', 'Photo et confirmation a chaque etape. Aucune ambiguite sur l\'etat de vos articles.'],
              ['lifebuoy', 'Support centralise', 'Une seule plateforme pour toutes vos reclamations. Reponse garantie sous 24h.'],
              ['badge-check', 'Avis verifies', 'Seuls les clients reels peuvent laisser un avis. Aucun faux temoignage.'],
            ].map(([icon, title, description]) => (
              <div key={title} className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005bd8]/10">
                  <Icon name={icon as any} className="h-6 w-6 text-[#005bd8]" />
                </div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-content-muted">{description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-3xl bg-gradient-to-r from-[#06105f] via-[#003b9a] to-[#005bd8] p-5 text-center text-white shadow-2xl sm:p-6 md:p-10">
            <p className="text-base font-black sm:text-lg">Le corridor complet : Commander &rarr; Payer &rarr; Suivre &rarr; Preuves &rarr; Support &rarr; Avis</p>
            <p className="mt-2 text-white/75">C\'est cette histoire qui cree la confiance. Pas simplement trouver un pressing.</p>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#005bd8] via-[#006dff] to-[#004bb5] py-10 text-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 text-center sm:px-6 md:grid-cols-3 lg:px-8">
            <div><p className="text-3xl font-black sm:text-4xl">97%</p><p className="text-white/75">reviennent commander</p></div>
            <div><p className="text-3xl font-black sm:text-4xl">99%</p><p className="text-white/75">livraisons reussies</p></div>
            <div><p className="text-3xl font-black sm:text-4xl">{reviews.length ? `${averageRating(reviews)}/5` : '4.8/5'}</p><p className="text-white/75">note moyenne clients</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading title="Preuve operationnelle" subtitle="Voici a quoi ressemble une commande reelle." />
            <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-surface-border-subtle bg-surface-card shadow-card">
              <div className="flex items-center justify-between border-b border-surface-border-subtle px-6 py-4">
                <div>
                  <p className="text-xs font-bold uppercase text-content-muted">Commande reelle</p>
                  <p className="text-lg font-black">#LE-8452</p>
                </div>
                <span className="rounded-full bg-[#00a884]/15 px-3 py-1 text-xs font-black text-[#00a884]">Terminee</span>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-3">
                  {[
                    ['09:10', 'Commande recue'],
                    ['10:15', 'Ramassage effectue'],
                    ['14:30', 'Nettoyage termine'],
                    ['15:00', 'Controle qualite OK'],
                    ['18:05', 'Livree au client'],
                  ].map(([time, step], index) => (
                    <div key={`${step}-${index}`} className="flex items-center gap-3">
                      <span className="w-12 text-right text-xs font-bold text-content-muted">{time}</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#005bd8]">
                        <Icon name="check" className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-content-muted">Total paye</p>
                    <p className="text-lg font-black text-[#005bd8]">$ 14.50</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-content-muted">Delai total</p>
                    <p className="text-lg font-black">8h 55min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <SectionHeading title="Commande protegee de bout en bout" subtitle="Chaque etape est verify, tracee et protegee." />
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['credit-card', 'Paiement confirme', 'Transaction securisee et verifies'],
                ['user', 'Ramassage verifie', 'Le partenaire confirme la prise en charge'],
                ['sparkles', 'Nettoyage suivi', 'Chaque operation est traccee'],
                ['truck', 'Livraison confirmee', 'Preuve de remise a chaque livraison'],
                ['document-text', 'Historique conserve', 'Toutes vos commandes sont archivees'],
                ['badge-check', 'Avis authentique', 'Seuls les clients reels peuvent commenter'],
              ].map(([icon, title, description]) => (
                <div key={title} className="flex items-start gap-3 rounded-2xl border border-surface-border-subtle bg-surface-card p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#005bd8]/10">
                    <Icon name={icon as any} className="h-4 w-4 text-[#005bd8]" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{title}</p>
                    <p className="mt-0.5 text-xs text-content-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>

        <section className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6">
            <h2 className="text-2xl font-black">Les meilleurs partenaires de Kinshasa</h2>
            {rankedPartners.length ? (
              <div className="mt-5 space-y-3">
                {rankedPartners.map((partner, index) => (
                  <button
                    key={partner.id}
                    onClick={() => viewPartner(partner)}
                    className="grid w-full min-w-0 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-2xl bg-surface-muted p-4 text-left sm:grid-cols-[auto_1fr_auto] sm:gap-x-4"
                  >
                    <span className="row-span-2 rounded-full bg-[#005bd8] px-3 py-1 text-sm font-black text-white sm:row-span-1">
                      #{index + 1}
                    </span>
                    <span className="min-w-0 text-base font-black leading-snug text-content-primary">
                      {partner.name}
                    </span>
                    <span className="col-start-2 text-sm font-bold text-content-muted sm:col-start-auto">
                      {partner.rating.toFixed(1)} · {getCommune(partner.address)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="Classement indisponible" description="Les partenaires notes apparaitront ici." />
            )}
          </div>
          <div className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6">
            <h2 className="text-2xl font-black">Partenaires par commune</h2>
            <div className="mt-5 space-y-3">
              {coveredCommunes.map((commune) => {
                const count = partners.filter((partner) => getCommune(partner.address) === commune).length;
                const width = partners.length ? Math.max(12, Math.round((count / partners.length) * 100)) : 12;
                return (
                  <button key={commune} onClick={() => { setSelectedCommune(commune); search(); }} className="w-full text-left">
                    <div className="flex justify-between text-sm font-black"><span>{commune}</span><span>{count}</span></div>
                    <div className="mt-2 h-3 rounded-full bg-surface-muted"><div className="h-3 rounded-full bg-[#005bd8]" style={{ width: `${width}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Couverture geographique" subtitle="Zones couvertes, partenaires actifs et communes en preparation." />
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-surface-border-subtle bg-surface-muted p-6">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #005bd8 0, transparent 28%), radial-gradient(circle at 70% 55%, #00a884 0, transparent 24%)' }} />
            <div className="relative grid gap-4 md:grid-cols-4">
              {coveredCommunes.map((commune) => (
                <div key={commune} className="rounded-2xl bg-surface-card/90 p-4 font-black shadow-sm">
                  <Icon name="mapPin" className="mb-2 h-5 w-5 text-[#005bd8]" />
                  {commune}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading title="Votre commande en temps reel" subtitle="Chaque etape est visible, tracee et prouvee." />
            <div className="space-y-0">
              {[
                ['shoppingBag', 'Commande recue', 'Votre demande est enregistree', true],
                ['user', 'Ramassage programme', 'Le partenaire confirme le pickup', true],
                ['sparkles', 'Nettoyage en cours', 'Vos articles sont traites', true],
                ['badge-check', 'Controle qualite', 'Verification avant livraison', true],
                ['truck', 'En livraison', 'Le chauffeur est en chemin', false],
                ['home', 'Livré', 'Vos articles sont livres', false],
              ].map(([icon, title, description, done], index) => (
                <div key={`${title}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${done ? 'bg-[#005bd8] text-white' : 'border-2 border-surface-border bg-surface-card'}`}>
                      <Icon name={icon as any} className={`h-5 w-5 ${done ? 'text-white' : 'text-content-muted'}`} />
                    </div>
                    {index < 5 && <div className={`w-0.5 h-8 ${done ? 'bg-[#005bd8]' : 'bg-surface-border'}`} />}
                  </div>
                  <div className="pb-6">
                    <p className={`font-black ${done ? 'text-content-primary' : 'text-content-muted'}`}>{title}</p>
                    <p className="text-sm text-content-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-3xl bg-[#06105f] p-3 shadow-2xl sm:rounded-[2.5rem] sm:p-4">
            <div className="rounded-3xl bg-surface-card p-4 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-content-muted">Commande #LE-4821</p>
                <span className="rounded-full bg-[#00a884]/15 px-2 py-0.5 text-xs font-black text-[#00a884]">En cours</span>
              </div>
              <h3 className="mt-3 text-xl font-black">En livraison</h3>
              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                  <Icon name="check" className="h-5 w-5 rounded-full bg-[#005bd8] p-1 text-white" />
                  <span className="text-sm font-bold">Commande recue</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                  <Icon name="check" className="h-5 w-5 rounded-full bg-[#005bd8] p-1 text-white" />
                  <span className="text-sm font-bold">Ramassage effectue</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                  <Icon name="check" className="h-5 w-5 rounded-full bg-[#005bd8] p-1 text-white" />
                  <span className="text-sm font-bold">Nettoyage termine</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#005bd8]/10 p-3">
                  <div className="h-5 w-5 rounded-full bg-[#005bd8] p-1"><div className="h-full w-full animate-pulse rounded-full bg-white" /></div>
                  <span className="text-sm font-black text-[#005bd8]">En livraison...</span>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-surface-muted p-4">
                <p className="text-xs font-bold text-content-muted">Arrivee estimee</p>
                <p className="text-lg font-black text-[#005bd8]">22 min</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-xl bg-[#005bd8] py-3 text-sm font-black text-white">Appeler le chauffeur</button>
                <button className="rounded-xl border border-surface-border p-3"><Icon name="chatBubble" className="h-5 w-5 text-[#005bd8]" /></button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Ils nous font confiance" />
          {featuredReviews.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {featuredReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
            </div>
          ) : (
            <EmptyState title="Avis en attente" description="Les avis clients verifies apparaitront ici." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Partenaires verifies" subtitle={`${partners.length} partenaires approuves, ${coveredCommunes.length} quartiers couverts a Kinshasa.`} />
          {partners.length ? (
            <div className="grid gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
              {partners.slice(0, 12).map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => viewPartner(partner)}
                  className="flex min-h-[72px] w-full min-w-0 items-center gap-3 rounded-2xl border border-surface-border-subtle bg-surface-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card sm:p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-sm font-black text-[#005bd8]">
                    {partner.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-black leading-snug text-content-primary sm:text-base">
                    {partner.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="Logos partenaires indisponibles" description="Les partenaires approuves apparaitront automatiquement." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#06105f] via-[#003b9a] to-[#005bd8] p-6 text-white shadow-2xl shadow-[#06105f]/20 sm:p-8 md:p-12">
            <h2 className="text-2xl font-black sm:text-3xl">Vous possedez un pressing, une blanchisserie ou une flotte de livraison ?</h2>
            <p className="mt-3 max-w-2xl text-white/75">Rejoignez Laundry Express et recevez plus de commandes dans Kinshasa.</p>
            <button onClick={() => { trackEvent('become_partner_clicked', { source: 'home_cta' }); setCurrentPage({ name: 'become-partner' }); }} className="mt-6 w-full rounded-2xl bg-[#ff7a00] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#ff7a00]/25 sm:w-auto sm:px-8 sm:py-4 sm:text-base">Devenir partenaire</button>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="FAQ" />
          <div className="space-y-3">
            {siteContent.faq?.length ? siteContent.faq.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-surface-border-subtle bg-surface-card">
                <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="flex w-full items-center justify-between p-5 text-left font-black">
                  {faq.question}
                  <Icon name={openFaq === faq.id ? 'minus' : 'plus'} className="h-5 w-5" />
                </button>
                {openFaq === faq.id && <p className="px-5 pb-5 text-content-muted">{faq.answer}</p>}
              </div>
            )) : <EmptyState title="FAQ non configuree" description="Les questions/reponses du backend apparaitront ici." />}
          </div>
        </section>
      </main>

      <footer className="bg-[#06105f] py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-3"><Icon name="logo" className="h-9 w-9" /><span className="text-xl font-black">Laundry Express</span></div>
            <p className="mt-4 text-white/70">Votre linge, livre. La facon simple de faire votre lessive et nettoyage a sec en RDC.</p>
          </div>
          <FooterLinks title="Navigation" links={['Accueil', 'Passer commande', 'Suivre ma commande', 'FAQ']} onNavigate={setCurrentPage} />
          <FooterLinks title="Partenaires" links={['Devenir partenaire', 'Partenariat logistique']} onNavigate={setCurrentPage} />
          <div>
            <h3 className="font-black uppercase">Nous contacter</h3>
            <p className="mt-4 text-white/75">+243 81 234 5678</p>
            <p className="mt-2 text-white/75">contact@laundryexpress.cd</p>
            <p className="mt-2 text-white/75">Kinshasa, RDC</p>
            <div className="mt-5 flex gap-2"><span className="rounded-full bg-surface-card px-3 py-1 text-sm font-black text-content-primary">USD</span><span className="rounded-full bg-surface-card/10 px-3 py-1 text-sm font-black">CDF</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const averageRating = (reviews: Review[]) => {
  if (!reviews.length) return '4.8';
  return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
};

const SkeletonGrid = () => (
  <div className="grid gap-6 md:grid-cols-3">
    {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl bg-surface-muted" />)}
  </div>
);

const AdvertisementCard: React.FC<{ advertisement: Advertisement; onClick: () => void }> = ({ advertisement, onClick }) => (
  <article className="grid overflow-hidden rounded-3xl border border-orange-300/40 bg-gradient-to-br from-surface-card via-orange-500/5 to-orange-500/10 shadow-card md:grid-cols-[220px_1fr]">
    {advertisement.imageUrl ? (
      <img src={advertisement.imageUrl} alt={advertisement.title} loading="lazy" className="h-56 w-full object-cover md:h-full" />
    ) : (
      <div className="flex h-56 items-center justify-center bg-orange-500/10 md:h-full">
        <Icon name="gift" className="h-12 w-12 text-[#ff7a00]" />
      </div>
    )}
    <div className="p-6">
      <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black uppercase text-[#ff7a00]">Publicite</span>
      <h3 className="mt-4 text-2xl font-black text-content-primary">{advertisement.title}</h3>
      <p className="mt-2 text-sm leading-6 text-content-muted">{advertisement.description}</p>
      <button onClick={onClick} className="mt-5 rounded-2xl bg-[#ff7a00] px-6 py-3 font-black text-white shadow-lg shadow-[#ff7a00]/20">Voir l'offre</button>
    </div>
  </article>
);

const PartnerCard: React.FC<{ partner: Partner; rank: number; badge?: string; tone?: 'blue' | 'green' | 'orange'; onView: () => void; onOrder: () => void }> = ({ partner, rank, badge, tone = 'blue', onView, onOrder }) => {
  const palette = tone === 'orange'
    ? { border: 'border-orange-300/40', bg: 'bg-orange-500/10', badge: 'bg-orange-500/15 text-[#ff7a00]', cta: 'bg-[#ff7a00]', text: 'text-[#ff7a00]' }
    : tone === 'green'
      ? { border: 'border-emerald-300/40', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500/15 text-[#00a884]', cta: 'bg-[#00a884]', text: 'text-[#00a884]' }
      : { border: 'border-surface-border-subtle', bg: 'bg-surface-muted', badge: 'bg-surface-muted text-[#005bd8]', cta: 'bg-[#005bd8]', text: 'text-[#005bd8]' };
  return (
  <article className={`overflow-hidden rounded-3xl border bg-surface-card shadow-card ${palette.border}`}>
    {partner.imageUrls?.find(Boolean) ? <img src={partner.imageUrls.find(Boolean)} alt={partner.name} loading="lazy" className="h-44 w-full object-cover" /> : <div className={`flex h-44 items-center justify-center text-3xl font-black ${palette.bg} ${palette.text}`}>{partner.name.slice(0, 2).toUpperCase()}</div>}
    <div className="p-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${palette.badge}`}>{badge || (rank === 1 ? 'Populaire' : rank === 2 ? 'Livraison rapide' : 'Top qualite')}</span>
        <span className="font-black text-[#ffb703]">★ {partner.rating.toFixed(1)}</span>
      </div>
      <h3 className="mt-4 text-xl font-black">{partner.name}</h3>
      <p className="mt-1 text-sm text-content-muted">{partner.reviewCount} avis · {getCommune(partner.address)} · temps selon disponibilite</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onView} className={`rounded-xl border py-3 font-black ${palette.border} ${palette.text}`}>Voir profil</button>
        <button onClick={onOrder} className={`rounded-xl py-3 font-black text-white ${palette.cta}`}>Commander</button>
      </div>
    </div>
  </article>
  );
};

const SummaryLine: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex justify-between py-1 ${strong ? 'text-xl font-black text-[#005bd8]' : 'font-bold text-content-muted'}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <article className="rounded-3xl border border-surface-border-subtle bg-surface-card p-6 shadow-sm">
    <p className="text-[#ffb703]">{'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}</p>
    <p className="mt-4 text-content-muted">"{review.comment}"</p>
    <p className="mt-5 font-black text-content-primary">Client verifie</p>
  </article>
);

const FooterLinks: React.FC<{ title: string; links: string[]; onNavigate: LandingPageProps['setCurrentPage'] }> = ({ title, links, onNavigate }) => (
  <div>
    <h3 className="font-black uppercase">{title}</h3>
    <div className="mt-4 space-y-2">
      {links.map((link) => (
        <button
          key={link}
          onClick={() => {
            if (link === 'Passer commande') onNavigate({ name: 'order' });
            if (link === 'Suivre ma commande') onNavigate({ name: 'tracking' });
            if (link === 'Devenir partenaire') onNavigate({ name: 'become-partner' });
          }}
          className="block text-white/75 hover:text-white"
        >
          {link}
        </button>
      ))}
    </div>
  </div>
);
