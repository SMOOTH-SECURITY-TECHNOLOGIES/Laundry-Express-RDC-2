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

  const socialLinks = [
    { icon: 'facebook' as const, url: 'https://facebook.com/laundryexpress', label: 'Facebook' },
    { icon: 'instagram' as const, url: 'https://instagram.com/laundryexpress', label: 'Instagram' },
    { icon: 'whatsapp' as const, url: 'https://wa.me/243812345678', label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-brand-navy text-white mt-16 border-t-4 border-brand-cyan">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <Icon name="logo" className="h-9 w-9 text-white" />
              <span className="text-2xl font-bold">Laundry Express</span>
            </div>
            <p className="text-sm text-slate-300 max-w-sm mx-auto md:mx-0 leading-relaxed">
              Votre linge, livré. La façon la plus simple de faire votre lessive et nettoyage à sec en RDC.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-5">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-slate-700 hover:bg-brand-blue flex items-center justify-center transition-colors"
                >
                  <Icon name={link.icon} className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.navigation')}</h3>
            <ul className="space-y-2.5">
              <li><button onClick={() => setCurrentPage({ name: 'home' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.home')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'order' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.order')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'profile' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.myProfile')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'faq' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.faq')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'blog' })} className="text-slate-300 hover:text-white transition-colors text-sm">Blog</button></li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.partners')}</h3>
            <ul className="space-y-2.5">
              <li><button onClick={() => setCurrentPage({ name: 'become-partner' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.becomePartner')}</button></li>
              <li><button onClick={() => setCurrentPage({ name: 'logistics-partnership' })} className="text-slate-300 hover:text-white transition-colors text-sm">{t('footer.logisticsPartnership')}</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4 text-slate-100 uppercase tracking-wider text-sm">{t('footer.contactUs')}</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="tel:+243812345678" className="text-slate-300 hover:text-white transition-colors flex items-center justify-center md:justify-start text-sm">
                  <Icon name="device-phone-mobile" className="w-4 h-4 mr-2" />
                  <span className="google-call-tracking">+243 81 234 5678</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@laundryexpress.cd" className="text-slate-300 hover:text-white transition-colors flex items-center justify-center md:justify-start text-sm">
                  <Icon name="envelope" className="w-4 h-4 mr-2" />
                  contact@laundryexpress.cd
                </a>
              </li>
              <li>
                <button onClick={() => setCurrentPage({ name: 'support' })} className="text-slate-300 hover:text-white transition-colors flex items-center justify-center md:justify-start text-sm">
                   <Icon name="lifebuoy" className="w-4 h-4 mr-2" />
                   <span>Contacter le support</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Laundry Express RDC. Tous droits réservés.
            </p>
            <CurrencySwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
};
