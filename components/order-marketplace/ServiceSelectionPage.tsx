import React from 'react';
import { Icon } from '../Icon';
import { Partner, Review, Service } from '../../types';
import { EstimateItem, QuickEstimate } from './QuickEstimate';
import { PartnerComparison } from './PartnerComparison';
import { FeaturedReviews } from './FeaturedReviews';

interface ServiceSelectionPageProps {
  services: Service[];
  partners: Partner[];
  reviews: Review[];
  estimateItems: EstimateItem[];
  estimateTotal: number;
  isLoading?: boolean;
  formatPrice: (price: number) => string;
  onSelectService: (serviceId: string) => void;
  onIncrementEstimate: (itemId: string) => void;
  onDecrementEstimate: (itemId: string) => void;
  onContinueEstimate: () => void;
  onChoosePartner?: (partnerId: string) => void;
}

const serviceVisuals: Record<string, { icon: 'wash' | 'sparkles' | 'shoppingBag'; accent: string; imageUrl: string; tags: string[] }> = {
  BLANCHISSERIE: {
    icon: 'wash',
    accent: 'from-blue-50 to-sky-100',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=520&q=80',
    tags: ['Lavage', 'Sechage', 'Pliage'],
  },
  PRESSING: {
    icon: 'sparkles',
    accent: 'from-violet-50 to-purple-100',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=520&q=80',
    tags: ['Specialite', 'Delicat', 'Premium'],
  },
  CORDONNERIE: {
    icon: 'shoppingBag',
    accent: 'from-orange-50 to-amber-100',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=520&q=80',
    tags: ['Reparation', 'Entretien', 'Expertise'],
  },
};

const trustBadges = [
  { icon: 'home' as const, label: 'Ramassage a domicile' },
  { icon: 'shield-check' as const, label: 'Partenaires verifies' },
  { icon: 'clock' as const, label: 'Suivi en temps reel' },
];

const valueProps = [
  { icon: 'shield-check' as const, title: 'Paiement securise', description: 'Transactions 100% securisees' },
  { icon: 'home' as const, title: 'Ramassage a domicile', description: 'Nous venons chez vous' },
  { icon: 'badge-check' as const, title: 'Partenaires verifies', description: 'Pressings de confiance' },
  { icon: 'truck' as const, title: 'Livraison rapide', description: 'Livraison sous 24h' },
  { icon: 'phone' as const, title: 'Support 24/7', description: 'Assistance a tout moment' },
  { icon: 'shield' as const, title: 'Assurance incluse', description: 'Vos articles sont proteges' },
];

const guarantees = [
  { icon: 'shield-check' as const, title: 'Paiement securise', description: 'Transactions 100% protegees' },
  { icon: 'heart' as const, title: 'Satisfait ou rembourse', description: 'Satisfaction garantie' },
  { icon: 'truck' as const, title: 'Livraison suivie', description: 'Suivi en temps reel' },
  { icon: 'phone' as const, title: 'Support 24/7', description: 'Nous sommes toujours la' },
  { icon: 'shield' as const, title: 'Assurance textile incluse', description: 'Vos articles sont proteges' },
];

const servicePriceLabel = (service: Service, formatPrice: (price: number) => string) => {
  const suffix = service.priceModel === 'per_kg' ? '/kg' : '/article';
  return `${formatPrice(Number(service.price || 0))}${suffix}`;
};

const partnerDelay = (index: number) => ['Livraison 24h', 'Livraison 24-48h', 'Livraison 12-24h'][index % 3];

export const ServiceSelectionPage: React.FC<ServiceSelectionPageProps> = ({
  services,
  partners,
  reviews,
  estimateItems,
  estimateTotal,
  isLoading,
  formatPrice,
  onSelectService,
  onIncrementEstimate,
  onDecrementEstimate,
  onContinueEstimate,
  onChoosePartner,
}) => {
  const visibleServices = services.slice(0, 3);
  const popularPartners = partners
    .filter((partner) => partner.rating > 0)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 3);
  const totalOrders = Math.max(1200, partners.reduce((sum, partner) => sum + partner.reviewCount, 0) * 4);
  const coveredCommunes = new Set(partners.map((partner) => partner.address?.split(',').map((part) => part.trim()).filter(Boolean).at(-1)).filter(Boolean));
  const averageRating = partners.length
    ? partners.reduce((sum, partner) => sum + partner.rating, 0) / partners.length
    : 0;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Laundry Express RDC',
    areaServed: 'Kinshasa',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating ? averageRating.toFixed(1) : '4.8',
      reviewCount: reviews.length || partners.reduce((sum, partner) => sum + partner.reviewCount, 0),
    },
    makesOffer: visibleServices.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.title,
        description: service.description,
      },
      price: service.price,
      priceCurrency: 'USD',
    })),
    review: reviews.slice(0, 3).map((review) => ({
      '@type': 'Review',
      author: (review as Review & { userName?: string }).userName || review.userId,
      reviewRating: { '@type': 'Rating', ratingValue: review.rating },
      reviewBody: review.comment,
    })),
  };

  return (
    <div className="space-y-8 overflow-hidden px-1 sm:space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="px-2 pt-2 text-center sm:pt-8" aria-labelledby="service-hero-title">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-2 text-sm font-bold text-brand-blue mb-5">
          <Icon name="sparkles" className="w-4 h-4" />
          Marketplace pressing premium a Kinshasa
        </div>
        <h1 id="service-hero-title" className="text-2xl font-extrabold tracking-normal text-gray-900 dark:text-white min-[380px]:text-3xl sm:text-5xl">
          De quel service avez-vous <span className="text-brand-blue">besoin</span> ?
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-4">
          Choisissez le service qui correspond a vos besoins et laissez-nous nous occuper du reste.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:mt-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:px-4">
              <Icon name={badge.icon} className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="services-title">
        <h2 id="services-title" className="sr-only">Services</h2>
        {isLoading && visibleServices.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleServices.map((service) => {
              const visual = serviceVisuals[service.type] || serviceVisuals.PRESSING;
              return (
                <article key={service.id} className={`group overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 ${visual.accent} dark:from-slate-800 dark:to-slate-700`}>
                  <div className="grid min-h-[220px] grid-cols-1 sm:grid-cols-[42%_1fr]">
                    <img src={service.imageUrl || visual.imageUrl} alt={service.title} loading="lazy" className="h-44 w-full object-cover sm:h-full" />
                    <div className="p-5 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900 flex items-center justify-center shadow-sm">
                          <Icon name={visual.icon} className="w-7 h-7 text-brand-blue" />
                        </div>
                        <span className="text-sm font-extrabold text-brand-blue">{servicePriceLabel(service, formatPrice)}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-5">{service.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{service.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {(service.articleCategories?.map((category) => category.name).slice(0, 3) || visual.tags).map((tag) => (
                          <span key={tag} className="rounded-full bg-white/80 dark:bg-slate-900/70 px-3 py-1 text-xs font-bold text-gray-600 dark:text-gray-200">{tag}</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectService(service.id)}
                        className="mt-auto w-full bg-brand-blue hover:bg-brand-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                      >
                        Choisir ce service
                        <Icon name="arrowRight" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-6" aria-labelledby="why-us-title">
        <h2 id="why-us-title" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Pourquoi nous choisir ?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          {valueProps.map((item) => (
            <div key={item.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto">
                <Icon name={item.icon} className="w-7 h-7 text-brand-blue" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mt-3">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickEstimate
          items={estimateItems}
          total={estimateTotal}
          formatPrice={formatPrice}
          onIncrement={onIncrementEstimate}
          onDecrement={onDecrementEstimate}
          onContinue={onContinueEstimate}
        />

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5 sm:p-6" aria-labelledby="how-it-works-title">
          <h2 id="how-it-works-title" className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Comment ca marche ?</h2>
          <div className="space-y-6">
            {[
              { icon: 'device-phone-mobile', title: 'Choisissez votre service', description: 'Selectionnez le service adapte a vos besoins.' },
              { icon: 'truck', title: 'Nous recuperons vos articles', description: "Notre livreur se deplace chez vous a l'heure convenue." },
              { icon: 'shoppingBag', title: 'Nous nettoyons et livrons', description: 'Vos articles sont nettoyes avec soin et livres a votre adresse.' },
            ].map((step, index) => (
              <div key={step.title} className="grid grid-cols-[44px_1fr] gap-3 sm:grid-cols-[72px_36px_1fr] sm:gap-4 sm:items-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue/10 sm:h-16 sm:w-16">
                  <Icon name={step.icon as any} className="w-8 h-8 text-brand-blue" />
                </div>
                <div className="hidden flex-col items-center sm:flex">
                  <span className="w-8 h-8 rounded-full bg-brand-blue text-white text-sm font-bold flex items-center justify-center">{index + 1}</span>
                  {index < 2 && <span className="h-10 w-px bg-brand-blue/30 mt-2" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="popular-partners-title">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 id="popular-partners-title" className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Partenaires populaires pres de vous</h2>
          <button type="button" className="hidden sm:inline-flex items-center gap-2 text-sm font-bold text-brand-blue">Voir tous les partenaires <Icon name="arrowRight" className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {popularPartners.map((partner, index) => {
            const imageUrl = partner.imageUrls?.find(Boolean);
            return (
              <article key={partner.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt={partner.name} loading="lazy" className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-brand-blue to-[#00B4D8] flex items-center justify-center">
                    <Icon name="building" className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{partner.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"><Icon name="star" className="inline w-4 h-4 text-yellow-400" /> {partner.rating.toFixed(1)} ({partner.reviewCount} avis)</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1"><Icon name="mapPin" className="inline w-4 h-4" /> {partner.address?.split(',')[1]?.trim() || partner.address}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1"><Icon name="clock" className="inline w-4 h-4" /> {partnerDelay(index)}</p>
                    </div>
                    <Icon name="heart" className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-slate-700 mt-5 rounded-xl border border-gray-100 dark:border-slate-700 text-center text-xs">
                    <div className="p-3"><p className="font-bold text-gray-900 dark:text-white">{Math.max(120, partner.reviewCount * 4)}</p><p className="text-gray-500">Commandes</p></div>
                    <div className="p-3"><p className="font-bold text-gray-900 dark:text-white">98%</p><p className="text-gray-500">A l'heure</p></div>
                    <div className="p-3"><p className="font-bold text-brand-blue">&lt; {index + 2} min</p><p className="text-gray-500">Repond en</p></div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <PartnerComparison partners={popularPartners.length ? popularPartners : partners} onChoosePartner={onChoosePartner} />

      <FeaturedReviews reviews={reviews} />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Statistiques Laundry Express">
        {[
          ['Commandes', `${totalOrders}+`],
          ['Satisfaction', '98%'],
          ['Partenaires', `${partners.length}+`],
          ['Communes couvertes', `${Math.max(coveredCommunes.size, 1)}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm p-5 text-center">
            <p className="text-3xl font-extrabold text-brand-blue">{value}</p>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-1">{label}</p>
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-5" aria-label="Garanties">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {guarantees.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
                <Icon name={item.icon} className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
