import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Advertisement } from '../../types';
import { Icon } from '../../components/Icon';

const initialFormState: Omit<Advertisement, 'id' | 'createdAt'> = {
  title: '',
  description: '',
  imageUrl: '',
  linkUrl: '',
  isActive: true,
};

const AdCard: React.FC<{
    ad: Advertisement;
    onEdit: () => void;
    onDelete: () => void;
    onToggleStatus: () => void;
}> = ({ ad, onEdit, onDelete, onToggleStatus }) => {
    const { t } = useAppContext();
    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-700 rounded-lg">
            <div className="flex items-start space-x-4">
                <img src={ad.imageUrl} alt={t('adBanner.altText', { title: ad.title })} className="w-24 h-16 object-cover rounded"/>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-brand-dark dark:text-slate-100">{ad.title}</h3>
                        <span onClick={onToggleStatus} className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${ad.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                            {ad.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ad.description}</p>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t dark:border-slate-600 flex justify-end space-x-2">
                <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
            </div>
        </div>
    );
}

export const AdManagement: React.FC = () => {
  const { advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement, t } = useAppContext();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl || !formData.linkUrl) {
        alert(t('adManagement.validationError')); // Simple validation
        return;
    }

    if(editingId) {
        const originalAd = advertisements.find(p => p.id === editingId);
        if (originalAd) {
            updateAdvertisement({ ...formData, id: editingId, createdAt: originalAd.createdAt });
        }
    } else {
        addAdvertisement(formData);
    }
    
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormVisible(false);
  };
  
  const handleEdit = (ad: Advertisement) => {
    setFormData({
        title: ad.title,
        description: ad.description,
        imageUrl: ad.imageUrl,
        linkUrl: ad.linkUrl,
        isActive: ad.isActive,
    });
    setEditingId(ad.id);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsFormVisible(false);
  }

  const handleDelete = (id: string) => {
    if (window.confirm(t('adManagement.confirmDelete'))) {
        deleteAdvertisement(id);
    }
  };

  const toggleStatus = (ad: Advertisement) => {
    updateAdvertisement({ ...ad, isActive: !ad.isActive });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('adManagement.title')}</h1>
        {!isFormVisible && (
            <button 
                onClick={() => setIsFormVisible(true)}
                className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
            >
                <Icon name="pencil" className="w-5 h-5" />
                <span>{t('adManagement.createAd')}</span>
            </button>
        )}
      </div>

      {isFormVisible && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
              <h2 className="text-2xl font-bold mb-4">{editingId ? t('adManagement.editAd') : t('adManagement.newAd')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('adManagement.adTitle')}</label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                  </div>
                  <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('adManagement.description')}</label>
                      <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={3} className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" />
                  </div>
                  <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('adManagement.imageUrl')}</label>
                      <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} required className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" placeholder="https://..." />
                  </div>
                  <div>
                      <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('adManagement.linkUrl')}</label>
                      <input type="url" name="linkUrl" value={formData.linkUrl} onChange={handleInputChange} required className="mt-1 w-full p-2 border dark:border-slate-600 rounded-lg dark:bg-slate-700" placeholder="https://..." />
                  </div>
                   <div className="flex items-center">
                       <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4 text-brand-blue rounded border-gray-300" />
                       <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-slate-200">{t('adManagement.active')}</label>
                   </div>
                   <div className="flex justify-end space-x-2 pt-2">
                       <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-slate-600 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500">
                           {t('adManagement.cancel')}
                       </button>
                       <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-success rounded-lg hover:bg-opacity-90">
                           {editingId ? t('adManagement.save') : t('adManagement.create')}
                       </button>
                   </div>
              </form>
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-4">{t('adManagement.existingAds', { count: advertisements.length })}</h2>
        
        <div className="space-y-4 md:hidden">
            {advertisements.map(ad => (
                <AdCard 
                    key={ad.id}
                    ad={ad}
                    onEdit={() => handleEdit(ad)}
                    onDelete={() => handleDelete(ad.id)}
                    onToggleStatus={() => toggleStatus(ad)}
                />
            ))}
        </div>
        
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-3">{t('adManagement.adTitle')}</th>
                <th className="px-6 py-3">{t('adManagement.status')}</th>
                <th className="px-6 py-3">{t('adManagement.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {advertisements.map(ad => (
                <tr key={ad.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                        <img src={ad.imageUrl} alt={t('adBanner.altText', { title: ad.title })} className="w-16 h-10 object-cover rounded"/>
                        <div>
                            <p className="font-semibold text-brand-dark dark:text-slate-100">{ad.title}</p>
                            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-blue hover:underline truncate">{ad.linkUrl}</a>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                        onClick={() => toggleStatus(ad)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${ad.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}
                    >
                      {ad.isActive ? t('promoManagement.active') : t('promoManagement.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex space-x-2">
                    <button onClick={() => handleEdit(ad)} className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg"><Icon name="pencil" className="w-5 h-5"/></button>
                    <button onClick={() => handleDelete(ad.id)} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg"><Icon name="xmark" className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {advertisements.length === 0 && (
          <p className="text-center text-slate-500 py-8">{t('adManagement.noAds')}</p>
        )}
      </div>
    </div>
  );
};