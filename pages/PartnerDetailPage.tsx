import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { Service, Review, ServiceType, PartnerType, WorkingHours, ArticleCategory, DayWorkingHours, User } from '../types';
import { trackEvent } from '../utils/tracking';

const PriceList: React.FC<{ service: Service }> = ({ service }) => {
    const { t } = useAppContext();
    const categories = service.articleCategories || [];
    const [activeCategory, setActiveCategory] = useState<string | null>(categories.length > 0 ? categories[0].name : null);

    if (service.priceModel !== 'per_item' || categories.length === 0) {
        return null;
    }

    const activeCategoryItems = categories.find(c => c.name === activeCategory)?.items || [];

    return (
        <div className="mt-4">
            <h4 className="font-semibold mb-3 text-lg text-brand-dark dark:text-slate-100">{t('partnerDetailPage.priceList', { default: 'Price List' })}</h4>
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-600 pb-2 mb-3">
                {categories.map(category => (
                    <button 
                        key={category.name}
                        onClick={() => setActiveCategory(category.name)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                            activeCategory === category.name
                                ? 'bg-brand-dark text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {activeCategoryItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                        <span className="font-semibold text-brand-dark dark:text-slate-100">{item.price.toFixed(2)} $</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ServiceCard: React.FC<{ service: Service; onSelect: () => void; }> = ({ service, onSelect }) => {
    const { t } = useAppContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const itemCount = service.articleCategories?.reduce((acc, cat) => acc + cat.items.length, 0) || 0;
    const canExpand = service.priceModel === 'per_item' && service.articleCategories && service.articleCategories.length > 0;

    const handleClick = () => {
        if (canExpand) {
            setIsExpanded(prev => !prev);
        } else {
            onSelect();
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 transition-all group">
            <button onClick={handleClick} className="w-full text-left p-4 flex items-center space-x-4">
                <img src={service.imageUrl} alt={t('serviceCard.altText', { title: service.title })} className="w-24 h-24 object-cover rounded-md shrink-0" />
                <div className="flex-grow">
                    <h4 className="font-bold text-brand-dark dark:text-slate-100 group-hover:text-brand-blue">{service.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{service.description}</p>
                    {service.priceModel === 'per_kg' && (
                        <p className="text-sm font-semibold text-brand-blue mt-2">{service.price?.toFixed(2)} $ / kg</p>
                    )}
                    {service.priceModel === 'per_item' && (
                        <p className="text-sm font-semibold text-brand-blue mt-2">
                            {canExpand ? t('partnerDetailPage.viewPrices', { default: 'View Prices' }) : `${itemCount} ${t('trackingPage.articles', { count: itemCount })}`}
                        </p>
                    )}
                </div>
                {canExpand && (
                     <svg className={`w-6 h-6 text-slate-400 transform transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>
             {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-600 animate-fade-in">
                    <PriceList service={service} />
                    <button onClick={onSelect} className="mt-4 w-full bg-brand-blue text-white font-semibold py-2 rounded-lg hover:bg-opacity-90">
                        {t('partnerDetailPage.selectService', { default: 'Select this service' })}
                    </button>
                </div>
            )}
        </div>
    );
};


const ReviewDisplayCard: React.FC<{ review: Review }> = ({ review }) => {
    const { getUserById } = useAppContext();
    const user = getUserById(review.userId);
    return (
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-brand-dark">{user?.name || 'Utilisateur Anonyme'}</span>
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <Icon key={i} name="star" className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-slate-300'}`} />
                    ))}
                </div>
            </div>
            <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
            <p className="text-xs text-slate-400 mt-2 text-right">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
    )
}

export const PartnerDetailPage: React.FC = () => {
    const {
        activePartnerId,
        partners,
        services,
        getReviewsForPartner,
        setCurrentPage,
        updateOrderDraft,
        resetOrderDraft,
        addNotification,
        previousPage,
        t,
        user,
        getUserById,
    } = useAppContext();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [pressingCategoryFilter, setPressingCategoryFilter] = useState<string>('all');
    const [isSharing, setIsSharing] = useState(false);

    const partner = partners.find(p => p.id === activePartnerId);
    const reviews = activePartnerId ? getReviewsForPartner(activePartnerId) : [];

    const isInOrderFlow = previousPage === 'order';
    
    const partnerServices = useMemo(() => {
        if (!partner?.serviceIds) return [];
        const serviceIdSet = new Set(partner.serviceIds);
        return services.filter(s => serviceIdSet.has(s.id));
    }, [partner, services]);

    useEffect(() => {
        if (!partner) return;

        // --- Event Tracking for Dynamic Remarketing ---
        let userDataPayload = {};
        if (user) {
            const [firstName, ...lastNameParts] = user.name.split(' ');
            const lastName = lastNameParts.join(' ');
            userDataPayload = {
                user_data: {
                    email: user.email,
                    phone_number: user.phone,
                    address: {
                        first_name: firstName,
                        last_name: lastName,
                        street: `${user.pickupAddress.numero || ''} ${user.pickupAddress.avenue || ''}, ${user.pickupAddress.quartier || ''}`.trim(),
                        city: user.pickupAddress.commune,
                        country: 'CD'
                    }
                }
            };
        }
        
        trackEvent('view_item', {
            items: [{
                item_id: partner.id,
                item_name: partner.name,
                item_category: partner.type,
            }],
            ...userDataPayload
        });
        
        // --- Helper to format working hours for schema ---
        const formatOpeningHours = (hours: WorkingHours | undefined) => {
            if (!hours) return [];
            const dayMap: { [key in keyof WorkingHours]: string } = {
                monday: 'Monday',
                tuesday: 'Tuesday',
                wednesday: 'Wednesday',
                thursday: 'Thursday',
                friday: 'Friday',
                saturday: 'Saturday',
                sunday: 'Sunday',
            };
            return Object.entries(hours).map(([day, schedule]) => {
                if (schedule.isClosed) return null;
                return {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": `https://schema.org/${dayMap[day as keyof WorkingHours]}`,
                    "opens": schedule.open,
                    "closes": schedule.close
                };
            }).filter(Boolean);
        };

        // --- Schema for the Partner ---
        const partnerSchema = {
            "@context": "https://schema.org",
            "@type": "DryCleaningOrLaundry",
            "name": partner.name,
            "image": partner.imageUrls,
            "url": `https://laundry.app/partner/${partner.slug}`,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": partner.address
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": partner.coordinates.lat,
                "longitude": partner.coordinates.lng
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": partner.rating,
                "reviewCount": partner.reviewCount
            },
            "review": reviews.map(review => ({
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": getUserById(review.userId)?.name || "Anonymous"
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": review.rating
                },
                "reviewBody": review.comment,
                "datePublished": review.createdAt
            })),
            "makesOffer": partnerServices.map(service => ({
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": service.title,
                    "description": service.description
                },
                ...(service.priceModel === 'per_kg' && service.price && {
                    "priceSpecification": {
                        "@type": "PriceSpecification",
                        "price": service.price,
                        "priceCurrency": "USD",
                        "unitCode": "KGM" // UN/CEFACT code for Kilogram
                    }
                })
            })),
            "openingHoursSpecification": formatOpeningHours(partner.workingHours)
        };
        
        // --- Schema for Breadcrumbs ---
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://laundry.app/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": partner.name,
                    "item": `https://laundry.app/partner/${partner.slug}`
                }
            ]
        };

        // --- Inject scripts into head ---
        const partnerScript = document.createElement('script');
        partnerScript.type = 'application/ld+json';
        partnerScript.id = 'partner-schema';
        partnerScript.innerHTML = JSON.stringify(partnerSchema);
        document.head.appendChild(partnerScript);

        const breadcrumbScript = document.createElement('script');
        breadcrumbScript.type = 'application/ld+json';
        breadcrumbScript.id = 'breadcrumb-schema';
        breadcrumbScript.innerHTML = JSON.stringify(breadcrumbSchema);
        document.head.appendChild(breadcrumbScript);
        
        return () => {
            document.getElementById('partner-schema')?.remove();
            document.getElementById('breadcrumb-schema')?.remove();
        };
    }, [partner, reviews, partnerServices, getUserById, user]);

    const { pressingServices, blanchisserieServices, pressingArticleCategories } = useMemo(() => {
        if (partnerServices.length === 0) {
            return { pressingServices: [], blanchisserieServices: [], pressingArticleCategories: [] };
        }

        const pServices = partnerServices.filter(s => s.type === ServiceType.PRESSING);
        const bServices = partnerServices.filter(s => s.type === ServiceType.BLANCHISSERIE);
        
        const categories = new Set<string>();
        pServices.forEach(service => {
            service.articleCategories?.forEach(cat => {
                categories.add(cat.name);
            });
        });

        return {
            pressingServices: pServices,
            blanchisserieServices: bServices,
            pressingArticleCategories: Array.from(categories).sort(),
        };
    }, [partnerServices]);

    const filteredPressingServices = useMemo(() => {
        if (pressingCategoryFilter === 'all') {
            return pressingServices;
        }
        return pressingServices.filter(service => 
            service.articleCategories?.some(cat => cat.name === pressingCategoryFilter)
        );
    }, [pressingServices, pressingCategoryFilter]);
    
    if (!partner) {
        return (
            <div className="text-center">
                <p>{t('partnerDetailPage.notFound')}</p>
                {/* FIX: Call setCurrentPage with a PageObject. */}
                <button onClick={() => setCurrentPage({ name: 'home' })}>{t('partnerDetailPage.backToHome')}</button>
            </div>
        );
    }

    const nextImage = () => {
        setCurrentImageIndex(prev => (prev + 1) % partner.imageUrls.length);
    };

    const prevImage = () => {
        setCurrentImageIndex(prev => (prev - 1 + partner.imageUrls.length) % partner.imageUrls.length);
    };

    const handleStartOrderWithService = (service: Service) => {
        if (!partner) return;

        trackEvent('select_item', {
            item_list_id: `partner_services_${partner.id}`,
            item_list_name: `${partner.name} Services`,
            items: [{
                item_id: service.id,
                item_name: service.title,
                item_category: service.type,
                price: service.price || 0,
            }]
        });
        
        resetOrderDraft();
        // FIX: The 'service' property does not exist on OrderDraft. Use 'serviceItems' instead.
        updateOrderDraft({ partner, serviceItems: [{ service, items: [], weight: 0 }] });
        // FIX: Call setCurrentPage with a PageObject.
        setCurrentPage({ name: 'order' });
    };
    
    const handleStartGeneralOrder = () => {
        resetOrderDraft();
        updateOrderDraft({ partner, serviceType: partner.type === PartnerType.LAVANDIER ? ServiceType.BLANCHISSERIE : ServiceType.PRESSING });
        // FIX: Call setCurrentPage with a PageObject.
        setCurrentPage({ name: 'order' });
    };

    const handleSelectPartnerAndContinue = () => {
        if (!partner) return;
        updateOrderDraft({ partner }); 
        // FIX: Call setCurrentPage with a PageObject.
        setCurrentPage({ name: 'order' });
    };
    
    const shareUrl = useMemo(() => {
        if (!partner?.slug) return '';
        // Use the canonical production domain for sharing to ensure URL validity.
        return `https://laundry.app/partner/${partner.slug}`;
    }, [partner?.slug]);

    const handleShare = async () => {
        if (!partner || isSharing || !shareUrl) return;

        const shareTitle = t('partnerDetailPage.shareTitle', { name: partner.name });
        const shareText = t('partnerDetailPage.shareText', { name: partner.name });

        if (navigator.share) {
            setIsSharing(true);
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                  console.error('Error sharing:', error);
                }
            } finally {
                setIsSharing(false);
            }
        } else {
            setIsSharing(true);
            try {
                await navigator.clipboard.writeText(shareUrl);
                addNotification(t('partnerDetailPage.linkCopied'), 'success');
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                addNotification(t('partnerDetailPage.copyError'), 'error');
            } finally {
                setTimeout(() => setIsSharing(false), 500);
            }
        }
    };

    const dayNames: { [key in keyof WorkingHours]: string } = {
        monday: t('partnerProfileManagement.days.monday'),
        tuesday: t('partnerProfileManagement.days.tuesday'),
        wednesday: t('partnerProfileManagement.days.wednesday'),
        thursday: t('partnerProfileManagement.days.thursday'),
        friday: t('partnerProfileManagement.days.friday'),
        saturday: t('partnerProfileManagement.days.saturday'),
        sunday: t('partnerProfileManagement.days.sunday')
    };
    
    const dayOrder: (keyof WorkingHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const todayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    const dayKeyMap: (keyof WorkingHours)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayKeyMap[todayIndex];

    const MAP_BOUNDS = {
      lat: { min: -4.35, max: -4.29 },
      lng: { min: 15.28, max: 15.35 },
    };

    const calculatePosition = (coords: { lat: number; lng: number }) => {
        const x = ((coords.lng - MAP_BOUNDS.lng.min) / (MAP_BOUNDS.lng.max - MAP_BOUNDS.lng.min)) * 100;
        const y = ((MAP_BOUNDS.lat.max - coords.lat) / (MAP_BOUNDS.lat.max - MAP_BOUNDS.lat.min)) * 100;
        return { x: `${x}%`, y: `${y}%` };
    };
    const partnerPos = partner.coordinates ? calculatePosition(partner.coordinates) : null;


    return (
        <div className="max-w-5xl mx-auto animate-fade-in">
            {/* Header Section */}
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-[-80px] group">
                {partner.imageUrls && partner.imageUrls.length > 0 ? (
                    <>
                        <img src={partner.imageUrls[currentImageIndex]} alt={t('partnerDetailPage.imageAlt', { name: partner.name, index: currentImageIndex + 1 })} className="w-full h-full object-cover transition-transform duration-500 ease-in-out" key={currentImageIndex}/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        
                        {partner.imageUrls.length > 1 && (
                            <>
                                <button onClick={prevImage} aria-label={t('partnerDetailPage.previousImage')} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                </button>
                                <button onClick={nextImage} aria-label={t('partnerDetailPage.nextImage')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                                    {partner.imageUrls.map((_, index) => (
                                        <button key={index} onClick={() => setCurrentImageIndex(index)} aria-label={t('partnerDetailPage.goToImage', { index: index + 1 })} className={`w-2 h-2 rounded-full transition-colors ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}></button>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <Icon name="wash" className="w-16 h-16 text-slate-400" />
                    </div>
                )}
                
                {/* FIX: Call setCurrentPage with a PageObject. */}
                <button onClick={() => setCurrentPage({ name: previousPage || 'home' })} className="absolute top-4 left-4 bg-white/80 text-brand-dark px-3 py-1 rounded-full text-sm font-semibold hover:bg-white transition-all">
                    &larr; {t('partnerDetailPage.backButton')}
                </button>
            </div>

            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mx-4 md:mx-8">
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-dark dark:text-slate-100">{partner.name}</h1>
                        <div className="flex items-center mt-2 text-slate-600 dark:text-slate-300">
                            <Icon name="mapPin" className="w-5 h-5 mr-2 text-slate-400" />
                            <span>{partner.address}</span>
                        </div>
                        <div className="flex items-center mt-3">
                            <Icon name="star" className="w-6 h-6 text-yellow-400" />
                            <span className="ml-2 font-bold text-xl text-slate-700 dark:text-slate-200">{partner.rating}</span>
                            <span className="ml-2 text-slate-500 dark:text-slate-400 text-sm">({t('partnerDetailPage.reviews', { count: partner.reviewCount })})</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleShare}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors self-start disabled:opacity-50"
                        aria-label={t('partnerDetailPage.shareAriaLabel')}
                        disabled={isSharing || !shareUrl}
                    >
                        <Icon name="share" className="w-5 h-5" />
                        <span>{t('partnerDetailPage.shareButton')}</span>
                    </button>
                </div>
            </div>

            {/* Video Section */}
            <section className="mt-8 px-4 md:px-0">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100 border-b dark:border-slate-700 pb-2">{t('partnerDetailPage.discoverVideo')}</h2>
                    <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 relative flex items-center justify-center">
                        {partner.videoUrl ? (
                             <video
                                src={partner.videoUrl}
                                controls
                                playsInline
                                className="w-full h-full object-cover"
                                poster={partner.imageUrls[0]}
                             ></video>
                        ) : (
                            <>
                                <img src={partner.imageUrls[0]} alt={t('partnerDetailPage.videoPlaceholderAlt', { name: partner.name })} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-black/20">
                                    <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                                         <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-white drop-shadow-md">{t('partnerDetailPage.videoComingSoon.title')}</h3>
                                    <p className="text-sm text-slate-100 drop-shadow">{t('partnerDetailPage.videoComingSoon.subtitle')}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Services */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100 border-b dark:border-slate-700 pb-2">{t('partnerDetailPage.servicesTitle')}</h2>

                    {blanchisserieServices.length > 0 && (
                        <section className="mb-8">
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">{t('serviceType.BLANCHISSERIE')}</h3>
                            <div className="space-y-4">
                                {blanchisserieServices.map(service => (
                                    <ServiceCard key={service.id} service={service} onSelect={() => handleStartOrderWithService(service)} />
                                ))}
                            </div>
                        </section>
                    )}

                    {pressingServices.length > 0 && (
                        <section>
                            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">{t('serviceType.PRESSING')}</h3>
                            {pressingArticleCategories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4 p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                                    <button
                                        onClick={() => setPressingCategoryFilter('all')}
                                        className={`px-4 py-1.5 text-sm font-semibold rounded-full flex-shrink-0 transition-all ${pressingCategoryFilter === 'all' ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {t('pressingSelector.allServices')}
                                    </button>
                                    {pressingArticleCategories.map(category => (
                                        <button
                                            key={category}
                                            onClick={() => setPressingCategoryFilter(category)}
                                            className={`px-4 py-1.5 text-sm font-semibold rounded-full flex-shrink-0 transition-all ${pressingCategoryFilter === category ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                {filteredPressingServices.length > 0 ? (
                                    filteredPressingServices.map(service => (
                                        <ServiceCard key={service.id} service={service} onSelect={() => handleStartOrderWithService(service)} />
                                    ))
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400">{t('partnerDetailPage.noServices')}</p>
                                )}
                            </div>
                        </section>
                    )}

                    {(pressingServices.length === 0 && blanchisserieServices.length === 0) && (
                        <p className="text-slate-500 dark:text-slate-400">{t('partnerDetailPage.noServices')}</p>
                    )}
                    
                     <div className="mt-6 pt-6 border-t dark:border-slate-700">
                        <button 
                            onClick={isInOrderFlow ? handleSelectPartnerAndContinue : handleStartGeneralOrder}
                            className="w-full px-6 py-3 bg-brand-blue text-white font-bold rounded-lg text-lg hover:bg-opacity-90 transition-transform transform hover:scale-105"
                        >
                           {isInOrderFlow ? t('partnerDetailPage.selectAndContinue', { default: 'Select this Partner & Continue' }) : t('partnerDetailPage.orderWith', { name: partner.name })}
                        </button>
                     </div>
                </div>

                {/* Right column */}
                <div className="space-y-8">
                    {/* Reviews */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100 border-b dark:border-slate-700 pb-2">{t('partnerDetailPage.reviewsTitle')}</h2>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                             {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <ReviewDisplayCard key={review.id} review={review} />
                                ))
                            ) : (
                                <div className="text-center py-8 px-4">
                                    <Icon name="star" className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                                    <h4 className="mt-3 text-lg font-semibold text-brand-dark dark:text-slate-100">{t('partnerDetailPage.noReviewsTitle')}</h4>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('partnerDetailPage.noReviewsSubtitle')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                     {/* Practical Info Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100 border-b dark:border-slate-700 pb-2">{t('partnerDetailPage.practicalInfo')}</h2>
                        <div className="space-y-4">
                            {partner.unavailability && partner.unavailability.length > 0 && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
                                    <p className="font-bold">{t('partnerDetailPage.temporaryUnavailability')}</p>
                                    {partner.unavailability.map(p => (
                                        <p key={p.id} className="text-sm">
                                            {t('partnerDetailPage.fromTo', { start: p.startDate, end: p.endDate })}
                                        </p>
                                    ))}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">{t('partnerDetailPage.openingHours')}</h3>
                                <div className="space-y-1 text-sm">
                                    {partner.workingHours && dayOrder.map(day => {
                                        const hours: DayWorkingHours = partner.workingHours![day];
                                        const isToday = day === todayKey;
                                        return (
                                            <div key={day} className={`flex justify-between ${isToday ? 'font-bold text-brand-blue' : 'text-slate-600 dark:text-slate-300'}`}>
                                                <span>{dayNames[day]} {isToday ? `(${t('partnerDetailPage.today')})` : ''}</span>
                                                <span>{hours.isClosed ? t('partnerDetailPage.closed') : `${hours.open} - ${hours.close}`}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                             <div>
                                <h3 className="font-semibold mb-2 text-slate-700 dark:text-slate-200">{t('partnerDetailPage.location')}</h3>
                                <div className="h-48 rounded-lg overflow-hidden relative bg-slate-200 dark:bg-slate-700">
                                    <img src="https://i.imgur.com/uG90qXj.png" alt={t('partnerDetailPage.mapAlt', { name: partner.name })} className="w-full h-full object-cover"/>
                                    {partnerPos && (
                                        <div className="absolute" style={{ left: partnerPos.x, top: partnerPos.y, transform: 'translate(-50%, -100%)' }}>
                                            <Icon name="mapPin" className="w-10 h-10 text-red-500 drop-shadow-lg"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};