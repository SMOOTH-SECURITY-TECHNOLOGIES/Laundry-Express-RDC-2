import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Icon } from '../components/Icon';
import { PartnerType } from '../types';
import { trackEvent } from '../utils/tracking';
import { sendServerSideEvent } from '../utils/capi';

export const BecomePartnerPage: React.FC = () => {
  const { setCurrentPage, submitPartnerApplication, addNotification, applicationSettings, t } = useAppContext();
  const [formData, setFormData] = useState({
    companyName: '',
    partnerType: null as PartnerType | null,
    contactName: '',
    phone: '',
    email: '',
    address: '',
    message: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const partnerTypeOptions = useMemo(() => [
    { 
        type: PartnerType.PRESSING,
        icon: 'shirt',
        title: t('becomePartnerPage.dryCleaning'),
        description: t('becomePartnerPage.dryCleaningDesc'),
        enabled: applicationSettings[PartnerType.PRESSING],
    },
    { 
        type: PartnerType.LAVANDIER,
        icon: 'wash',
        title: t('becomePartnerPage.lavandier'),
        description: t('becomePartnerPage.lavandierDesc'),
        enabled: applicationSettings[PartnerType.LAVANDIER],
    },
    { 
        type: PartnerType.LOGISTICS,
        icon: 'truck',
        title: t('becomePartnerPage.logisticsPartner'),
        description: t('becomePartnerPage.logisticsPartnerDesc'),
        enabled: applicationSettings[PartnerType.LOGISTICS],
    },
  ], [t, applicationSettings]);

  const availablePartnerTypes = useMemo(() => partnerTypeOptions.filter(opt => opt.enabled), [partnerTypeOptions]);

  const handleTypeSelect = (type: PartnerType) => {
    setFormData(prev => ({ ...prev, partnerType: type }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.companyName.trim()) newErrors.companyName = t('validation.required');
    if (!formData.contactName.trim()) newErrors.contactName = t('validation.required');
    if (!formData.email.trim()) {
      newErrors.email = t('validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.required');
    } else if (!/^08\d{8}$/.test(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }
    if (!formData.address.trim()) newErrors.address = t('validation.required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsLoading(true);

    try {
        await submitPartnerApplication(formData as any);
        trackEvent('Lead', {
            lead_type: 'Partner Application',
            value: 50, // Arbitrary value for a partner lead
            currency: 'USD'
        });

        // --- BEGIN CAPI INTEGRATION ---
        const [firstName, ...lastNameParts] = formData.contactName.split(' ');
        const lastName = lastNameParts.join(' ');
        sendServerSideEvent('Lead', {
            value: 50,
            currency: 'USD',
            content_name: 'Partner Application',
            user_data: {
                email: formData.email,
                phone_number: formData.phone,
                address: {
                    first_name: firstName,
                    last_name: lastName,
                }
            }
        });
        // --- END CAPI INTEGRATION ---

        setSubmitted(true);
    } catch (err) {
        addNotification(t('becomePartnerPage.submitError', { default: "Une erreur s'est produite. Veuillez réessayer."}), 'error');
    } finally {
        setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
           <Icon name="check" className="h-8 w-8 text-brand-success" />
        </div>
        <h1 className="text-3xl font-bold text-brand-dark dark:text-slate-100">{t('becomePartnerPage.thanks')}</h1>
        <p className="text-gray-600 dark:text-slate-300 mt-4">
          {t('becomePartnerPage.requestSent')}
        </p>
        <button
          // FIX: Call setCurrentPage with a PageObject.
          onClick={() => setCurrentPage({ name: 'home' })}
          className="mt-8 px-8 py-3 bg-brand-blue text-white font-bold rounded-full text-lg hover:bg-opacity-90 transform hover:scale-105 transition-transform duration-300"
        >
          {t('becomePartnerPage.backToHome')}
        </button>
      </div>
    );
  }

  // Étape 1: Sélection du type de partenaire
  if (!formData.partnerType) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-brand-dark dark:text-slate-100">{t('becomePartnerPage.becomePartner')}</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-slate-300">
            {t('becomePartnerPage.joinUs')}
          </p>
        </div>
        {availablePartnerTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {availablePartnerTypes.map(option => (
                    <button
                        key={option.type}
                        onClick={() => handleTypeSelect(option.type)}
                        className="bg-white dark:bg-slate-800 rounded-xl shadow-card dark:shadow-none hover:shadow-card-hover border-2 border-transparent hover:border-brand-blue dark:border-slate-700 dark:hover:border-brand-blue transition-all duration-300 p-6 text-center space-y-4 flex flex-col items-center justify-center"
                    >
                        <Icon name={option.icon as 'shirt' | 'wash' | 'truck'} className="w-16 h-16 text-brand-blue mx-auto" />
                        <h3 className="font-bold text-2xl">{option.title}</h3>
                        <p className="text-gray-600 dark:text-slate-300">{option.description}</p>
                    </button>
                ))}
            </div>
        ) : (
            <div className="text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
                <p>{t('becomePartnerPage.applicationsClosed', { default: "Partner applications are currently closed. Please check back later."})}</p>
            </div>
        )}
      </div>
    );
  }

  // Étape 2: Formulaire d'inscription
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-brand-dark dark:text-slate-100">{t('becomePartnerPage.partnerRegistration')}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-slate-300">
          {t('becomePartnerPage.fillForm')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('becomePartnerPage.serviceType')}</label>
            <div className="flex justify-between items-center p-3 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600">
                <p className="font-semibold text-brand-dark dark:text-slate-100">
                    {formData.partnerType === PartnerType.PRESSING && t('becomePartnerPage.pressingPerItem')}
                    {formData.partnerType === PartnerType.LAVANDIER && t('becomePartnerPage.lavandierPerKg')}
                    {formData.partnerType === PartnerType.LOGISTICS && t('becomePartnerPage.logisticsPartner')}
                </p>
                <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({...prev, partnerType: null}))}
                    className="text-sm text-brand-blue hover:underline font-medium"
                >
                    {t('becomePartnerPage.change')}
                </button>
            </div>
          </div>

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.companyName')}</label>
            <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.companyName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.contactName')}</label>
              <input type="text" name="contactName" id="contactName" value={formData.contactName} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.contactName ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
              {errors.contactName && <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.phone')}</label>
              <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.address')}</label>
            <textarea name="address" id="address" rows={3} value={formData.address} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.address ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}></textarea>
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('becomePartnerPage.message')}</label>
            <textarea name="message" id="message" rows={3} value={formData.message} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100"></textarea>
          </div>
          
          <div className="text-right">
             <button 
                type="submit" 
                disabled={isLoading}
                className="px-8 py-3 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 text-lg disabled:bg-slate-400 disabled:cursor-wait"
              >
                {isLoading ? t('buttons.loading') : t('becomePartnerPage.submitRequest')}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
