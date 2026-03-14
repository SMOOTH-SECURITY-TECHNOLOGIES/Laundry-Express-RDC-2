import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Service } from '../../types';
import { Icon } from '../../components/Icon';
import { ServiceEditModal } from '../../components/ServiceEditModal';

export const ServiceManagement: React.FC = () => {
    const { services, addService, updateService, deleteService, t } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

    const handleOpenModal = (service: Service | null) => {
        setServiceToEdit(service);
        setIsModalOpen(true);
    };

    const handleSaveService = async (serviceData: Service) => {
        // The service ID is handled by the API, but we need to pass a placeholder for new services
        const serviceToSave = serviceToEdit ? serviceData : {...serviceData, id: `new-${Date.now()}`};
        
        if (serviceToEdit) {
            await updateService(serviceToSave);
        } else {
            const { id, ...newServiceData } = serviceToSave;
            await addService(newServiceData);
        }
        setIsModalOpen(false);
        setServiceToEdit(null);
    };

    const handleDeleteService = async (serviceId: string) => {
        if (window.confirm(t('serviceManagement.confirmDelete'))) {
            await deleteService(serviceId);
        }
    };
    
    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{t('serviceManagement.title')}</h1>
                    <button
                        onClick={() => handleOpenModal(null)}
                        className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
                    >
                        <Icon name="sparkles" className="w-5 h-5" />
                        <span>{t('serviceManagement.addService')}</span>
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4">{t('serviceManagement.platformServices', { count: services.length })}</h2>
                    <div className="space-y-4">
                        {services.length > 0 ? (
                            services.map(service => (
                                <div key={service.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border dark:border-slate-700 flex items-start space-x-4">
                                    <img src={service.imageUrl} alt={t('serviceCard.altText', { title: service.title })} className="w-20 h-20 object-cover rounded-md shrink-0" />
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-brand-dark dark:text-slate-100">{service.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{service.description}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('partnerProfileManagement.serviceType')}: {t(`serviceType.${service.type}`)}</p>
                                        {service.priceModel === 'per_kg' && (
                                            <p className="text-sm font-semibold text-brand-blue mt-2">{service.price?.toFixed(2)} $ / kg</p>
                                        )}
                                        {service.priceModel === 'per_item' && (
                                            <p className="text-sm font-semibold text-brand-blue mt-2">{t('serviceSelector.ratesPerItem')}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col space-y-2 shrink-0">
                                        <button onClick={() => handleOpenModal(service)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteService(service.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-4">{t('serviceManagement.noServices')}</p>
                        )}
                    </div>
                </div>
            </div>
            
            <ServiceEditModal
                service={serviceToEdit}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setServiceToEdit(null);
                }}
                onSave={handleSaveService}
            />
        </>
    );
};