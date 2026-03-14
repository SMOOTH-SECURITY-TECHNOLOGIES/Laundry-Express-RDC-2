import React from 'react';
import { useAppContext } from '../context/AppContext';
import type { Service } from '../types';
import { ServiceType } from '../types';

interface ServiceSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onNext, onBack }) => {
  const { orderDraft, updateOrderDraft, services, t } = useAppContext();

  // Comprehensive debugging
  React.useEffect(() => {
    console.group('🔍 ServiceSelector Debug Information');
    console.log('📦 orderDraft:', orderDraft);
    console.log('🤝 partner:', orderDraft.partner);
    console.log('🆔 partner serviceIds:', orderDraft.partner?.serviceIds);
    console.log('📋 all services:', services);
    console.log('🔢 services count:', services?.length || 0);
    console.log('🏷️ ServiceType enum:', ServiceType);
    console.groupEnd();
  }, [orderDraft, services]);

  const handleSelect = (service: Service) => {
    console.log('✅ Service selected:', service);
    
    // FIX: Changed property from .name to .title to match Service type
    if (!service.id || !service.title) {
      console.error('❌ Invalid service selected:', service);
      alert('Invalid service selected. Please try again.');
      return;
    }

    updateOrderDraft({ 
      serviceItems: [{ 
        service, 
        items: [], 
        weight: 0 
      }], 
      totalPrice: 0 
    });
    onNext();
  };

  // Enhanced null checking with detailed debug info
  if (!orderDraft.partner) {
    console.warn('⚠️ No partner selected in orderDraft');
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          {t?.('serviceSelector.error') || 'Configuration Error'}
        </h2>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          {t?.('serviceSelector.noPartnerSelected') || 'No partner has been selected.'}
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
          <p className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> orderDraft.partner is null or undefined
          </p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {t?.('common.back') || 'Back'}
        </button>
      </div>
    );
  }

  if (!orderDraft.partner.serviceIds || orderDraft.partner.serviceIds.length === 0) {
    console.warn('⚠️ Partner has no serviceIds:', orderDraft.partner);
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold mb-4 text-amber-600">
          {t?.('serviceSelector.noServices') || 'No Services Configured'}
        </h2>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          {t?.('serviceSelector.partnerNoServices') || 'This partner does not have any services available.'}
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-left">
          <p className="text-sm text-amber-800">
            <strong>Debug Info:</strong> Partner exists but serviceIds array is empty or missing
          </p>
          <p className="text-sm text-amber-800 mt-1">
            Partner: {orderDraft.partner.name} (ID: {orderDraft.partner.id})
          </p>
        </div>
        <button 
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {t?.('common.back') || 'Back'}
        </button>
      </div>
    );
  }

  // Safe data processing with type conversion
  const partnerServiceIds = new Set(
    orderDraft.partner.serviceIds.map(id => id.toString())
  );
  
  console.log('🎯 Partner service IDs (converted to string):', Array.from(partnerServiceIds));

  const availableServices = (services || []).filter(service => {
    const hasService = partnerServiceIds.has(service.id.toString());
    if (!hasService) {
      // FIX: Changed property from .name to .title to match Service type
      console.log(`❌ Service ${service.id} (${service.title}) not in partner's serviceIds`);
    }
    return hasService;
  });

  console.log('✅ Available services after filtering:', availableServices);

  if (availableServices.length === 0) {
    console.error('🚨 No services available after filtering. Check service ID matching.');
    // FIX: Changed property from .name to .title to match Service type
    console.log('🔍 All service IDs in system:', services?.map(s => ({ id: s.id, title: s.title })));
    
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          {t?.('serviceSelector.noServicesAvailable') || 'No Services Available'}
        </h2>
        <p className="text-gray-600 dark:text-slate-300 mb-4">
          No matching services found for this partner.
        </p>
        
        {/* Detailed debug information */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
          <h4 className="font-semibold text-red-800 mb-2">Debug Information:</h4>
          <div className="text-sm text-red-700 space-y-1">
            <p><strong>Partner ID:</strong> {orderDraft.partner.id}</p>
            <p><strong>Partner Service IDs:</strong> {orderDraft.partner.serviceIds.join(', ')}</p>
            <p><strong>Total Services in System:</strong> {services?.length || 0}</p>
            <p><strong>Available Services Found:</strong> {availableServices.length}</p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {t?.('common.back') || 'Back'}
        </button>
      </div>
    );
  }

  // Filter services by type with debug info
  const blanchisserieServices = availableServices.filter(s => {
    const isBlanchisserie = s.type === ServiceType.BLANCHISSERIE;
    // FIX: Changed property from .name to .title to match Service type
    console.log(`🧼 Service ${s.title} type: ${s.type}, isBlanchisserie: ${isBlanchisserie}`);
    return isBlanchisserie;
  });

  const pressingServices = availableServices.filter(s => {
    const isPressing = s.type === ServiceType.PRESSING;
    // FIX: Changed property from .name to .title to match Service type
    console.log(`👔 Service ${s.title} type: ${s.type}, isPressing: ${isPressing}`);
    return isPressing;
  });

  console.log('🧼 Blanchisserie services:', blanchisserieServices);
  console.log('👔 Pressing services:', pressingServices);

  return (
    <div className="service-selector p-6 max-w-4xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Debug Info</h3>
        <div className="text-sm text-blue-700 grid grid-cols-2 gap-2">
          <div>Partner: <strong>{orderDraft.partner.name}</strong></div>
          <div>Available Services: <strong>{availableServices.length}</strong></div>
          <div>Laundry Services: <strong>{blanchisserieServices.length}</strong></div>
          <div>Pressing Services: <strong>{pressingServices.length}</strong></div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">
        {t?.('serviceSelector.title') || 'Select a Service'}
      </h2>
      
      {/* Blanchisserie Services Section */}
      {blanchisserieServices.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {t?.('serviceTypes.BLANCHISSERIE') || 'Laundry Services'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blanchisserieServices.map(service => (
              <button
                key={service.id}
                onClick={() => handleSelect(service)}
                className="p-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors text-left group"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700">
                  {/* FIX: Changed property from .name to .title to match Service type */}
                  {service.title}
                </h4>
                {service.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                    {service.description}
                  </p>
                )}
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {/* FIX: Changed property from .basePrice to .price to match Service type */}
                    {t?.('common.fromPrice', { price: service.price }) || `From $${service.price}`}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {service.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pressing Services Section */}
      {pressingServices.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {t?.('serviceTypes.PRESSING') || 'Pressing Services'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pressingServices.map(service => (
              <button
                key={service.id}
                onClick={() => handleSelect(service)}
                className="p-4 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-green-50 dark:hover:bg-slate-700 transition-colors text-left group"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700">
                  {/* FIX: Changed property from .name to .title to match Service type */}
                  {service.title}
                </h4>
                {service.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">
                    {service.description}
                  </p>
                )}
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {/* FIX: Changed property from .basePrice to .price to match Service type */}
                    {t?.('common.fromPrice', { price: service.price }) || `From $${service.price}`}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {service.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No services message - should not reach here due to earlier check */}
      {blanchisserieServices.length === 0 && pressingServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No services available for selection.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-600">
        <button 
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          {t?.('common.back') || 'Back'}
        </button>
      </div>
    </div>
  );
};