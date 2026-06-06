import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
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
const pageBand = 'bg-gradient-to-b from-[#f8fbff] via-white to-[#f1f7ff]';
const cardClass = 'border border-[#d8e6fb] bg-white shadow-[0_18px_45px_rgba(0,91,216,0.08)]';

const serviceAccent = (index: number) =>
  [
    { bg: 'from-[#eaf4ff] to-white', text: '#005bd8', icon: 'wash' },
    { bg: 'from-[#f4efff] to-white', text: '#6b4ce6', icon: 'sparkles' },
    { bg: 'from-[#fff3e7] to-white', text: '#f97316', icon: 'shoppingBag' },
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
  <div className="rounded-2xl border border-dashed border-[#cfe1fb] bg-white/70 p-8 text-center">
    <Icon name="cloud" className="mx-auto h-10 w-10 text-[#005bd8]" />
    <h3 className="mt-4 font-black text-[#06105f]">{title}</h3>
    <p className="mt-2 text-sm text-[#52607f]">{description}</p>
  </div>
);

const SectionHeading: React.FC<{ title: string; subtitle?: string; light?: boolean }> = ({ title, subtitle, light }) => (
  <div className="mx-auto mb-8 max-w-3xl text-center">
    <h2 className={`text-3xl font-black tracking-normal md:text-4xl ${light ? 'text-white' : 'text-[#06105f]'}`}>{title}</h2>
    {subtitle && <p className={`mt-3 text-base md:text-lg ${light ? 'text-white/75' : 'text-[#52607f]'}`}>{subtitle}</p>}
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
    { label: 'partenaires actifs', value: partners.length },
    { label: 'chauffeurs disponibles', value: logisticsPartners.length },
    { label: 'commandes recentes', value: socialProofCount },
    { label: 'temps moyen de collecte', value: '22 min' },
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
    <div className="min-h-screen bg-[#f8fbff] text-[#06105f]">
      <header className="sticky top-0 z-50 border-b border-[#dbe7fb] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3" aria-label="Accueil Laundry Express">
            <Icon name="logo" className="h-9 w-9 text-[#005bd8]" />
            <span className="text-xl font-black">Laundry Express</span>
          </button>
          <nav className="hidden items-center gap-7 text-sm font-bold text-[#243056] lg:flex">
            <a href="#home">Accueil</a>
            <button onClick={() => setCurrentPage({ name: 'tracking' })}>Suivre ma commande</button>
            <button onClick={() => setCurrentPage({ name: 'become-partner' })}>Devenir partenaire</button>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <select aria-label="Langue" className="rounded-full border border-[#dbe7fb] bg-[#f7fbff] px-3 py-2 text-sm font-bold">
              <option>Francais</option>
              <option>English</option>
            </select>
            <button aria-label="Mode sombre" className="rounded-full p-2 text-[#06105f] hover:bg-[#eef6ff]">
              <Icon name="moon" className="h-5 w-5" />
            </button>
            <button onClick={() => setCurrentPage({ name: 'login' })} className="font-bold text-[#06105f]">Connexion</button>
            <button onClick={() => setCurrentPage({ name: 'register' })} className="rounded-full bg-[#005bd8] px-5 py-2.5 font-black text-white">Inscription</button>
          </div>
          <button onClick={() => setMenuOpen((value) => !value)} className="rounded-xl p-2 lg:hidden" aria-label="Menu">
            <Icon name={menuOpen ? 'xmark' : 'bars3'} className="h-6 w-6" />
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-[#dbe7fb] bg-white px-4 py-4 lg:hidden">
            {['Accueil', 'Suivre ma commande', 'Devenir partenaire', 'FAQ'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === 'Suivre ma commande') setCurrentPage({ name: 'tracking' });
                  if (item === 'Devenir partenaire') setCurrentPage({ name: 'become-partner' });
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
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-[#f2f8ff] to-[#e8f2ff]">
          <div className="absolute left-0 top-20 h-72 w-72 rounded-full bg-[#005bd8]/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#ff7a00]/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-16">
          <div>
            <h1 className="text-4xl font-black leading-tight tracking-normal md:text-6xl">
              Nettoyage a Sec, Lessive et Cordonnerie <span className="text-[#005bd8]">Livres a votre porte a Kinshasa</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52607f]">
              Reservez un ramassage a domicile en quelques minutes. Suivez votre commande en temps reel et recuperez vos vetements propres sans vous deplacer.
            </p>
            <div className={`mt-8 rounded-3xl p-3 ${cardClass}`}>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <select value={selectedServiceId} onChange={(event) => selectService(event.target.value)} className="rounded-2xl border border-[#dbe7fb] px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-[#dcecff]">
                  <option value="">Quel service recherchez-vous ?</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>{service.title}</option>
                  ))}
                </select>
                <select value={selectedCommune} onChange={(event) => setSelectedCommune(event.target.value)} className="rounded-2xl border border-[#dbe7fb] px-4 py-4 font-bold outline-none focus:ring-4 focus:ring-[#dcecff]">
                  <option value="">Commune</option>
                  {coveredCommunes.map((commune) => (
                    <option key={commune} value={commune}>{commune}</option>
                  ))}
                </select>
                <button onClick={search} className="rounded-2xl bg-[#005bd8] px-8 py-4 font-black text-white shadow-lg shadow-[#005bd8]/25">Rechercher</button>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => startOrder('hero_primary')} className="rounded-2xl bg-[#005bd8] px-8 py-4 font-black text-white shadow-lg shadow-[#005bd8]/25">Commander maintenant</button>
              <a href="#partners" className="rounded-2xl border border-[#a9c8f5] bg-white px-8 py-4 text-center font-black shadow-sm">Voir les partenaires</a>
            </div>
            <div className="mt-6 grid gap-3 text-sm font-bold text-[#52607f] sm:grid-cols-2">
              {['Paiement securise', 'Ramassage a domicile', 'Livraison rapide', 'Partenaires verifies'].map((badge) => (
                <span key={badge} className="flex items-center gap-2"><Icon name="check" className="h-5 w-5 rounded-full bg-[#dcecff] p-1 text-[#005bd8]" />{badge}</span>
              ))}
            </div>
          </div>
          <img src="/partner-hero-illustration.svg" alt="Pressing, chauffeur et commande mobile Laundry Express" className="w-full drop-shadow-2xl" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className={`grid gap-3 rounded-3xl p-4 md:grid-cols-4 ${cardClass}`}>
            {activityStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-[#f7fbff] p-5 text-center">
                <p className="text-2xl font-black text-[#005bd8]">{stat.value}</p>
                <p className="mt-1 text-sm font-bold text-[#52607f]">{stat.label}</p>
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
                  <article key={service.id} className={`overflow-hidden rounded-3xl border border-[#dbe7fb] bg-gradient-to-br ${accent.bg} p-5 shadow-lg shadow-[#dbe7fb]/60`}>
                    {service.imageUrl ? <img src={service.imageUrl} alt={service.title} loading="lazy" className="h-44 w-full rounded-2xl object-cover" /> : <div className="flex h-44 items-center justify-center rounded-2xl bg-white"><Icon name={accent.icon as any} className="h-12 w-12" style={{ color: accent.text }} /></div>}
                    <h3 className="mt-5 text-2xl font-black">{service.title}</h3>
                    <p className="mt-2 min-h-[52px] text-sm leading-6 text-[#52607f]">{service.description}</p>
                    <p className="mt-4 font-black" style={{ color: accent.text }}>{servicePriceLabel(service, formatPrice)}</p>
                    <p className="mt-1 text-sm font-bold text-[#52607f]">Temps moyen selon partenaire</p>
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
          <SectionHeading title="Partenaires mis en avant" subtitle="Les etablissements selectionnes par Laundry Express." />
          {featuredPartners.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {featuredPartners.map((partner, index) => <PartnerCard key={partner.id} partner={partner} rank={index + 1} badge="Mis en avant" tone="green" onView={() => viewPartner(partner)} onOrder={() => startOrder(`featured_partner_${partner.id}`)} />)}
            </div>
          ) : (
            <EmptyState title="Aucun partenaire mis en avant" description="Activez isFeatured sur les partenaires backend pour remplir cette section." />
          )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Partenaires sponsorises" subtitle="Partenaires avec promotions ou campagnes sponsorisees actives." />
          {sponsoredPartners.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {sponsoredPartners.map((partner, index) => <PartnerCard key={partner.id} partner={partner} rank={index + 1} badge="Sponsorise" tone="orange" onView={() => viewPartner(partner)} onOrder={() => startOrder(`sponsored_partner_${partner.id}`)} />)}
            </div>
          ) : (
            <EmptyState title="Aucun partenaire sponsorise" description="Les partenaires avec promotions actives ou module promotions apparaitront ici." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Les partenaires preferes de nos clients" subtitle="Classement par note et nombre d'avis clients." />
          {popularPartners.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {popularPartners.map((partner, index) => <PartnerCard key={partner.id} partner={partner} rank={index + 1} onView={() => viewPartner(partner)} onOrder={() => startOrder(`popular_partner_${partner.id}`)} />)}
            </div>
          ) : (
            <EmptyState title="Aucun partenaire publie" description="Les partenaires valides par le backend apparaitront ici." />
          )}
        </section>

        {activePromotion && (
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#06105f] via-[#003b9a] to-[#ff7a00] p-6 text-white shadow-2xl shadow-[#06105f]/20 md:grid-cols-[1fr_auto] md:p-10">
              <div>
                <p className="text-sm font-black uppercase text-[#9bc8ff]">Promotion</p>
                <h2 className="mt-2 text-3xl font-black">{activePromotion.title}</h2>
                <p className="mt-2 text-white/75">{activePromotion.description}</p>
                {activePromotion.code && <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-black text-[#06105f]">Code: {activePromotion.code}</p>}
              </div>
              <button onClick={() => { trackEvent('promotion_clicked', { code: activePromotion.code }); startOrder('promotion'); }} className="rounded-2xl bg-white px-8 py-4 font-black text-[#06105f]">Commander maintenant</button>
            </div>
          </section>
        )}

        <section className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto max-w-7xl">
          <SectionHeading title="Comment ca marche" />
          <div className="grid gap-5 md:grid-cols-5">
            {['Choisissez un service', 'Selectionnez un partenaire', 'Planifiez le ramassage', 'Suivez votre commande', 'Livraison a domicile'].map((step, index) => (
              <div key={step} className="rounded-3xl border border-[#dbe7fb] bg-white p-5 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#005bd8] font-black text-white">{index + 1}</div>
                <p className="mt-4 font-black">{step}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Pourquoi choisir Laundry Express" />
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-6">
            {[
              ['shield-check', 'Paiement securise'],
              ['home', 'Ramassage a domicile'],
              ['badge-check', 'Partenaires verifies'],
              ['clock-history', 'Suivi temps reel'],
              ['lifebuoy', 'Support 24/7'],
              ['hand-thumb-up', 'Satisfait ou rembourse'],
            ].map(([icon, label]) => (
              <div key={label} className="rounded-3xl bg-white p-5 text-center shadow-sm">
                <Icon name={icon as any} className="mx-auto h-9 w-9 text-[#005bd8]" />
                <p className="mt-3 text-sm font-black">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:px-8">
          <div className="rounded-3xl border border-[#dbe7fb] bg-white p-6 shadow-xl shadow-[#dbe7fb]/60">
            <h2 className="text-2xl font-black">Estimez votre commande</h2>
            {estimateItems.length ? (
              <div className="mt-5 space-y-3">
                {estimateItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl bg-[#f7fbff] p-3">
                    <div>
                      <p className="font-black">{item.label}</p>
                      <p className="text-sm text-[#52607f]">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateEstimate(item.id, -1)} className="rounded-full border border-[#dbe7fb] bg-white p-2"><Icon name="minus" className="h-4 w-4" /></button>
                      <span className="w-6 text-center font-black">{estimateQty[item.id] || 0}</span>
                      <button onClick={() => updateEstimate(item.id, 1)} className="rounded-full bg-[#005bd8] p-2 text-white"><Icon name="plus" className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                <div className="mt-5 rounded-2xl bg-[#eef6ff] p-5">
                  <SummaryLine label="Sous-total" value={formatPrice(subtotal)} />
                  <SummaryLine label="Livraison" value={formatPrice(delivery)} />
                  <SummaryLine label="Total" value={formatPrice(total)} strong />
                </div>
                <button onClick={() => startOrder('estimate')} className="mt-4 w-full rounded-2xl bg-[#005bd8] py-4 font-black text-white">Continuer la commande</button>
              </div>
            ) : (
              <EmptyState title="Estimateur en attente" description="Ajoutez des articles/prix aux services backend pour activer le calcul." />
            )}
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#06105f] to-[#005bd8] p-6 text-white shadow-2xl shadow-[#005bd8]/15">
            <h2 className="text-2xl font-black">Marketplace active</h2>
            <div className="mt-6 grid gap-4">
              {marketplaceStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/10 p-5">
                  <p className="text-3xl font-black">{stat.value}</p>
                  <p className="text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`px-4 py-14 sm:px-6 lg:px-8 ${pageBand}`}>
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#dbe7fb] bg-white p-6">
            <h2 className="text-2xl font-black">Les meilleurs partenaires de Kinshasa</h2>
            {rankedPartners.length ? (
              <div className="mt-5 space-y-3">
                {rankedPartners.map((partner, index) => (
                  <button key={partner.id} onClick={() => viewPartner(partner)} className="flex w-full items-center justify-between rounded-2xl bg-[#f7fbff] p-4 text-left">
                    <span className="rounded-full bg-[#005bd8] px-3 py-1 text-sm font-black text-white">#{index + 1}</span>
                    <span className="flex-1 px-4 font-black">{partner.name}</span>
                    <span className="text-sm font-bold text-[#52607f]">{partner.rating.toFixed(1)} · {getCommune(partner.address)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="Classement indisponible" description="Les partenaires notes apparaitront ici." />
            )}
          </div>
          <div className="rounded-3xl border border-[#dbe7fb] bg-white p-6">
            <h2 className="text-2xl font-black">Partenaires par commune</h2>
            <div className="mt-5 space-y-3">
              {coveredCommunes.map((commune) => {
                const count = partners.filter((partner) => getCommune(partner.address) === commune).length;
                const width = partners.length ? Math.max(12, Math.round((count / partners.length) * 100)) : 12;
                return (
                  <button key={commune} onClick={() => { setSelectedCommune(commune); search(); }} className="w-full text-left">
                    <div className="flex justify-between text-sm font-black"><span>{commune}</span><span>{count}</span></div>
                    <div className="mt-2 h-3 rounded-full bg-[#eef6ff]"><div className="h-3 rounded-full bg-[#005bd8]" style={{ width: `${width}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Couverture geographique" subtitle="Zones couvertes, partenaires actifs et communes en preparation." />
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-[#dbe7fb] bg-[#eaf4ff] p-6">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #005bd8 0, transparent 28%), radial-gradient(circle at 70% 55%, #00a884 0, transparent 24%)' }} />
            <div className="relative grid gap-4 md:grid-cols-4">
              {coveredCommunes.map((commune) => (
                <div key={commune} className="rounded-2xl bg-white/90 p-4 font-black shadow-sm">
                  <Icon name="mapPin" className="mb-2 h-5 w-5 text-[#005bd8]" />
                  {commune}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading title="Suivez votre commande" subtitle="Chaque etape est visible depuis votre espace client." />
            <div className="space-y-3">
              {['Commande recue', 'Ramassage', 'Nettoyage', 'Controle qualite', 'Livraison', 'Termine'].map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-white p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#005bd8] text-sm font-black text-white">{index + 1}</span>
                  <p className="font-black">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[2.5rem] bg-[#06105f] p-4 shadow-2xl">
            <div className="rounded-[2rem] bg-white p-6">
              <p className="text-xs font-black uppercase text-[#52607f]">Commande #LE-4821</p>
              <h3 className="mt-1 text-xl font-black">En cours de livraison</h3>
              <div className="mt-6 h-3 rounded-full bg-[#eef6ff]"><div className="h-3 w-3/4 rounded-full bg-[#005bd8]" /></div>
              <p className="mt-4 text-sm font-bold text-[#52607f]">Arrivee estimee dans 22 min</p>
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

        <section className="bg-gradient-to-r from-[#005bd8] via-[#006dff] to-[#004bb5] py-14 text-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 text-center sm:px-6 md:grid-cols-3 lg:px-8">
            <div><p className="text-4xl font-black">97%</p><p className="text-white/75">reviennent commander</p></div>
            <div><p className="text-4xl font-black">95%</p><p className="text-white/75">satisfaction</p></div>
            <div><p className="text-4xl font-black">{reviews.length ? `${averageRating(reviews)}/5` : '4.8/5'}</p><p className="text-white/75">note moyenne</p></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="Partenaires verifies" subtitle="Grille alimentee par les partenaires backend." />
          {partners.length ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {partners.slice(0, 12).map((partner) => (
                <button key={partner.id} onClick={() => viewPartner(partner)} className="rounded-2xl border border-[#dbe7fb] bg-white p-4 text-left shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef6ff] font-black text-[#005bd8]">{partner.name.slice(0, 2).toUpperCase()}</span>
                  <p className="mt-3 font-black">{partner.name}</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="Logos partenaires indisponibles" description="Les partenaires approuves apparaitront automatiquement." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#06105f] via-[#003b9a] to-[#005bd8] p-8 text-white shadow-2xl shadow-[#06105f]/20 md:p-12">
            <h2 className="text-3xl font-black">Vous possedez un pressing, une blanchisserie ou une flotte de livraison ?</h2>
            <p className="mt-3 max-w-2xl text-white/75">Rejoignez Laundry Express et recevez plus de commandes dans Kinshasa.</p>
            <button onClick={() => { trackEvent('become_partner_clicked', { source: 'home_cta' }); setCurrentPage({ name: 'become-partner' }); }} className="mt-6 rounded-2xl bg-[#ff7a00] px-8 py-4 font-black text-white shadow-lg shadow-[#ff7a00]/25">Devenir partenaire</button>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading title="FAQ" />
          <div className="space-y-3">
            {siteContent.faq?.length ? siteContent.faq.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-[#dbe7fb] bg-white">
                <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="flex w-full items-center justify-between p-5 text-left font-black">
                  {faq.question}
                  <Icon name={openFaq === faq.id ? 'minus' : 'plus'} className="h-5 w-5" />
                </button>
                {openFaq === faq.id && <p className="px-5 pb-5 text-[#52607f]">{faq.answer}</p>}
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
            <div className="mt-5 flex gap-2"><span className="rounded-full bg-white px-3 py-1 text-sm font-black text-[#06105f]">USD</span><span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">CDF</span></div>
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
    {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl bg-white" />)}
  </div>
);

const AdvertisementCard: React.FC<{ advertisement: Advertisement; onClick: () => void }> = ({ advertisement, onClick }) => (
  <article className="grid overflow-hidden rounded-3xl border border-[#ffd5ad] bg-gradient-to-br from-white via-[#fff8f1] to-[#fff0e0] shadow-[0_18px_45px_rgba(255,122,0,0.14)] md:grid-cols-[220px_1fr]">
    {advertisement.imageUrl ? (
      <img src={advertisement.imageUrl} alt={advertisement.title} loading="lazy" className="h-56 w-full object-cover md:h-full" />
    ) : (
      <div className="flex h-56 items-center justify-center bg-[#fff0e0] md:h-full">
        <Icon name="gift" className="h-12 w-12 text-[#ff7a00]" />
      </div>
    )}
    <div className="p-6">
      <span className="rounded-full bg-[#fff0e0] px-3 py-1 text-xs font-black uppercase text-[#ff7a00]">Publicite</span>
      <h3 className="mt-4 text-2xl font-black text-[#06105f]">{advertisement.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#52607f]">{advertisement.description}</p>
      <button onClick={onClick} className="mt-5 rounded-2xl bg-[#ff7a00] px-6 py-3 font-black text-white shadow-lg shadow-[#ff7a00]/20">Voir l'offre</button>
    </div>
  </article>
);

const PartnerCard: React.FC<{ partner: Partner; rank: number; badge?: string; tone?: 'blue' | 'green' | 'orange'; onView: () => void; onOrder: () => void }> = ({ partner, rank, badge, tone = 'blue', onView, onOrder }) => {
  const palette = tone === 'orange'
    ? { border: 'border-[#ffd5ad]', bg: 'bg-[#fff8f1]', badge: 'bg-[#fff0e0] text-[#ff7a00]', cta: 'bg-[#ff7a00]', text: 'text-[#ff7a00]' }
    : tone === 'green'
      ? { border: 'border-[#b8efe0]', bg: 'bg-[#f0fbf7]', badge: 'bg-[#e4f8f1] text-[#00a884]', cta: 'bg-[#00a884]', text: 'text-[#00a884]' }
      : { border: 'border-[#dbe7fb]', bg: 'bg-[#eef6ff]', badge: 'bg-[#eef6ff] text-[#005bd8]', cta: 'bg-[#005bd8]', text: 'text-[#005bd8]' };
  return (
  <article className={`overflow-hidden rounded-3xl border bg-white shadow-lg shadow-[#dbe7fb]/60 ${palette.border}`}>
    {partner.imageUrls?.find(Boolean) ? <img src={partner.imageUrls.find(Boolean)} alt={partner.name} loading="lazy" className="h-44 w-full object-cover" /> : <div className={`flex h-44 items-center justify-center text-3xl font-black ${palette.bg} ${palette.text}`}>{partner.name.slice(0, 2).toUpperCase()}</div>}
    <div className="p-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${palette.badge}`}>{badge || (rank === 1 ? 'Populaire' : rank === 2 ? 'Livraison rapide' : 'Top qualite')}</span>
        <span className="font-black text-[#ffb703]">★ {partner.rating.toFixed(1)}</span>
      </div>
      <h3 className="mt-4 text-xl font-black">{partner.name}</h3>
      <p className="mt-1 text-sm text-[#52607f]">{partner.reviewCount} avis · {getCommune(partner.address)} · temps selon disponibilite</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={onView} className={`rounded-xl border py-3 font-black ${palette.border} ${palette.text}`}>Voir profil</button>
        <button onClick={onOrder} className={`rounded-xl py-3 font-black text-white ${palette.cta}`}>Commander</button>
      </div>
    </div>
  </article>
  );
};

const SummaryLine: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className={`flex justify-between py-1 ${strong ? 'text-xl font-black text-[#005bd8]' : 'font-bold text-[#52607f]'}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <article className="rounded-3xl border border-[#dbe7fb] bg-white p-6 shadow-sm">
    <p className="text-[#ffb703]">{'★'.repeat(review.rating)}{'☆'.repeat(Math.max(0, 5 - review.rating))}</p>
    <p className="mt-4 text-[#52607f]">"{review.comment}"</p>
    <p className="mt-5 font-black text-[#06105f]">Client verifie</p>
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
