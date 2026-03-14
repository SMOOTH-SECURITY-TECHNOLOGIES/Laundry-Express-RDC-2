import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PromoCode } from '../../types';
import { Icon } from '../../components/Icon';

const initialFormState: Omit<PromoCode, 'id' | 'createdAt'> = {
  code: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderValue: 0,
  isForNewUsersOnly: false,
  isActive: true,
  partnerId: undefined // Admin codes are platform-wide
};

const CreatorName: React.FC<{ partnerId?: string }> = ({ partnerId }) => {
    const { getPartnerById, t } = useAppContext();
    const name = useMemo(() => {
        if (!partnerId) return t('promoManagement.platform');
        return getPartnerById(partnerId)?.name || partnerId;
    }, [partnerId, getPartnerById, t]);
    return <>{name}</>;
};

const PromoCard: React.FC<{ 
    promo: PromoCode; 
    onEdit: () => void; 
    onDelete: () => void; 
    onToggleStatus: () => void;
}> = ({ promo, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useAppContext();
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-mono font-semibold text-brand-dark dark:text-slate-100">{promo.code}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' $'}</p>
                </div>
                <span onClick={onToggleStatus} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${promo.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                    {promo.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                </span>
            </div>
            <div className="mt-2 pt-2 border-t dark:border-slate-600 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p><strong>{t('promoManagement.conditions')}:</strong> 
                    {promo.minOrderValue ? ` ${t('promoManagement.minAmount', { amount: promo.minOrderValue })}` : ''}
                    {promo.minOrderValue && promo.isForNewUsersOnly ? ' &' : ''}
                    {promo.isForNewUsersOnly ? ` ${t('promoManagement.newUsersOnly')}` : ''}
                    {!promo.minOrderValue && !promo.isForNewUsersOnly ? ` ${t('promoManagement.noConditions')}` : ''}
                </p>
                <p><strong>{t('promoManagement.createdBy')}:</strong> <CreatorName partnerId={promo.partnerId} /></p>
            </div>
            <div className="mt-2 pt-2 border-t dark:border-slate-600 flex justify-end space-x-2">
                <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
            </div>
        </div>
    );
};

export const PromoManagement: React.FC = () => {
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode, t } = useAppContext();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({
            ...prev,
            [name]: name === 'discountValue' || name === 'minOrderValue' ? parseFloat(value) : value,
        }));
    }
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

    if(editingId) {
        const originalPromo = promoCodes.find(p => p.id === editingId);
        if (originalPromo) {
            updatePromoCode({ ...formData, id: editingId, createdAt: originalPromo.createdAt, partnerId: originalPromo.partnerId });
        }
    } else {
        addPromoCode(formData);
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
        partnerId: promo.partnerId
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('promoManagement.title')}</h1>
        {!isFormVisible && (
            <button 
                onClick={() => setIsFormVisible(true)}
                className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
                <Icon name="sparkles" className="w-5 h-5" />
                <span>{t('promoManagement.createCode')}</span>
            </button>
        )}
      </div>

      {isFormVisible && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <h2 className="text-2xl font-bold mb-4">{editingId ? t('promoManagement.editCode') : t('promoManagement.newCode')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('promoManagement.code')}</label>
                          <input type="text" name="code" value={formData.code} onChange={handleCodeChange} required className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg uppercase dark:bg-slate-700" />
                      </div>
                      <div>
                          <label htmlFor="discountType" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('promoManagement.discountType')}</label>
                          <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                              <option value="percentage">{t('promoManagement.percentage')}</option>
                              <option value="fixed">{t('promoManagement.fixedAmount')}</option>
                          </select>
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('promoManagement.discountValue')}</label>
                          <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} required min="0" step="0.01" className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                      </div>
                       <div>
                          <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('promoManagement.minOrderValue')}</label>
                          <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleInputChange} min="0" step="1" className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                      </div>
                   </div>
                   <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                           <input type="checkbox" id="isForNewUsersOnly" name="isForNewUsersOnly" checked={!!formData.isForNewUsersOnly} onChange={handleInputChange} className="h-4 w-4 text-brand-blue rounded border-gray-300" />
                           <label htmlFor="isForNewUsersOnly" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">{t('promoManagement.newUsersOnly')}</label>
                      </div>
                      <div className="flex items-center">
                           <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4 text-brand-blue rounded border-gray-300" />
                           <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">{t('promoManagement.active')}</label>
                      </div>
                   </div>
                   <div className="flex justify-end space-x-2 pt-2">
                       <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                           {t('promoManagement.cancel')}
                       </button>
                       <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                           {editingId ? t('promoManagement.saveChanges') : t('promoManagement.create')}
                       </button>
                   </div>
              </form>
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4">{t('promoManagement.existingCodes', { count: promoCodes.length })}</h2>
        
        <div className="space-y-4 md:hidden">
            {promoCodes.map(promo => (
                <PromoCard 
                    key={promo.id}
                    promo={promo}
                    onEdit={() => handleEdit(promo)}
                    onDelete={() => handleDelete(promo.id)}
                    onToggleStatus={() => toggleStatus(promo)}
                />
            ))}
        </div>
        
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-3">{t('promoManagement.code')}</th>
                <th className="px-6 py-3">{t('promoManagement.discount')}</th>
                <th className="px-6 py-3">{t('promoManagement.conditions')}</th>
                <th className="px-6 py-3">{t('promoManagement.createdBy')}</th>
                <th className="px-6 py-3">{t('promoManagement.status')}</th>
                <th className="px-6 py-3">{t('promoManagement.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map(promo => (
                <tr key={promo.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-mono font-semibold text-brand-dark dark:text-slate-100">{promo.code}</td>
                  <td className="px-6 py-4">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' $'}</td>
                  <td className="px-6 py-4 text-xs">
                      {promo.minOrderValue ? <span>{t('promoManagement.minAmount', { amount: promo.minOrderValue })}</span> : ''}
                      {promo.minOrderValue && promo.isForNewUsersOnly ? <br/> : ''}
                      {promo.isForNewUsersOnly ? <span>{t('promoManagement.newUsersOnly')}</span> : ''}
                      {!promo.minOrderValue && !promo.isForNewUsersOnly ? <span>{t('promoManagement.noConditions')}</span> : ''}
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold"><CreatorName partnerId={promo.partnerId} /></td>
                  <td className="px-6 py-4">
                    <span 
                        onClick={() => toggleStatus(promo)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${promo.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}
                    >
                      {promo.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => handleEdit(promo)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {promoCodes.length === 0 && (
          <p className="text-center text-slate-500 py-8">{t('promoManagement.noPromoCodes')}</p>
        )}
      </div>
    </div>
  );
};