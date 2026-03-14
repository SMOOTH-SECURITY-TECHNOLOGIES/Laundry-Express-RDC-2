import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PartnerApplication, Partner, PartnerType, LogisticsPartner, ApplicationSettings, Service, PartnerFeatures } from '../../types';
import { Icon } from '../../components/Icon';
import { PartnerEditModal } from '../../components/PartnerEditModal';
import BulkFeatureEditModal from '../../components/BulkFeatureEditModal';
import { CommissionManagement } from './CommissionManagement';

const ApplicationSettingsCard: React.FC = () => {
    const { applicationSettings, updateApplicationSettings, addNotification, t } = useAppContext();
    const [settings, setSettings] = useState(applicationSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setSettings(applicationSettings);
    }, [applicationSettings]);

    const handleToggle = (type: PartnerType) => {
        setSettings(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateApplicationSettings(settings);
            addNotification(t('notifications.applicationSettingsUpdated', { default: 'Application settings updated.'}), 'success');
        } catch (e) {
            addNotification('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(applicationSettings);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">{t('partnerManagement.applicationSettings.title')}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {t('partnerManagement.applicationSettings.description')}
            </p>
            <div className="space-y-3">
                {Object.keys(settings).map((type) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{t(`partnerTypeEnum.${type}`)}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings[type as PartnerType]} onChange={() => handleToggle(type as PartnerType)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                        </label>
                    </div>
                ))}
            </div>
            {hasChanges && (
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-brand-success text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400">
                        {isSaving ? t('partnerManagement.applicationSettings.savingButton') : t('partnerManagement.applicationSettings.saveButton')}
                    </button>
                </div>
            )}
        </div>
    );
};

const ApplicationCard: React.FC<{ application: PartnerApplication }> = ({ application }) => {
    const { approvePartnerApplication, rejectPartnerApplication, t } = useAppContext();
    
    const handleReject = () => {
        const reason = prompt(t('partnerDashboard.rejectionReasonPrompt'));
        if (reason !== null) {
            rejectPartnerApplication(application.id, reason || t('partnerDashboard.defaultRejectionReason'));
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">{application.companyName}</h3>
                    <p className="text-sm font-semibold text-brand-blue">{t(`partnerTypeEnum.${application.partnerType}`)}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-300 mt-2">{application.contactName} - {application.phone}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-300">{application.email}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-300">{application.address}</p>
                    {application.message && <p className="text-sm italic text-gray-600 dark:text-slate-200 mt-2 bg-white dark:bg-slate-600/50 p-2 rounded">"{application.message}"</p>}
                </div>
                <div className="text-right text-xs text-gray-400 dark:text-slate-500">
                    <p>ID: {application.id}</p>
                    <p>{new Date(application.submittedAt).toLocaleString('fr-FR')}</p>
                </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t dark:border-slate-600">
                <button 
                    onClick={handleReject}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                    {t('partnerManagement.reject')}
                </button>
                <button 
                    onClick={() => approvePartnerApplication(application.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90"
                >
                    {t('partnerManagement.approve')}
                </button>
            </div>
        </div>
    )
}

const PartnerHealthScore: React.FC<{ partner: Partner }> = ({ partner }) => {
    const { analyzePartnerHealth, t } = useAppContext();
    const [healthData, setHealthData] = useState<{ score: number; summary: string; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await analyzePartnerHealth(partner.id);
            setHealthData(data);
        } catch (e) {
            setError(t('partnerManagement.analysisFailed', { default: 'Failed to analyze health.' }));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const scoreColor = useMemo(() => {
        if (!healthData) return 'text-slate-500 dark:text-slate-400';
        if (healthData.score > 80) return 'text-green-600 dark:text-green-400';
        if (healthData.score > 50) return 'text-yellow-500 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    }, [healthData]);

    return (
        <div className="mt-4 pt-4 border-t dark:border-slate-600">
            <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">{t('partnerManagement.healthScoreTitle')}</h4>
            {isLoading ? (
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('partnerManagement.analyzing')}</span>
                </div>
            ) : error ? (
                <div className="text-sm text-red-500 flex items-center gap-2">
                    <span>{error}</span>
                    <button onClick={handleAnalyze} className="text-xs underline">Try again</button>
                </div>
            ) : healthData ? (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <p className={`text-3xl font-bold ${scoreColor}`}>{healthData.score}<span className="text-xl">/100</span></p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{healthData.summary}"</p>
                </div>
            ) : (
                <button
                    onClick={handleAnalyze}
                    className="px-3 py-1.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center space-x-1"
                >
                    <Icon name="sparkles" className="w-4 h-4" />
                    <span>{t('partnerManagement.analyzeHealth')}</span>
                </button>
            )}
        </div>
    );
};

const PartnerManagementCard: React.FC<{ partner: Partner; onEdit: (partner: Partner) => void; onDelete: (partnerId: string) => void; }> = ({ partner, onEdit, onDelete }) => {
    const { togglePartnerFeaturedStatus, t } = useAppContext();

    return (
         <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700 flex flex-col">
            <div className="flex justify-between items-start flex-grow">
                <div className="flex items-start space-x-4">
                    <img src={partner.imageUrls[0]} alt={t('partnerCard.altText', { name: partner.name, type: t(`partnerTypeEnum.${partner.type}`) })} className="w-16 h-16 rounded-md object-cover" />
                    <div>
                        <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">{partner.name}</h3>
                        <p className="text-sm font-semibold text-brand-blue">{t(`partnerTypeEnum.${partner.type}`)}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">{partner.address}</p>
                        <div className="flex items-center space-x-3 mt-2" title="Enabled Features">
                            <Icon name="sparkles" className={`w-4 h-4 ${partner.enabledFeatures?.promotions ? 'text-purple-500' : 'text-slate-300'}`} title={t('partnerFeatures.promotions')} />
                            <Icon name="currencyDollar" className={`w-4 h-4 ${partner.enabledFeatures?.financials ? 'text-green-500' : 'text-slate-300'}`} title={t('partnerFeatures.financials')} />
                            <Icon name="chartBar" className={`w-4 h-4 ${partner.enabledFeatures?.analytics ? 'text-blue-500' : 'text-slate-300'}`} title={t('partnerFeatures.analytics')} />
                            <Icon name="share" className={`w-4 h-4 ${partner.enabledFeatures?.customDomain ? 'text-indigo-500' : 'text-slate-300'}`} title={t('partnerFeatures.customDomain')} />
                        </div>
                    </div>
                </div>
                <div className="text-right text-xs text-gray-400 dark:text-slate-500">
                    <p>ID: {partner.id}</p>
                </div>
            </div>
             <PartnerHealthScore partner={partner} />
             <div className="flex justify-end space-x-2 mt-4 pt-4 border-t dark:border-slate-600">
                <button
                    onClick={() => togglePartnerFeaturedStatus(partner.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center space-x-2 transition-colors ${
                        partner.isFeatured 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500'
                    }`}
                >
                    <Icon name="star" className={`w-4 h-4 ${partner.isFeatured ? 'text-yellow-500' : 'text-slate-400'}`} />
                    <span>{partner.isFeatured ? t('partnerManagement.featured') : t('partnerManagement.setFeatured')}</span>
                </button>
                <button 
                    onClick={() => onDelete(partner.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                    {t('partnerManagement.delete')}
                </button>
                <button 
                    onClick={() => onEdit(partner)}
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-opacity-90"
                >
                    {t('partnerManagement.edit')}
                </button>
            </div>
        </div>
    )
}

const LogisticsPartnerEditModal: React.FC<{
  partner: LogisticsPartner;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPartner: LogisticsPartner) => void;
}> = ({ partner, isOpen, onClose, onSave }) => {
  const { t } = useAppContext();
  const [name, setName] = useState(partner.name);

  useEffect(() => {
    setName(partner.name);
  }, [partner]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
        onSave({ ...partner, name: name.trim() });
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full relative">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-300 dark:hover:text-slate-100">
            <Icon name="xmark" className="w-6 h-6" />
        </button>
        <div className="p-8">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 mb-6">{t('logisticsPartnerEditModal.title')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('logisticsPartnerEditModal.nameLabel')}</label>
                    <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700" />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                        {t('buttons.cancel')}
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                        {t('buttons.saving')}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};


export const PartnerManagement: React.FC = () => {
    const { 
        partnerApplications, partners, logisticsPartners,
        updatePartner, deletePartner,
        addLogisticsPartner, updateLogisticsPartner, deleteLogisticsPartner,
        addNotification,
        t,
        services
    } = useAppContext();
    const [activeTab, setActiveTab] = useState<'laundry' | 'logistics'>('laundry');
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);

    const [isLogisticsEditModalOpen, setIsLogisticsEditModalOpen] = useState(false);
    const [logisticsPartnerToEdit, setLogisticsPartnerToEdit] = useState<LogisticsPartner | null>(null);
    const [newLogisticsPartnerName, setNewLogisticsPartnerName] = useState('');
    
    const [modalState, setModalState] = useState<{ isOpen: boolean, featureKey: keyof PartnerFeatures | null, featureName: string | null }>({ isOpen: false, featureKey: null, featureName: null });

    const featureKeys = useMemo((): (keyof PartnerFeatures)[] => {
        // A canonical list of all possible features ensures UI consistency.
        return [
            'promotions', 
            'financials', 
            'analytics', 
            'customDomain', 
            'customSubdomain', 
            'teamManagement', 
            'apiAccess', 
            'advancedAutomation', 
            'aiReviewAssistant',
            'invoiceGenerator'
        ];
    }, []);

    const handleOpenBulkEdit = (featureKey: keyof PartnerFeatures, featureName: string) => {
        setModalState({ isOpen: true, featureKey, featureName });
    };

    const handleBulkSave = async (featureKey: keyof PartnerFeatures, updates: { partnerId: string, value: boolean }[]) => {
        if (updates.length === 0) {
            setModalState({ isOpen: false, featureKey: null, featureName: null });
            return;
        }

        const promises = updates.map(update => {
            const partnerToUpdate = partners.find(p => p.id === update.partnerId);
            if (!partnerToUpdate) return Promise.resolve();

            const newEnabledFeatures = {
                ...partnerToUpdate.enabledFeatures,
                [featureKey]: update.value,
            };
            const updatedPartner = { ...partnerToUpdate, enabledFeatures: newEnabledFeatures as PartnerFeatures };
            return updatePartner(updatedPartner);
        });

        await Promise.all(promises);
        addNotification(t('notifications.partnerFeaturesUpdated', { default: 'Partner features updated successfully.' }), 'success');
        setModalState({ isOpen: false, featureKey: null, featureName: null });
    };


    const getMinPriceForPartner = (partner: Partner, allServices: Service[]): string => {
        if (!partner.serviceIds || partner.serviceIds.length === 0) {
            return '1.00 USD'; // Default price
        }
        let minPrice = Infinity;
        partner.serviceIds.forEach(serviceId => {
            const service = allServices.find(s => s.id === serviceId);
            if (service) {
                if (service.priceModel === 'per_kg' && service.price) {
                    minPrice = Math.min(minPrice, service.price);
                } else if (service.priceModel === 'per_item' && service.articleCategories) {
                    service.articleCategories.forEach(cat => {
                        cat.items.forEach(item => {
                            minPrice = Math.min(minPrice, item.price);
                        });
                    });
                }
            }
        });

        if (minPrice === Infinity) {
            return '1.00 USD';
        }
        return `${minPrice.toFixed(2)} USD`;
    };

    const handleDownloadFeed = () => {
        const headers = [
            'id', 'title', 'description', 'link', 'image_link', 
            'availability', 'price', 'brand'
        ];

        const rows = partners.map(partner => {
            const id = partner.id;
            const title = partner.name;
            const description = t('dynamicFeed.description', { 
                type: t(`partnerTypeEnum.${partner.type}`),
                name: partner.name,
                address: partner.address,
                default: `High-quality ${partner.type.toLowerCase()} services from ${partner.name}, located at ${partner.address}.`
            });
            const link = `https://laundry.app/partner/${partner.slug}`;
            const image_link = partner.imageUrls[0] || '';
            const availability = 'in stock';
            const price = getMinPriceForPartner(partner, services);
            const brand = 'Laundry Express';

            // Function to escape CSV special characters
            const escapeCsv = (str: string | undefined) => {
                if (!str) return '""';
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            return [
                id,
                escapeCsv(title),
                escapeCsv(description),
                link,
                image_link,
                availability,
                price,
                escapeCsv(brand)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const linkEl = document.createElement('a');
        linkEl.setAttribute('href', url);
        linkEl.setAttribute('download', 'product-feed.csv');
        linkEl.style.visibility = 'hidden';
        document.body.appendChild(linkEl);
        linkEl.click();
        document.body.removeChild(linkEl);
    };

    const laundryApplications = useMemo(() => 
        partnerApplications.filter(app => app.partnerType === PartnerType.PRESSING || app.partnerType === PartnerType.LAVANDIER),
        [partnerApplications]
    );

    const logisticsApplications = useMemo(() => 
        partnerApplications.filter(app => app.partnerType === PartnerType.LOGISTICS),
        [partnerApplications]
    );

    const handleEdit = (partner: Partner) => {
        setPartnerToEdit(partner);
        setIsEditModalOpen(true);
    };

    const handleDelete = (partnerId: string) => {
        if (window.confirm(t('partnerManagement.confirmDelete'))) {
            deletePartner(partnerId);
        }
    };

    const handleSavePartner = (updatedPartner: Partner) => {
        updatePartner(updatedPartner);
        addNotification(t('notifications.partnerUpdated', { default: 'Partner updated successfully.' }), 'success');
        setIsEditModalOpen(false);
        setPartnerToEdit(null);
    };

    const handleAddLogisticsPartner = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLogisticsPartnerName.trim()) {
            addLogisticsPartner(newLogisticsPartnerName.trim());
            setNewLogisticsPartnerName('');
        }
    };
    
    const handleEditLogisticsPartner = (partner: LogisticsPartner) => {
        setLogisticsPartnerToEdit(partner);
        setIsLogisticsEditModalOpen(true);
    };

    const handleSaveLogisticsPartner = (updatedPartner: LogisticsPartner) => {
        updateLogisticsPartner(updatedPartner);
        setIsLogisticsEditModalOpen(false);
        setLogisticsPartnerToEdit(null);
    };

    const handleDeleteLogisticsPartner = (partnerId: string) => {
        if (window.confirm(t('partnerManagement.confirmDeleteLogistics'))) {
            deleteLogisticsPartner(partnerId);
        }
    };

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">{t('partnerManagement.title')}</h1>
                
                <ApplicationSettingsCard />

                <CommissionManagement />

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4">{t('partnerManagement.bulkFeatureManagement.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {t('partnerManagement.bulkFeatureManagement.description')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featureKeys.map(key => (
                            <div key={key} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <span className="font-medium text-slate-800 dark:text-slate-100">{t(`partnerFeatures.${key}`, { default: key })}</span>
                                <button onClick={() => handleOpenBulkEdit(key, t(`partnerFeatures.${key}`, { default: key }))} className="px-3 py-1 text-xs font-semibold text-brand-blue bg-blue-100 dark:bg-blue-900/40 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/60">
                                    {t('partnerManagement.bulkFeatureManagement.manageButton')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('laundry')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'laundry' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            {t('partnerManagement.tabs.laundry')}
                        </button>
                        <button
                            onClick={() => setActiveTab('logistics')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logistics' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            {t('partnerManagement.tabs.logistics')}
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'laundry' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-4">{t('partnerManagement.pendingRequests', {count: laundryApplications.length})}</h2>
                            {laundryApplications.length > 0 ? (
                                <div className="space-y-4">
                                    {laundryApplications.map(app => <ApplicationCard key={app.id} application={app} />)}
                                </div>
                            ) : (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                                    <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">{t('partnerManagement.noPendingRequestsTitle')}</h3>
                                </div>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                                <h2 className="text-2xl font-bold">{t('partnerManagement.activePartners', {count: partners.length})}</h2>
                                <button 
                                    onClick={handleDownloadFeed} 
                                    className="px-4 py-2 text-sm font-medium text-brand-dark dark:text-slate-100 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center space-x-2"
                                >
                                    <Icon name="arrow-down-tray" className="w-5 h-5" />
                                    <span>{t('partnerManagement.downloadFeed', { default: 'Download Product Feed' })}</span>
                                </button>
                            </div>
                            {partners.length > 0 ? (
                                <div className="space-y-4">
                                    {partners.map(p => <PartnerManagementCard key={p.id} partner={p} onEdit={handleEdit} onDelete={handleDelete}/>)}
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 py-8">{t('partnerManagement.noActivePartners')}</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'logistics' && (
                     <div className="space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-4">{t('partnerManagement.pendingRequests', {count: logisticsApplications.length})}</h2>
                             {logisticsApplications.length > 0 ? (
                                <div className="space-y-4">
                                    {logisticsApplications.map(app => <ApplicationCard key={app.id} application={app} />)}
                                </div>
                            ) : (
                                <div className="text-center p-8 border-2 border-dashed rounded-lg dark:border-slate-700">
                                    <Icon name="check" className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-slate-100">{t('partnerManagement.noPendingRequestsTitle')}</h3>
                                </div>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-4">{t('partnerManagement.activeLogisticsPartners', {count: logisticsPartners.length})}</h2>
                            <div className="space-y-4">
                                <form onSubmit={handleAddLogisticsPartner} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <input type="text" value={newLogisticsPartnerName} onChange={(e) => setNewLogisticsPartnerName(e.target.value)} placeholder={t('partnerManagement.addLogisticsPartnerPlaceholder')} className="flex-grow p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"/>
                                    <button type="submit" className="px-4 py-2 bg-brand-success text-white font-semibold rounded-lg hover:bg-opacity-90">{t('partnerManagement.addLogisticsPartnerButton')}</button>
                                </form>
                                {logisticsPartners.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg">
                                        <p className="font-semibold text-brand-dark dark:text-slate-100">{p.name}</p>
                                        <div className="flex items-center space-x-2">
                                            <button onClick={() => handleEditLogisticsPartner(p)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                                            <button onClick={() => handleDeleteLogisticsPartner(p.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {partnerToEdit && (
                <PartnerEditModal
                    partner={partnerToEdit}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSavePartner}
                />
            )}

            {logisticsPartnerToEdit && (
                <LogisticsPartnerEditModal 
                    partner={logisticsPartnerToEdit}
                    isOpen={isLogisticsEditModalOpen}
                    onClose={() => setIsLogisticsEditModalOpen(false)}
                    onSave={handleSaveLogisticsPartner}
                />
            )}
            
            <BulkFeatureEditModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, featureKey: null, featureName: null })}
                onSave={handleBulkSave}
                featureKey={modalState.featureKey}
                featureName={modalState.featureName}
            />
        </>
    );
};