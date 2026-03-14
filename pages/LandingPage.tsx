
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { PageObject } from '../context/NavigationContext';
import { Icon } from '../components/Icon';
import { useAppContext } from '../context/AppContext';
import { Language } from '../context/LanguageContext';
import { Advertisement, Partner } from '../types';

const AdBanner: React.FC<{ ad: Advertisement }> = ({ ad }) => {
    const { t } = useAppContext();
    return (
        <a 
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
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

const AdCarousel: React.FC<{ ads: Advertisement[] }> = ({ ads }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const nextSlide = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % ads.length);
    }, [ads.length]);

    const prevSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex - 1 + ads.length) % ads.length);
    };
    
    const goToSlide = (slideIndex: number) => {
        setCurrentIndex(slideIndex);
    };

    useEffect(() => {
        if (ads.length > 1) {
            const slideInterval = setInterval(nextSlide, 7000); // Auto-play every 7 seconds
            return () => clearInterval(slideInterval);
        }
    }, [ads.length, nextSlide]);
    
    if (!ads || ads.length === 0) return null;

    return (
        <div className="relative w-full h-48 sm:h-64 group shadow-lg rounded-2xl">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                {ads.map((ad, index) => (
                    <div 
                        key={ad.id} 
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        <AdBanner ad={ad} />
                    </div>
                ))}
            </div>

            {ads.length > 1 && (
                <>
                    {/* Left Arrow */}
                    <button onClick={prevSlide} aria-label="Previous ad" className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                
                    {/* Right Arrow */}
                    <button onClick={nextSlide} aria-label="Next ad" className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-5 text-2xl rounded-full p-2 bg-black/40 text-white cursor-pointer z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>

                    {/* Dots */}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                        {ads.map((_, slideIndex) => (
                            <button 
                                key={slideIndex} 
                                onClick={() => goToSlide(slideIndex)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === slideIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                aria-label={`Go to slide ${slideIndex + 1}`}
                            ></button>
                        ))}
                    </div>
                </>
            )}
        </div>
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
                <img src={partner.imageUrls[0]} alt={t('partnerCard.altText', { name: partner.name, type: t(`partnerTypeEnum.${partner.type}`) })} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="font-bold text-xl text-white drop-shadow-md">{partner.name}</h3>
                </div>
            </div>
            <div className="p-4">
                <p className="font-semibold text-sm text-brand-blue">{t(`partnerTypeEnum.${partner.type}`)}</p>
                <div className="flex items-start mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <Icon name="mapPin" className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                    <span>{partner.address}</span>
                </div>
                <div className="flex items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <Icon name="star" className="w-5 h-5 text-yellow-400" />
                    <span className="ml-1.5 font-semibold text-slate-700 dark:text-slate-200">{partner.rating}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400 text-sm">({t('pressingSelector.reviews', { count: partner.reviewCount })})</span>
                </div>
            </div>
        </button>
    );
};


// Kinshasa locations and names for social proof
const kinshasaLocations = ['Gombe', 'Ngaliema', 'Lingwala', 'Kintambo', 'Bandál', 'Kalamu', 'Masina'];
const customerNames = ['Sarah', 'David', 'Marie', 'Jean', 'Fatima', 'Paul', 'Grace', 'Marc', 'Amina', 'Joseph'];

const LanguageSelector: React.FC<{ 
  language: Language; 
  setLanguage: (lang: Language) => void; 
}> = ({ language, setLanguage }) => (
  <div className="flex items-center space-x-1 sm:space-x-2 bg-black/20 p-1 rounded-full">
    {(['en', 'fr', 'sw'] as Language[]).map(lang => (
      <button 
        key={lang}
        onClick={() => setLanguage(lang)}
        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-colors ${language === lang ? 'bg-white text-brand-blue' : 'text-white/80 hover:bg-white/30'}`}
      >
        {lang.toUpperCase()}
      </button>
    ))}
  </div>
);

export const LandingPage: React.FC<{ setCurrentPage: (page: PageObject) => void }> = ({ setCurrentPage }) => {
  const { t, language, setLanguage, advertisements, partners } = useAppContext();
  const [countdown, setCountdown] = useState('02:14:06');
  const [showSocialProof, setShowSocialProof] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitIntentTriggered, setExitIntentTriggered] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentSocialProof, setCurrentSocialProof] = useState({
    name: 'Sarah',
    location: 'Gombe',
    time: '2 minutes ago'
  });

  const faqData = [
    { question: t('landingPage.faq.q1.question'), answer: t('landingPage.faq.q1.answer') },
    { question: t('landingPage.faq.q2.question'), answer: t('landingPage.faq.q2.answer') },
    { question: t('landingPage.faq.q3.question'), answer: t('landingPage.faq.q3.answer') },
    { question: t('landingPage.faq.q4.question'), answer: t('landingPage.faq.q4.answer') }
  ];

  const activeAds = useMemo(() => {
    if (!advertisements || advertisements.length === 0) return [];
    return advertisements
        .filter(ad => ad.isActive)
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
  }, [advertisements]);

  const featuredPartners = useMemo(() => {
    if (!partners || partners.length === 0) return [];
    return partners.filter(p => p.isFeatured).slice(0, 4);
  }, [partners]);

  const handlePartnerSelect = (partner: Partner) => {
    setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } });
  };

  const handleHomeNavigation = () => {
    setCurrentPage({ name: 'home' });
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === "Offer Expired!") return prev;
        const time = prev.split(':');
        let hours = parseInt(time[0], 10);
        let minutes = parseInt(time[1], 10);
        let seconds = parseInt(time[2], 10);
        
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else return t('landingPage.hero.offerExpired');
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [t]);

  // Social proof notifications
  useEffect(() => {
    let socialProofTimer: number;
    const showNotification = () => {
      const randomName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const randomLocation = kinshasaLocations[Math.floor(Math.random() * kinshasaLocations.length)];
      const randomMinutes = Math.floor(Math.random() * 10) + 1;
      
      setCurrentSocialProof({
        name: randomName,
        location: randomLocation,
        time: t('landingPage.socialProof.timeAgo', { count: randomMinutes })
      });
      
      setShowSocialProof(true);
      
      socialProofTimer = window.setTimeout(() => {
        setShowSocialProof(false);
        setTimeout(showNotification, Math.floor(Math.random() * 60000) + 30000);
      }, 8000);
    };

    const initialTimer = window.setTimeout(showNotification, 10000);
    return () => { clearTimeout(initialTimer); clearTimeout(socialProofTimer); };
  }, [t]);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !exitIntentTriggered) {
        setShowExitModal(true);
        setExitIntentTriggered(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exitIntentTriggered]);

  const trackEvent = (eventName: string, eventData: Record<string, unknown>) => console.log('Tracking:', eventName, eventData);
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="absolute top-0 left-0 right-0 z-20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleHomeNavigation()}>
            <Icon name="logo" className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">{t('landingPage.header.brandName')}</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <div className="hidden md:flex items-center space-x-2">
                <button 
                    onClick={() => setCurrentPage({ name: 'login' })} 
                    className="px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/20 transition-colors"
                >
                    {t('header.login')}
                </button>
                <button onClick={() => setCurrentPage({ name: 'register' })} className="px-4 py-2 rounded-full text-sm font-medium bg-white text-brand-blue hover:bg-opacity-90 transition-colors">{t('header.register')}</button>
            </div>
          </div>
        </div>
      </header>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 z-50 border-t">
        <div className="flex space-x-3">
          <button onClick={() => { trackEvent('cta_click', { cta_text: 'Mobile Order Pickup' }); setCurrentPage({ name: 'order' }); }} className="flex-1 bg-brand-blue hover:bg-brand-dark text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors">{t('landingPage.mobileCta.order')}</button>
          <a href="https://wa.me/243000000000" target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors flex items-center justify-center"><i className="fab fa-whatsapp mr-2"></i> {t('landingPage.mobileCta.chat')}</a>
        </div>
      </div>

      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-fade-in text-center">
            <div className="text-2xl mb-3">⏰</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{t('landingPage.exitModal.title')}</h3>
            <p className="text-slate-600 mb-4">{t('landingPage.exitModal.subtitle')}</p>
            <div className="space-y-3">
              <button onClick={() => { trackEvent('exit_modal_cta', { action: 'order_pickup' }); setShowExitModal(false); setCurrentPage({ name: 'order' }); }} className="block w-full bg-brand-blue hover:bg-brand-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors">{t('landingPage.exitModal.ctaOrder')}</button>
              <button onClick={() => setShowExitModal(false)} className="block w-full border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors hover:bg-slate-50">{t('landingPage.exitModal.ctaLater')}</button>
            </div>
          </div>
        </div>
      )}

      {showSocialProof && (
        <div className="fixed bottom-20 lg:bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40 border animate-slide-up">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">{currentSocialProof.name.charAt(0)}</div>
            <div className="flex-1"><div className="font-semibold text-slate-900">{t('landingPage.socialProof.message', { name: currentSocialProof.name, location: currentSocialProof.location })}</div><div className="text-xs text-slate-500 mt-1">{currentSocialProof.time}</div></div>
            <button onClick={() => setShowSocialProof(false)} className="text-slate-400 hover:text-slate-600 ml-2">×</button>
          </div>
        </div>
      )}

      <section className="relative bg-gradient-to-br from-brand-blue to-brand-dark text-white pt-32 pb-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('landingPage.hero.title')}</h1>
            <p className="text-xl mb-8 opacity-90">{t('landingPage.hero.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button onClick={() => setCurrentPage({ name: 'order' })} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg">{t('landingPage.hero.ctaOrder')}</button>
              <button onClick={() => setCurrentPage({ name: 'become-partner' })} className="border-2 border-white text-white hover:bg-white hover:text-brand-dark font-bold py-4 px-8 rounded-lg transition-all">{t('landingPage.hero.ctaPartner')}</button>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full py-3 px-6 inline-flex items-center mb-6 text-sm sm:text-base"><span>{t('landingPage.hero.launchOffer')}</span><span className="font-bold ml-2">{countdown}</span></div>
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm"><span>{t('landingPage.hero.tagline')}</span><div className="flex gap-2"><span className="bg-white bg-opacity-20 px-3 py-1 rounded">{t('landingPage.hero.paymentMethods.airtel')}</span><span className="bg-white bg-opacity-20 px-3 py-1 rounded">{t('landingPage.hero.paymentMethods.mpesa')}</span><span className="bg-white bg-opacity-20 px-3 py-1 rounded">{t('landingPage.hero.paymentMethods.orange')}</span></div></div>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="bg-white bg-opacity-15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center text-sm"><span className="text-yellow-400 mr-2">⭐</span> {t('landingPage.hero.trustBadges.rating')}</div>
                <div className="bg-white bg-opacity-15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center text-sm"><span className="text-green-400 mr-2">✅</span> {t('landingPage.hero.trustBadges.payment')}</div>
                <div className="bg-white bg-opacity-15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center text-sm"><span className="text-blue-400 mr-2">🚚</span> {t('landingPage.hero.trustBadges.delivery')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('landingPage.whyUs.title')}</h2><p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{t('landingPage.whyUs.subtitle')}</p></div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center"><div className="text-4xl mb-4">⏱️</div><h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('landingPage.whyUs.card1.title')}</h3><p className="text-slate-600 dark:text-slate-300">{t('landingPage.whyUs.card1.description')}</p></div>
            <div className="text-center"><div className="text-4xl mb-4">⭐</div><h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('landingPage.whyUs.card2.title')}</h3><p className="text-slate-600 dark:text-slate-300">{t('landingPage.whyUs.card2.description')}</p></div>
            <div className="text-center"><div className="text-4xl mb-4">📱</div><h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('landingPage.whyUs.card3.title')}</h3><p className="text-slate-600 dark:text-slate-300">{t('landingPage.whyUs.card3.description')}</p></div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t('homePage.trustedPartners.title')}</h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{t('homePage.trustedPartners.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredPartners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} onSelect={handlePartnerSelect} />
              ))}
          </div>
        </div>
      </section>

      {activeAds.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-800">
          <div className="container mx-auto px-4">
            <AdCarousel ads={activeAds} />
          </div>
        </section>
      )}

      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12"><h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('landingPage.faq.title')}</h2><p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">{t('landingPage.faq.subtitle')}</p></div>
          <div className="max-w-3xl mx-auto">
            {faqData.map((faq, index) => (
              <div key={index} className="mb-4 border dark:border-slate-700 rounded-lg overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full p-6 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</span>
                  <span className={`transform transition-transform text-slate-500 ${activeFaq === index ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {activeFaq === index && (
                  <div className="p-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700"><p className="text-slate-600 dark:text-slate-300">{faq.answer}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
