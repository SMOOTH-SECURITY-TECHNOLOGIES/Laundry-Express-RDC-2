import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { DrcAddress, RegisterRequest } from '../types';
import { trackEvent } from '../utils/tracking';
import { sendServerSideEvent } from '../utils/capi';

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
  </svg>
);

export const RegisterPage: React.FC = () => {
  const { register, setCurrentPage, addNotification, t, previousPage, orderDraft } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupAddress: '',
    password: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = t('validation.required');
    else if (formData.name.trim().length < 2) newErrors.name = t('validation.minLength', { count: 2 });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = t('validation.required');
    else if (!emailRegex.test(formData.email)) newErrors.email = t('validation.invalidEmail');
    
    const phoneRegex = /^08\d{8}$/;
    if (!formData.phone.trim()) newErrors.phone = t('validation.required');
    else if (!phoneRegex.test(formData.phone)) newErrors.phone = t('validation.invalidPhone');
    
    if (!formData.pickupAddress.trim()) newErrors.pickupAddress = t('validation.required');
    
    if (!formData.password) newErrors.password = t('validation.required');
    else if (formData.password.length < 6) newErrors.password = t('validation.minLength', { count: 6 });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);

    const addressParts = formData.pickupAddress.split(',');
    const commune = addressParts.pop()?.trim() || 'Kinshasa';
    const avenue = addressParts.join(',').trim();

    const payload: RegisterRequest = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      pickupAddress: {
        commune: commune,
        avenue: avenue,
        numero: 'N/A' // Form does not capture this field separately
      },
      referralCode: formData.referralCode || undefined,
    };

    try {
      const { user: registeredUser } = await register(payload);
      trackEvent('CompleteRegistration', { method: 'Email' });

      // --- BEGIN CAPI INTEGRATION ---
      // Send event to backend for server-side processing.
      const [firstName, ...lastNameParts] = registeredUser.name.split(' ');
      const lastName = lastNameParts.join(' ');
      sendServerSideEvent('CompleteRegistration', {
          user_data: {
              email: registeredUser.email,
              phone_number: registeredUser.phone,
              address: {
                  first_name: firstName,
                  last_name: lastName,
                  city: registeredUser.pickupAddress.commune,
                  country: 'CD'
              }
          }
      });
      // --- END CAPI INTEGRATION ---
      
      if (orderDraft.serviceType && (previousPage === 'order' || previousPage === 'partner-detail')) {
          setCurrentPage({ name: 'order' });
      } else {
          setCurrentPage({ name: 'home' });
      }
    } catch (err) {
      addNotification(t('registerPage.error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialSignUp = async (email: string, method: 'Google' | 'Facebook') => {
    console.info('Social signup placeholder clicked for', email, method);
    addNotification('Inscription sociale non disponible pour le moment.', 'info');
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-6">{t('registerPage.createAccount')}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.fullName')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} placeholder={t('registerPage.phonePlaceholder')} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.defaultAddress')}</label>
            <textarea name="pickupAddress" id="pickupAddress" rows={3} value={formData.pickupAddress} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.pickupAddress ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`}></textarea>
            {errors.pickupAddress && <p className="text-red-500 text-xs mt-1">{errors.pickupAddress}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.password')}</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} onBlur={validate} required className={`w-full p-2 border rounded-lg focus:ring-brand-blue focus:border-brand-blue bg-white dark:bg-slate-700 dark:text-slate-100 ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'}`} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('registerPage.referralCode')}</label>
            <input type="text" name="referralCode" id="referralCode" value={formData.referralCode} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 rounded-lg focus:ring-brand-blue focus:border-brand-blue" />
          </div>
          
          <div className="pt-2">
             <button 
                type="submit" 
                disabled={isLoading}
                className="w-full px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-opacity-90 disabled:bg-slate-400 disabled:cursor-wait"
              >
                {isLoading ? t('buttons.loading') : t('registerPage.register')}
             </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400">
              {t('loginPage.or')}
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => handleSocialSignUp('google.user.new@example.com', 'Google')}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50"
          >
            <GoogleIcon />
            {t('registerPage.googleSignUp')}
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignUp('facebook.user.new@example.com', 'Facebook')}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-2 border border-blue-600 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FacebookIcon />
            {t('registerPage.facebookSignUp')}
          </button>
        </div>

         <p className="text-center text-sm text-gray-600 dark:text-slate-400 mt-6">
            {t('registerPage.hasAccount')}{' '}
            <button onClick={() => setCurrentPage({ name: 'login' })} className="font-semibold text-brand-blue hover:underline">
                {t('registerPage.login')}
            </button>
        </p>
      </div>
    </div>
  );
};
