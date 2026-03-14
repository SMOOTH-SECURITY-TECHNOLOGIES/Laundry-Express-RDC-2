import React from 'react';
import { Icon } from './Icon';
import { useAppContext } from '../context/AppContext';
import { Currency } from '../types';

const CurrencySwitcher: React.FC = () => {
    const { selectedCurrency, setSelectedCurrency } = useAppContext();

    const handleCurrencyChange = (currency: Currency) => {
        setSelectedCurrency(currency);
    };

    return (
        <div className="flex items-center space-x-1 bg-slate-700 p-1 rounded-full">
            <button
                onClick={() => handleCurrencyChange('USD')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedCurrency === 'USD' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-300'}`}
            >
                USD
            </button>
            <button
                onClick={() => handleCurrencyChange('CDF')}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedCurrency === 'CDF' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-300'}`}
            >
                CDF
            </button>
        </div>
    );
};

export const Footer: React.FC = () => {
  const { setCurrentPage, t } = useAppContext();
  
  return (
    <footer className="bg-brand-dark text-white mt-16 border-t-4 border-brand-cyan">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="md:col-span-1">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <Icon name="logo" className="h-9 w-9 text-white" />
              <span className="text-2xl font-bold">Laundry Express</span>
            </div>
            <p className="text-base text-slate-300 max-w-sm mx-auto md:mx-0">{t('footer.tagline')}</p>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.navigation')}</h3>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage({ name: 'home' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.home')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'order' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.order')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'profile' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.myProfile')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'faq' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.faq')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.partners')}</h3>
             <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage({ name: 'become-partner' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.becomePartner')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'logistics-partnership' })} className="text-slate-300 hover:text-white transition-colors">{t('footer.logisticsPartnership')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.contactUs')}</h3>
            <ul className="space-y-2">
              <li>
                <a href={`tel:${t('footer.phone')}`} className="text-slate-300 hover:text-white transition-colors flex items-center justify-center md:justify-start">
                  <Icon name="device-phone-mobile" className="w-5 h-5 mr-2" />
                  {/* 
                    This span has a specific class for Google Tag Manager to target.
                    GTM will use this class to dynamically replace the phone number 
                    for users arriving from Google Ads, enabling call conversion tracking.
                  */}
                  <span className="google-call-tracking">{t('footer.phone')}</span>
                </a>
              </li>
              <li>
                <button onClick={() => setCurrentPage({ name: 'support' })} className="text-slate-300 hover:text-white transition-colors flex items-center justify-center md:justify-start">
                   <Icon name="lifebuoy" className="w-5 h-5 mr-2" />
                   <span>{t('profilePage.contactSupport')}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-700 text-center">
          <div className="flex justify-center items-center mb-8">
            <CurrencySwitcher />
          </div>
          <p className="text-sm text-slate-400">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
};