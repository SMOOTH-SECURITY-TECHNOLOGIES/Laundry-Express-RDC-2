import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PromoCode, ServiceType } from '../../types';
import { Icon } from '../../components/Icon';
import { MarketingAssistant } from '../../components/partner/MarketingAssistant';

const initialFormState: Omit<PromoCode, 'id' | 'createdAt' | 'partnerId'> = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderValue: 0,
  isForNewUsersOnly: false,
  isActive: true,
  maxUsage: null,
  usageLimitPerCustomer: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: null,
  applicableServices: [],
  description: '',
  geographicRestrictions: [],
};

export const PromoManagement: React.FC = () => {
  const { user, promoCodes, addPromoCode, updatePromoCode, deletePromoCode, t, services } = useAppContext();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkOperation, setBulkOperation] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');

  const partnerPromoCodes = useMemo(() => {
    if (!user?.partnerId) return [];
    return promoCodes.filter(p => p.partnerId === user.partnerId);
  }, [promoCodes, user]);

  const filteredPromoCodes = useMemo(() => {
    const now = new Date();
    return partnerPromoCodes.filter(promo => {
      const isExpired = promo.endDate && new Date(promo.endDate) < now;
      
      switch (viewMode) {
        case 'active': return promo.isActive && !isExpired;
        case 'inactive': return !promo.isActive;
        case 'expired': return isExpired;
        default: return true;
      }
    });
  }, [partnerPromoCodes, viewMode]);

  const analytics = useMemo(() => {
    const now = new Date();
    const total = partnerPromoCodes.length;
    const active = partnerPromoCodes.filter(p => p.isActive && (!p.endDate || new Date(p.endDate) >= now)).length;
    const expired = partnerPromoCodes.filter(p => p.endDate && new Date(p.endDate) < now).length;
    const totalUsage = partnerPromoCodes.reduce((sum, promo) => sum + (promo.usageCount || 0), 0);
    
    return { total, active, expired, totalUsage };
  }, [partnerPromoCodes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? null : parseFloat(value),
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      applicableServices: prev.applicableServices.includes(serviceId)
        ? prev.applicableServices.filter(id => id !== serviceId)
        : [...prev.applicableServices, serviceId]
    }));
  };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({...prev, code: e.target.value.toUpperCase()}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discountValue <= 0) {
        alert(t('promoManagement.formError'));
        return;
    }
    if (!user?.partnerId) {
        alert(t('partnerPromoManagement.errorNoPartner'));
        return;
    }

    // Validate dates
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        alert(t('promoManagement.invalidDateRange'));
        return;
    }

    const promoDataWithPartner = { ...formData, partnerId: user.partnerId };

    if(editingId) {
        updatePromoCode({ ...promoDataWithPartner, id: editingId, createdAt: promoCodes.find(p=>p.id === editingId)!.createdAt });
    } else {
        addPromoCode(promoDataWithPartner);
    }
    
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormVisible(false);
  };
  
  const handleEdit = (promo: PromoCode) => {
    setFormData({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderValue: promo.minOrderValue || 0,
        isForNewUsersOnly: promo.isForNewUsersOnly || false,
        isActive: promo.isActive,
        maxUsage: promo.maxUsage,
        usageLimitPerCustomer: promo.usageLimitPerCustomer || 1,
        startDate: promo.startDate || new Date().toISOString().split('T')[0],
        endDate: promo.endDate,
        applicableServices: promo.applicableServices || [],
        description: promo.description || '',
        geographicRestrictions: promo.geographicRestrictions || [],
    });
    setEditingId(promo.id);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormVisible(false);
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('promoManagement.confirmDelete'))) {
        deletePromoCode(id);
    }
  };

  const toggleStatus = (promo: PromoCode) => {
    updatePromoCode({ ...promo, isActive: !promo.isActive });
  };

  const handleUsePromoFromAssistant = (promoData: any) => {
    setFormData(prev => ({...initialFormState, ...promoData}));
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleBulkOperation = () => {
    if (!bulkOperation || selectedCodes.length === 0) return;

    switch (bulkOperation) {
      case 'activate':
        selectedCodes.forEach(id => {
          const promo = promoCodes.find(p => p.id === id);
          if (promo) updatePromoCode({ ...promo, isActive: true });
        });
        break;
      case 'deactivate':
        selectedCodes.forEach(id => {
          const promo = promoCodes.find(p => p.id === id);
          if (promo) updatePromoCode({ ...promo, isActive: false });
        });
        break;
      case 'delete':
        if (window.confirm(t('promoManagement.confirmBulkDelete', { count: selectedCodes.length }))) {
          selectedCodes.forEach(id => deletePromoCode(id));
        }
        break;
    }

    setSelectedCodes([]);
    setBulkOperation(null);
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedCodes(checked ? filteredPromoCodes.map(p => p.id) : []);
  };

  const toggleSelectCode = (id: string, checked: boolean) => {
    setSelectedCodes(prev => 
      checked ? [...prev, id] : prev.filter(codeId => codeId !== id)
    );
  };

  const exportPromoCodes = () => {
    const csv = [
      ['Code', 'Discount', 'Type', 'Min Order', 'Usage', 'Status', 'Start Date', 'End Date', 'Description'],
      ...filteredPromoCodes.map(promo => [
        promo.code,
        promo.discountValue,
        promo.discountType,
        promo.minOrderValue || 0,
        promo.usageCount || 0,
        promo.isActive ? 'Active' : 'Inactive',
        promo.startDate || 'N/A',
        promo.endDate || 'N/A',
        promo.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-3xl font-bold dark:text-slate-100">{t('partnerPromoManagement.title')}</h1>
        
        {/* Analytics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-card text-center">
            <div className="text-2xl font-bold text-brand-blue">{analytics.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('promoManagement.totalCodes')}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-card text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.active}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('promoManagement.activeCodes')}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-card text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics.expired}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('promoManagement.expiredCodes')}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-card text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.totalUsage}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('promoManagement.totalUsage')}</div>
          </div>
        </div>
      </div>
      
      <MarketingAssistant onUsePromo={handleUsePromoFromAssistant} />

      {/* Bulk Operations */}
      {selectedCodes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-blue-800 dark:text-blue-200">
            {t('promoManagement.selectedCount', { count: selectedCodes.length })}
          </span>
          <div className="flex flex-wrap gap-2">
            <select 
              value={bulkOperation || ''} 
              onChange={(e) => setBulkOperation(e.target.value as any)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="">{t('promoManagement.selectAction')}</option>
              <option value="activate">{t('promoManagement.activate')}</option>
              <option value="deactivate">{t('promoManagement.deactivate')}</option>
              <option value="delete">{t('promoManagement.delete')}</option>
            </select>
            <button 
              onClick={handleBulkOperation}
              disabled={!bulkOperation}
              className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
            >
              {t('promoManagement.apply')}
            </button>
            <button 
              onClick={() => setSelectedCodes([])}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {t('promoManagement.clear')}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* View Filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'inactive', 'expired'] as const).map(view => (
            <button
              key={view}
              onClick={() => setViewMode(view)}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === view 
                  ? 'bg-brand-blue text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t(`promoManagement.${view}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4">
          <button 
            onClick={exportPromoCodes}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
          >
            <Icon name="document-arrow-down" className="w-5 h-5" />
            <span>{t('promoManagement.export')}</span>
          </button>
          
          {!isFormVisible && (
            <button 
              onClick={() => { setFormData(initialFormState); setEditingId(null); setIsFormVisible(true); }}
              className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
              <Icon name="pencil" className="w-5 h-5" />
              <span>{t('promoManagement.createCode')}</span>
            </button>
          )}
        </div>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700 animate-fade-in">
          <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">
            {editingId ? t('partnerPromoManagement.editMyCode') : t('partnerPromoManagement.newCode')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.code')} *
                </label>
                <input 
                  type="text" 
                  name="code" 
                  value={formData.code} 
                  onChange={handleCodeChange} 
                  required 
                  className="mt-1 w-full p-2 border rounded-lg uppercase dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                  placeholder={t('partnerPromoManagement.codePlaceholder')} 
                />
              </div>
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.discountType')}
                </label>
                <select 
                  name="discountType" 
                  value={formData.discountType} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                >
                  <option value="percentage">{t('promoManagement.percentage')}</option>
                  <option value="fixed">{t('promoManagement.fixedAmount')}</option>
                </select>
              </div>
            </div>

            {/* Discount Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.discountValue')} *
                </label>
                <input 
                  type="number" 
                  name="discountValue" 
                  value={formData.discountValue} 
                  onChange={handleInputChange} 
                  required 
                  min="0" 
                  step="0.01" 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                />
              </div>
              <div>
                <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.minOrderValue')}
                </label>
                <input 
                  type="number" 
                  name="minOrderValue" 
                  value={formData.minOrderValue || ''} 
                  onChange={handleInputChange} 
                  min="0" 
                  step="1" 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                />
              </div>
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxUsage" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.maxUsage')}
                </label>
                <input 
                  type="number" 
                  name="maxUsage" 
                  value={formData.maxUsage || ''} 
                  onChange={handleInputChange} 
                  min="0" 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                  placeholder={t('promoManagement.unlimited')}
                />
              </div>
              <div>
                <label htmlFor="usageLimitPerCustomer" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.usagePerCustomer')}
                </label>
                <input 
                  type="number" 
                  name="usageLimitPerCustomer" 
                  value={formData.usageLimitPerCustomer} 
                  onChange={handleInputChange} 
                  min="1" 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.startDate')}
                </label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('promoManagement.endDate')}
                </label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={formData.endDate || ''} 
                  onChange={handleInputChange} 
                  className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" 
                />
              </div>
            </div>

            {/* Service Restrictions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {t('promoManagement.applicableServices')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {services.map(service => (
                  <label key={service.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.applicableServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="h-4 w-4 text-brand-blue rounded border-gray-300"
                    />
                    {/* FIX: The Service type does not have a 'name' property; it uses 'title' instead. The code has been updated to access 'service.title' to correctly display the service's name. */}
                    <span className="text-sm text-gray-700 dark:text-slate-300">{service.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                {t('promoManagement.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                placeholder={t('promoManagement.descriptionPlaceholder')}
              />
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isForNewUsersOnly" 
                  name="isForNewUsersOnly" 
                  checked={!!formData.isForNewUsersOnly} 
                  onChange={handleInputChange} 
                  className="h-4 w-4 text-brand-blue rounded border-gray-300" 
                />
                <label htmlFor="isForNewUsersOnly" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">
                  {t('promoManagement.newUsersOnly')}
                </label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleInputChange} 
                  className="h-4 w-4 text-brand-blue rounded border-gray-300" 
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">
                  {t('promoManagement.active')}
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-600">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
              >
                {t('promoManagement.cancel')}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90"
              >
                {editingId ? t('promoManagement.saveChanges') : t('promoManagement.create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promo Codes List */}
      <div className="bg-white p-6 rounded-2xl shadow-card dark:bg-slate-800 dark:border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">
          {t('partnerPromoManagement.myCreatedCodes', { count: filteredPromoCodes.length })}
        </h2>
        
        {/* Mobile Card View */}
        <div className="space-y-4 md:hidden">
          {filteredPromoCodes.map(promo => {
            const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
            return (
              <div key={promo.id} className="p-4 bg-slate-50 border rounded-lg dark:bg-slate-700/50 dark:border-slate-600">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono font-semibold text-brand-dark dark:text-slate-100">{promo.code}</p>
                    <p className="text-sm">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' $'}</p>
                    {promo.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{promo.description}</p>
                    )}
                  </div>
                  <span 
                    onClick={() => toggleStatus(promo)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      isExpired 
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                        : promo.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                    }`}
                  >
                    {isExpired ? t('promoManagement.expired') : promo.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t text-xs text-slate-600 dark:text-slate-400">
                  <strong>{t('promoManagement.conditions')}:</strong> 
                  {promo.minOrderValue ? ` ${t('promoManagement.minAmount', { amount: promo.minOrderValue })}` : ''}
                  {promo.minOrderValue && promo.isForNewUsersOnly ? ' &' : ''}
                  {promo.isForNewUsersOnly ? ` ${t('promoManagement.newUsersOnly')}` : ''}
                  {!promo.minOrderValue && !promo.isForNewUsersOnly ? ` ${t('promoManagement.noConditions')}` : ''}
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <strong>{t('partnerPromoManagement.usage')}:</strong> {promo.usageCount || 0}
                  {promo.maxUsage && ` / ${promo.maxUsage}`}
                </div>
                {promo.endDate && (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    <strong>{t('promoManagement.validUntil')}:</strong> {new Date(promo.endDate).toLocaleDateString()}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t flex justify-end space-x-2">
                  <button onClick={() => handleEdit(promo)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/40">
                    <Icon name="pencil" className="w-5 h-5"/>
                  </button>
                  <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:hover:bg-red-900/40">
                    <Icon name="xmark" className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedCodes.length === filteredPromoCodes.length && filteredPromoCodes.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-brand-blue rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3">{t('promoManagement.code')}</th>
                <th className="px-6 py-3">{t('promoManagement.discount')}</th>
                <th className="px-6 py-3">{t('promoManagement.conditions')}</th>
                <th className="px-6 py-3 text-center">{t('partnerPromoManagement.usage')}</th>
                <th className="px-6 py-3">{t('promoManagement.validity')}</th>
                <th className="px-6 py-3">{t('promoManagement.status')}</th>
                <th className="px-6 py-3">{t('promoManagement.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromoCodes.map(promo => {
                const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                return (
                  <tr key={promo.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(promo.id)}
                        onChange={(e) => toggleSelectCode(promo.id, e.target.checked)}
                        className="h-4 w-4 text-brand-blue rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-semibold text-brand-dark dark:text-slate-100">{promo.code}</div>
                        {promo.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{promo.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' $'}</td>
                    <td className="px-6 py-4 text-xs">
                      {promo.minOrderValue ? t('promoManagement.minAmount', { amount: promo.minOrderValue }) : ''}
                      {promo.minOrderValue && promo.isForNewUsersOnly ? ' & ' : ''}
                      {promo.isForNewUsersOnly ? t('promoManagement.newUsersOnly') : ''}
                      {!promo.minOrderValue && !promo.isForNewUsersOnly ? t('promoManagement.noConditions') : ''}
                      {promo.applicableServices && promo.applicableServices.length > 0 && (
                        <div className="mt-1 text-slate-500">
                          {t('promoManagement.services')}: {promo.applicableServices.length}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-center">
                      {promo.usageCount || 0}
                      {promo.maxUsage && ` / ${promo.maxUsage}`}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {promo.startDate && (
                        <div>{new Date(promo.startDate).toLocaleDateString()}</div>
                      )}
                      {promo.endDate && (
                        <div>→ {new Date(promo.endDate).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        onClick={() => toggleStatus(promo)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                          isExpired 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                            : promo.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        }`}
                      >
                        {isExpired ? t('promoManagement.expired') : promo.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleEdit(promo)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg dark:hover:bg-blue-900/40">
                        <Icon name="pencil" className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg dark:hover:bg-red-900/40">
                        <Icon name="xmark" className="w-5 h-5"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredPromoCodes.length === 0 && (
          <p className="text-center text-slate-500 py-8">{t('partnerPromoManagement.noPromoCodes')}</p>
        )}
      </div>
    </div>
  );
};