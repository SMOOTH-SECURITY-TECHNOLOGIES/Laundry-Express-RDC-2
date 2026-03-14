
import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Advertisement, Partner } from '../types';

const AdBanner: React.FC<{ ad: Advertisement }> = ({ ad }) => {
    const { t } = useAppContext();
    return (
        <a 
            href={ad.linkUrl}
            className="block rounded-2xl overflow-hidden group relative h-full"
            aria-label={`Advertisement: ${ad.title}`}
        >
            <img src={ad.imageUrl} alt={t('adBanner.altText', { title: ad.title })} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-500 px-2 py-1 rounded mb-2 inline-block">{t('homePage.adBanner.sponsored')}</span>
                <h3 className="text-2xl font-bold drop-shadow-md">{ad.title}</h3>
                <p className="text-sm mt-1 drop-shadow">{ad.description}</p>
            </div>
        </a>
    );
};

const PartnerCard: React.FC<{ partner: Partner; onSelect: (partner: Partner) => void; }> = ({ partner, onSelect }) => {
    const { t } = useAppContext();
    return (
        <button
            onClick={() => onSelect(partner)}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-card dark:shadow-none dark:border dark:border-slate-700 hover:shadow-card-hover dark:hover:border-slate-600 transition-all duration-300 text-left w-full group overflow-hidden transform hover:-translate-y-1"
        >
            <div className="relative">
                <img src={partner.imageUrls[0]} alt={t('partnerCard.altText', { name: partner.name, type: t(`partnerTypeEnum.${partner.type}`) })} className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-bold text-lg text-white drop-shadow-md">{partner.name}</h3>
                </div>
            </div>
            <div className="p-4">
                <p className="font-semibold text-xs text-brand-blue">{t(`partnerTypeEnum.${partner.type}`)}</p>
                <div className="flex items-center mt-2 text-xs text-slate-600 dark:text-slate-300">
                    <Icon name="star" className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="font-semibold">{partner.rating}</span>
                </div>
            </div>
        </button>
    );
};

export const HomePage: React.FC = () => {
  const { user, setCurrentPage, t, activeOrder, resetOrderDraft, advertisements, partners } = useAppContext();

  const handleNewOrderClick = () => {
    resetOrderDraft();
    setCurrentPage({ name: 'order' });
  };

  const handlePartnerSelect = (partner: Partner) => {
    setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } });
  };

  const activeAds = useMemo(() => {
    if (!advertisements) return [];
    return advertisements.filter(ad => ad.isActive).slice(0, 1);
  }, [advertisements]);

  const featuredPartners = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => p.isFeatured).slice(0, 4);
  }, [partners]);

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Hero Welcome */}
      <div className="text-center space-y-6 pt-6">
        <div>
          <h1 className="text-4xl font-extrabold text-brand-dark dark:text-slate-100">
            {t('loggedInHomePage.welcome', { name: user?.name?.split(' ')[0] || '', default: `Welcome back, ${user?.name?.split(' ')[0] || ''}!` })}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t('loggedInHomePage.whatToDo', { default: "What would you like to do today?"})}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <button
            onClick={handleNewOrderClick}
            className="w-full sm:w-auto px-8 py-4 bg-brand-blue text-white font-bold rounded-full text-lg hover:bg-opacity-90 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center space-x-3 shadow-lg"
          >
            <Icon name="shoppingBag" className="w-6 h-6" />
            <span>{t('loggedInHomePage.newOrder', { default: 'New Order' })}</span>
          </button>
          {activeOrder && (
            <button
              onClick={() => setCurrentPage({ name: 'tracking' })}
              className="w-full sm:w-auto px-8 py-4 bg-brand-dark text-white font-bold rounded-full text-lg hover:bg-opacity-90 transform hover:scale-105 transition-transform duration-300 flex items-center justify-center space-x-3 shadow-lg"
            >
              <Icon name="truck" className="w-6 h-6" />
              <span>{t('loggedInHomePage.trackOrder', { default: 'Track My Order' })}</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Ad */}
      {activeAds.length > 0 && (
        <section className="mx-auto max-w-4xl h-48 sm:h-56">
           <AdBanner ad={activeAds[0]} />
        </section>
      )}

      {/* Recommended Partners */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100">{t('homePage.trustedPartners.title')}</h2>
                <p className="text-slate-500 text-sm mt-1">{t('homePage.trustedPartners.subtitle')}</p>
            </div>
            <button onClick={handleNewOrderClick} className="text-brand-blue font-semibold text-sm hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPartners.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} onSelect={handlePartnerSelect} />
            ))}
        </div>
      </section>
    </div>
  );
};
