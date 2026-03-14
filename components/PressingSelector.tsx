import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icon';
import type { Partner, User } from '../types';
import { PartnerType, ServiceType } from '../types';
import { PartnerMapView } from './PartnerMapView';
import { trackEvent } from '../utils/tracking';

interface PressingSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

export const PressingSelector: React.FC<PressingSelectorProps> = ({ onNext, onBack }) => {
  const { orderDraft, updateOrderDraft, partners, services, setCurrentPage, t, user } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationPage, setPaginationPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('default');
  const [selectedService, setSelectedService] = useState('all');
  const [priceRange, setPriceRange] = useState(10);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const PARTNERS_PER_PAGE = 6;
  
  // Track search event
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        let userDataPayload = {};
        if (user) {
            const [firstName, ...lastNameParts] = (user.name || '').split(' ');
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
        trackEvent('Search', {
          search_string: searchTerm.trim(),
          ...userDataPayload
        });
      }
    }, 500); // Debounce for 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, user]);
  
  const handleViewProfile = (partner: Partner) => {
    setCurrentPage({ name: 'partner-detail', params: { partnerId: partner.id } });
  };

  const partnerTypeToFilter = orderDraft.serviceType === ServiceType.BLANCHISSERIE 
    ? PartnerType.LAVANDIER 
    : PartnerType.PRESSING;

  const availableServices = useMemo(() => {
    const serviceTitles = new Set<string>();
    services
      .filter(s => s.type === orderDraft.serviceType)
      .forEach(s => serviceTitles.add(s.title));
    return Array.from(serviceTitles).sort();
  }, [services, orderDraft.serviceType]);
  
  const maxPrice = useMemo(() => {
    if (partnerTypeToFilter !== PartnerType.LAVANDIER) return 0;
    const prices = services
        .filter(s => s.type === ServiceType.BLANCHISSERIE && s.priceModel === 'per_kg' && s.price)
        .map(s => s.price!);
    return prices.length > 0 ? Math.ceil(Math.max(...prices, 5)) : 5;
}, [services, partnerTypeToFilter]);
  
  useEffect(() => {
    if (partnerTypeToFilter === PartnerType.LAVANDIER) {
      setPriceRange(maxPrice);
    }
  }, [maxPrice, partnerTypeToFilter]);
  
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sortBy !== 'default') count++;
    if (selectedService !== 'all') count++;
    if (partnerTypeToFilter === PartnerType.LAVANDIER && priceRange < maxPrice) count++;
    return count;
  }, [sortBy, selectedService, priceRange, partnerTypeToFilter, maxPrice]);

  const filteredAndSortedPartners = useMemo(() => {
    let result = partners
      .filter(partner => partner.type === partnerTypeToFilter)
      .filter(partner => partner.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const serviceIdToMatch = services.find(s => s.title === selectedService)?.id;
    if (selectedService !== 'all' && serviceIdToMatch) {
        result = result.filter(partner => partner.serviceIds?.includes(serviceIdToMatch));
    }

    if (partnerTypeToFilter === PartnerType.LAVANDIER) {
        const serviceIdsInRange = services
            .filter(s => s.type === ServiceType.BLANCHISSERIE && s.price && s.price <= priceRange)
            .map(s => s.id);
        const serviceIdSet = new Set(serviceIdsInRange);
        result = result.filter(partner => partner.serviceIds?.some(id => serviceIdSet.has(id)));
    }

    if (sortBy === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating_asc') {
      result.sort((a, b) => a.rating - b.rating);
    }
    
    return result;
  }, [partners, services, partnerTypeToFilter, searchTerm, selectedService, priceRange, sortBy]);


  useEffect(() => {
    setPaginationPage(1);
  }, [searchTerm, partnerTypeToFilter, selectedService, priceRange, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedPartners.length / PARTNERS_PER_PAGE);
  const startIndex = (paginationPage - 1) * PARTNERS_PER_PAGE;
  const paginatedPartners = filteredAndSortedPartners.slice(startIndex, startIndex + PARTNERS_PER_PAGE);
  
  const handlePrevPage = () => {
    setPaginationPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPaginationPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const title = orderDraft.serviceType === ServiceType.BLANCHISSERIE 
    ? t('pressingSelector.chooseLavandier')
    : t('pressingSelector.choosePressing');


  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
       <p className="text-center text-slate-500 dark:text-slate-400 mb-6">{t('pressingSelector.selectPartner')}</p>
      
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="search" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('pressingSelector.searchByName')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 p-3 border border-slate-300 dark:border-slate-600 rounded-full focus:ring-brand-blue focus:border-brand-blue dark:bg-slate-700"
              aria-label={t('pressingSelector.searchByName')}
            />
          </div>
          <div className="flex items-center p-1 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-blue shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              aria-label={t('pressingSelector.listView')}
            >
              <Icon name="bars3" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-slate-900 text-brand-blue shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              aria-label={t('pressingSelector.mapView')}
            >
              <Icon name="map" className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filter Toggle for Mobile */}
        <div className="md:hidden border-t dark:border-slate-700 pt-4">
            <button
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className="w-full flex justify-between items-center p-3 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg shadow-sm"
                aria-expanded={isFilterVisible}
            >
                <span className="font-semibold text-brand-dark dark:text-slate-100">{t('pressingSelector.filtersAndSort')}</span>
                 <div className="flex items-center space-x-2">
                    {activeFilterCount > 0 && (
                        <span className="bg-brand-blue text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                    <svg className={`w-5 h-5 text-slate-500 transform transition-transform ${isFilterVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </button>
        </div>

        {/* Filter Controls */}
        <div className={`pt-4 border-t dark:border-slate-700 md:border-t-0 md:pt-0 ${isFilterVisible ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pressingSelector.sortBy')}</label>
                <select id="sort-by" value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-brand-blue focus:border-brand-blue">
                  <option value="default">{t('pressingSelector.defaultSort')}</option>
                  <option value="rating_desc">{t('pressingSelector.ratingHighToLow')}</option>
                  <option value="rating_asc">{t('pressingSelector.ratingLowToHigh')}</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="filter-service" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pressingSelector.filterByService')}</label>
                <select id="filter-service" value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-brand-blue focus:border-brand-blue">
                  <option value="all">{t('pressingSelector.allServices')}</option>
                  {availableServices.map(service => <option key={service} value={service}>{service}</option>)}
                </select>
              </div>

              {partnerTypeToFilter === PartnerType.LAVANDIER && (
                <div>
                  <label htmlFor="price-range" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('pressingSelector.priceRange')} (${priceRange.toFixed(2)})</label>
                  <input
                    id="price-range"
                    type="range"
                    min="1"
                    max={maxPrice}
                    step="0.5"
                    value={priceRange}
                    onChange={e => setPriceRange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
          </div>
        </div>
      </div>


      {viewMode === 'list' ? (
        <>
          {filteredAndSortedPartners.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {paginatedPartners.map((partner) => (
                   <button
                      key={partner.id}
                      onClick={() => handleViewProfile(partner)}
                      className={`bg-white dark:bg-slate-800 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 text-left w-full group relative flex flex-col ${
                        orderDraft.partner?.id === partner.id
                          ? 'ring-4 ring-brand-blue ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-[1.02] shadow-card-hover'
                          : ''
                      }`}
                    >
                      {orderDraft.partner?.id === partner.id && (
                        <div className="absolute -top-3 -left-3 bg-brand-blue text-white rounded-full h-8 w-8 flex items-center justify-center z-10 shadow-lg animate-fade-in">
                          <Icon name="check" className="w-5 h-5" />
                        </div>
                      )}

                      <div className="relative">
                        <img src={partner.imageUrls[0]} alt={t('partnerCard.altText', { name: partner.name, type: t(`partnerTypeEnum.${partner.type}`) })} className="w-full h-48 object-cover rounded-t-xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-t-xl"></div>
                        <div className="absolute bottom-0 left-0 p-4">
                          <h3 className="font-bold text-xl text-white drop-shadow-md group-hover:text-brand-lightblue transition-colors">{partner.name}</h3>
                        </div>
                        
                        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                          {t(`partnerTypeEnum.${partner.type}`)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-b-xl flex flex-col flex-grow">
                        <div className="flex-grow">
                          <div className="flex items-start text-sm text-slate-600 dark:text-slate-300 min-h-[40px]">
                            <Icon name="mapPin" className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span>{partner.address}</span>
                          </div>
                          <div className="flex items-center mt-3">
                            <Icon name="star" className="w-5 h-5 text-yellow-400" />
                            <span className="ml-1.5 font-semibold text-slate-700 dark:text-slate-200">{partner.rating}</span>
                            <span className="ml-2 text-slate-500 dark:text-slate-400 text-sm">({t('pressingSelector.reviews', {count: partner.reviewCount})})</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="w-full text-center px-3 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg group-hover:bg-opacity-90 transition-colors">
                                {t('pressingSelector.viewProfile')}
                            </div>
                        </div>
                      </div>
                    </button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mb-8">
                  <button 
                    onClick={handlePrevPage}
                    disabled={paginationPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('pressingSelector.previous')}
                  >
                    {t('pressingSelector.previous')}
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {t('pressingSelector.pageOf', { current: paginationPage, total: totalPages })}
                  </span>
                  <button 
                    onClick={handleNextPage}
                    disabled={paginationPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('pressingSelector.next')}
                  >
                    {t('pressingSelector.next')}
                  </button>
                </div>
              )}
            </>
          ) : (
             <div className="text-center text-gray-600 dark:text-slate-300 my-12 min-h-[360px] flex items-center justify-center flex-col p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
               <Icon name="search" className="w-12 h-12 text-slate-400 mb-4" />
               <p className="font-semibold text-lg text-slate-700 dark:text-slate-200">
                {searchTerm ? t('pressingSelector.noPartnerFoundFor', { term: searchTerm }) : t('pressingSelector.noPartnerAvailable')}
               </p>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {searchTerm ? t('pressingSelector.tryAnotherName') : t('pressingSelector.goBackAndSelect')}
               </p>
            </div>
          )}
        </>
      ) : (
         <PartnerMapView partners={filteredAndSortedPartners} onSelectPartner={handleViewProfile} />
      )}
      

      <div className="flex justify-between pt-8 border-t dark:border-slate-700">
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700">
          {t('serviceSelector.back')}
        </button>
      </div>
    </div>
  );
};