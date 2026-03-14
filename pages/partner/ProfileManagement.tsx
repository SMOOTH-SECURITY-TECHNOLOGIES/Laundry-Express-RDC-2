import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Partner, Service, WorkingHours, DayWorkingHours, UnavailabilityPeriod, Review } from '../../types';
import { PartnerEditModal } from '../../components/PartnerEditModal';
import { ServiceEditModal } from '../../components/ServiceEditModal';
import { Icon } from '../../components/Icon';
import { CopyableLinkCard } from '../../components/CopyableLinkCard';

// Types for better type safety
type DayKey = keyof WorkingHours;
type WorkingHoursField = keyof DayWorkingHours;

// Helper functions
const getDefaultWorkingHours = (): WorkingHours => ({
  monday: { open: '09:00', close: '18:00', isClosed: false },
  tuesday: { open: '09:00', close: '18:00', isClosed: false },
  wednesday: { open: '09:00', close: '18:00', isClosed: false },
  thursday: { open: '09:00', close: '18:00', isClosed: false },
  friday: { open: '09:00', close: '18:00', isClosed: false },
  saturday: { open: '10:00', close: '16:00', isClosed: false },
  sunday: { open: '10:00', close: '16:00', isClosed: true },
});

const validateTimeRange = (open: string, close: string): boolean => {
  return open < close;
};

const getServiceItemCount = (service: Service): number => {
  return service.articleCategories?.reduce((acc, cat) => acc + cat.items.length, 0) || 0;
};

// FIX: Corrected the type signature for the translation function `t` to accept options.
const formatServicePrice = (service: Service, t: (key: string, options?: any) => string): string => {
  if (service.priceModel === 'per_kg') {
    return `${service.price?.toFixed(2)} $ / kg`;
  }
  
  if (service.priceModel === 'per_item') {
    const itemCount = getServiceItemCount(service);
    return `${itemCount} ${t('trackingPage.articles', { count: itemCount })}`;
  }
  
  return t('partnerProfileManagement.priceNotSet');
};

// Service Card Component
interface ServiceCardProps {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete }) => {
  const { t } = useAppContext();
  
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700 flex items-start space-x-4 transition-all duration-200 hover:shadow-sm">
      <img 
        src={service.imageUrl} 
        alt={service.title} 
        className="w-20 h-20 object-cover rounded-md shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/images/service-placeholder.jpg';
        }}
      />
      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-brand-dark dark:text-slate-100 truncate">{service.title}</h4>
        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{service.description}</p>
        <p className="text-sm font-semibold text-brand-blue mt-2">
          {formatServicePrice(service, t)}
        </p>
      </div>
      <div className="flex flex-col space-y-2 shrink-0">
        <button 
          onClick={onEdit} 
          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors duration-200"
          aria-label={t('partnerProfileManagement.editService')}
        >
          <Icon name="pencil" className="w-5 h-5"/>
        </button>
        <button 
          onClick={onDelete} 
          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors duration-200"
          aria-label={t('partnerProfileManagement.deleteService')}
        >
          <Icon name="xmark" className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};

// Working Hours Row Component
interface WorkingHoursRowProps {
  day: DayKey;
  hours: DayWorkingHours;
  dayName: string;
  onChange: (day: DayKey, field: WorkingHoursField, value: any) => void;
  disabled?: boolean;
}

const WorkingHoursRow: React.FC<WorkingHoursRowProps> = ({ 
  day, 
  hours, 
  dayName, 
  onChange, 
  disabled = false 
}) => {
  const { t } = useAppContext();
  const [timeError, setTimeError] = useState('');

  const handleTimeChange = useCallback((field: 'open' | 'close', value: string) => {
    onChange(day, field, value);
    
    // Validate time range
    if (field === 'open' && value >= hours.close) {
      setTimeError(t('partnerProfileManagement.openingHours.invalidTimeRange'));
    } else if (field === 'close' && value <= hours.open) {
      setTimeError(t('partnerProfileManagement.openingHours.invalidTimeRange'));
    } else {
      setTimeError('');
    }
  }, [day, hours, onChange, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4 p-3 rounded-lg even:bg-slate-50 dark:even:bg-slate-700/30">
      <label className="font-semibold dark:text-slate-200 md:col-span-1 flex items-center">
        {dayName}
      </label>
      <div className="md:col-span-3 space-y-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id={`closed-${day}`} 
              checked={hours.isClosed} 
              onChange={(e) => onChange(day, 'isClosed', e.target.checked)} 
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            <label htmlFor={`closed-${day}`} className="ml-2 text-sm text-slate-600 dark:text-slate-300">
              {t('partnerProfileManagement.openingHours.closed')}
            </label>
          </div>
        </div>
        
        {!hours.isClosed && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 flex-grow">
              <input 
                type="time" 
                value={hours.open} 
                onChange={(e) => handleTimeChange('open', e.target.value)} 
                disabled={disabled}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded w-full dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
                aria-label={`${dayName} opening time`}
              />
              <span className="text-slate-500 dark:text-slate-400">-</span>
              <input 
                type="time" 
                value={hours.close} 
                onChange={(e) => handleTimeChange('close', e.target.value)} 
                disabled={disabled}
                className="p-2 border border-slate-300 dark:border-slate-600 rounded w-full dark:bg-slate-700 dark:text-slate-100 disabled:opacity-50"
                aria-label={`${dayName} closing time`}
              />
            </div>
            {timeError && (
              <span className="text-sm text-red-600 dark:text-red-400">{timeError}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Skeleton
const ProfileManagementSkeleton: React.FC = () => (
  <div className="space-y-8 animate-pulse">
    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32"></div>
      </div>
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 h-48"></div>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 h-48"></div>
    </div>
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700 space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-32"></div>
      </div>
      <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
      <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

export const ProfileManagement: React.FC = () => {
  const { 
    user, 
    partners, 
    updatePartner, 
    services, 
    savePartnerService, 
    deletePartnerService, 
    t, 
    addNotification 
  } = useAppContext();
  
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours | undefined>(undefined);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize partner and working hours
  useEffect(() => {
    if (user?.partnerId) {
      const currentPartner = partners.find(p => p.id === user.partnerId) || null;
      setPartner(currentPartner);
      if (currentPartner) {
        const initialHours: WorkingHours = currentPartner.workingHours || getDefaultWorkingHours();
        setWorkingHours(initialHours);
      }
    }
  }, [user, partners]);

  // Reset unsaved changes flag when modal closes
  useEffect(() => {
    if (!isEditModalOpen && !isServiceModalOpen) {
      setHasUnsavedChanges(false);
    }
  }, [isEditModalOpen, isServiceModalOpen]);

  // Partner services memo
  const partnerServices = useMemo(() => {
    if (!partner?.serviceIds) return [];
    return services.filter(s => partner.serviceIds!.includes(s.id));
  }, [partner, services]);

  // Share URL memo
  const shareUrl = useMemo(() => {
    if (!partner?.slug) return '';
    return `https://laundry.app/partner/${partner.slug}`;
  }, [partner?.slug]);

  // Subdomain URL memo
  const subdomainUrl = useMemo(() => {
    if (!partner?.slug || !partner.enabledFeatures?.customSubdomain || typeof window === 'undefined') return '';
    
    const PROD_HOSTNAME = 'laundry.app';
    const isProduction = window.location.hostname.endsWith(PROD_HOSTNAME);

    return isProduction 
      ? `https://${partner.slug}.${PROD_HOSTNAME}`
      : shareUrl;
  }, [partner, shareUrl]);

  // Subdomain description memo
  const subdomainDescription = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const PROD_HOSTNAME = 'laundry.app';
    const isProduction = window.location.hostname.endsWith(PROD_HOSTNAME);
    return isProduction 
      ? t('partnerProfileManagement.subdomain.description')
      : t('partnerProfileManagement.subdomain.description_preview');
  }, [t]);

  // Copy handlers
  const handleCopyShareUrl = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addNotification(t('partnerProfileManagement.shareableUrl.copySuccess'), 'success');
    }).catch(() => {
      addNotification(t('partnerProfileManagement.shareableUrl.copyError'), 'error');
    });
  }, [shareUrl, addNotification, t]);

  const handleCopySubdomainUrl = useCallback(() => {
    if (!subdomainUrl) return;
    navigator.clipboard.writeText(subdomainUrl).then(() => {
      addNotification(t('partnerProfileManagement.subdomain.copySuccess'), 'success');
    }).catch(() => {
      addNotification(t('partnerProfileManagement.subdomain.copyError'), 'error');
    });
  }, [subdomainUrl, addNotification, t]);

  // Working hours handler
  const handleWorkingHoursChange = useCallback((day: DayKey, field: WorkingHoursField, value: any) => {
    setWorkingHours(prev => {
      if (!prev) return undefined;
      
      const newHours = {
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
        },
      };
      
      // Set unsaved changes flag
      setHasUnsavedChanges(true);
      
      return newHours;
    });
  }, []);

  // Save working hours
  const handleSaveHours = async () => {
    if (!partner || !workingHours) return;
    
    // FIX: Safely cast `hours` to DayWorkingHours to access properties.
    const hasInvalidTimes = Object.entries(workingHours).some(([day, hours]) => {
      const dayHours = hours as DayWorkingHours;
      if (dayHours.isClosed) return false;
      return !validateTimeRange(dayHours.open, dayHours.close);
    });
    
    if (hasInvalidTimes) {
      addNotification(t('partnerProfileManagement.openingHours.invalidTimeRange'), 'error');
      return;
    }
    
    setIsSavingHours(true);
    try {
      await updatePartner({ ...partner, workingHours });
      setHasUnsavedChanges(false);
      addNotification(t('partnerProfileManagement.openingHours.saveSuccess'), 'success');
    } catch (error) {
      addNotification(t('partnerProfileManagement.openingHours.saveError'), 'error');
    } finally {
      setIsSavingHours(false);
    }
  };

  // Partner and service handlers
  const handleSavePartner = useCallback((updatedPartner: Partner) => {
    updatePartner(updatedPartner);
    setPartner(updatedPartner);
    setIsEditModalOpen(false);
    addNotification(t('partnerProfileManagement.saveSuccess'), 'success');
  }, [updatePartner, addNotification, t]);

  const handleSaveService = useCallback((service: Service) => {
    savePartnerService(partner!.id, service);
    setIsServiceModalOpen(false);
    setServiceToEdit(null);
    addNotification(
      serviceToEdit 
        ? t('partnerProfileManagement.serviceUpdated') 
        : t('partnerProfileManagement.serviceAdded'),
      'success'
    );
  }, [partner, savePartnerService, serviceToEdit, addNotification, t]);

  const handleDeleteService = useCallback((serviceId: string) => {
    if (window.confirm(t('partnerProfileManagement.confirmDeleteService'))) {
      deletePartnerService(partner!.id, serviceId);
      addNotification(t('partnerProfileManagement.serviceDeleted'), 'success');
    }
  }, [partner, deletePartnerService, addNotification, t]);

  // Day configuration
  const dayOrder: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = useMemo(() => ({
    monday: t('days.monday'),
    tuesday: t('days.tuesday'),
    wednesday: t('days.wednesday'),
    thursday: t('days.thursday'),
    friday: t('days.friday'),
    saturday: t('days.saturday'),
    sunday: t('days.sunday')
  }), [t]);

  // Loading state
  if (!partner) {
    return <ProfileManagementSkeleton />;
  }

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold dark:text-slate-100">
          {t('partnerProfileManagement.title')}
        </h1>

        {/* Partner Information Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold dark:text-slate-100">
              {t('partnerProfileManagement.myInfo')}
            </h2>
            <button 
              onClick={() => setIsEditModalOpen(true)} 
              className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg flex items-center space-x-2 hover:bg-brand-blue/90 transition-colors duration-200"
            >
              <Icon name="pencil" className="w-5 h-5"/>
              <span>{t('partnerProfileManagement.editInfo')}</span>
            </button>
          </div>
          <div className="space-y-3">
            <p><strong>{t('partnerProfileManagement.name')}:</strong> {partner.name}</p>
            <p><strong>{t('partnerProfileManagement.address')}:</strong> {partner.address}</p>
            <p><strong>{t('partnerProfileManagement.videoUrl')}:</strong> {partner.videoUrl || 'N/A'}</p>
          </div>
        </div>

        {/* Shareable URLs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {shareUrl && (
            <CopyableLinkCard
              title={t('partnerProfileManagement.shareableUrl.title')}
              description={t('partnerProfileManagement.shareableUrl.description')}
              value={shareUrl}
              buttonText={t('partnerProfileManagement.shareableUrl.copyButton')}
              onCopy={handleCopyShareUrl}
            />
          )}
          {subdomainUrl && (
            <CopyableLinkCard
              title={t('partnerProfileManagement.subdomain.title')}
              description={subdomainDescription}
              value={subdomainUrl}
              buttonText={t('partnerProfileManagement.subdomain.copyButton')}
              onCopy={handleCopySubdomainUrl}
              buttonColorClass="bg-brand-cyan hover:bg-brand-cyan/90"
            />
          )}
        </div>

        {/* Custom Domain Section */}
        {partner.enabledFeatures?.customDomain && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-brand-dark dark:text-slate-100">
              {t('partnerProfileManagement.customDomain.title')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              {t('partnerProfileManagement.customDomain.description')}
            </p>
            
            <div className="mb-4">
              <label htmlFor="customDomainDisplay" className="block text-sm font-medium text-slate-500 dark:text-slate-400">
                {t('partnerProfileManagement.customDomain.inputLabel')}
              </label>
              <p id="customDomainDisplay" className="text-lg font-semibold p-2 border border-slate-200 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/50 mt-1">
                {partner.customDomain || t('partnerProfileManagement.customDomain.notConfigured')}
              </p>
            </div>

            <div className="p-4 border-l-4 border-brand-blue bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                {t('partnerProfileManagement.customDomain.instructionsTitle')}
              </h3>
              <ol className="list-decimal list-inside mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>{t('partnerProfileManagement.customDomain.step1')}</li>
                <li>{t('partnerProfileManagement.customDomain.step2')}</li>
                <li>{t('partnerProfileManagement.customDomain.step3')}</li>
                <li>{t('partnerProfileManagement.customDomain.step4')}</li>
                <li>{t('partnerProfileManagement.customDomain.step5')}</li>
              </ol>
            </div>
          </div>
        )}
        
        {/* Working Hours Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-slate-100">
              {t('partnerProfileManagement.openingHours.title')}
            </h2>
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  {t('partnerProfileManagement.unsavedChanges')}
                </span>
              )}
              <button 
                onClick={handleSaveHours} 
                disabled={isSavingHours || !hasUnsavedChanges}
                className="px-4 py-2 bg-brand-success text-white font-semibold rounded-lg flex items-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-brand-success/90 transition-colors duration-200"
              >
                <Icon name="check" className="w-5 h-5"/>
                <span>
                  {isSavingHours 
                    ? t('buttons.saving') 
                    : t('partnerProfileManagement.openingHours.saveButton')
                  }
                </span>
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {workingHours && dayOrder.map(day => (
              <WorkingHoursRow
                key={day}
                day={day}
                hours={workingHours[day]}
                dayName={dayNames[day]}
                onChange={handleWorkingHoursChange}
                disabled={isSavingHours}
              />
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-slate-100">
              {t('partnerProfileManagement.myServices')}
            </h2>
            <button 
              onClick={() => { setServiceToEdit(null); setIsServiceModalOpen(true); }} 
              className="px-4 py-2 bg-brand-success text-white font-semibold rounded-lg flex items-center space-x-2 hover:bg-brand-success/90 transition-colors duration-200"
            >
              <Icon name="sparkles" className="w-5 h-5"/>
              <span>{t('partnerProfileManagement.addService')}</span>
            </button>
          </div>
          <div className="space-y-4">
            {partnerServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onEdit={() => { setServiceToEdit(service); setIsServiceModalOpen(true); }}
                onDelete={() => handleDeleteService(service.id)}
              />
            ))}
            {partnerServices.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg">
                <Icon name="shirt" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  {t('partnerProfileManagement.noServices')}
                </p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                  {t('partnerProfileManagement.noServicesHint')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {isEditModalOpen && (
        <PartnerEditModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          partner={partner}
          onSave={handleSavePartner}
        />
      )}
      
      <ServiceEditModal 
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        service={serviceToEdit}
        onSave={handleSaveService}
      />
    </>
  );
};
