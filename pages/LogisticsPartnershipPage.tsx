

import React from 'react';
import { useAppContext } from '../context/AppContext';

export const LogisticsPartnershipPage: React.FC = () => {
  const { t } = useAppContext();

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-card dark:border dark:border-slate-700 animate-slide-up">
      <h1 className="text-3xl md:text-4xl font-extrabold text-brand-dark dark:text-slate-100 text-center mb-10">{t('logisticsPartnership.title')}</h1>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 border-b-2 border-brand-lightblue pb-2 mb-4">{t('logisticsPartnership.role.title')}</h2>
          <ul className="list-disc list-inside space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed pl-2">
            <li>{t('logisticsPartnership.role.point1')}</li>
            <li>{t('logisticsPartnership.role.point2')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-brand-dark dark:text-slate-100 border-b-2 border-brand-lightblue pb-2 mb-4">{t('logisticsPartnership.pricing.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('logisticsPartnership.pricing.subtitle')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-3">{t('logisticsPartnership.pricing.byZone')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                  <span className="font-medium">{t('logisticsPartnership.pricing.zone1')}</span>
                  <span className="font-bold text-brand-blue text-lg">3 USD</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                  <span className="font-medium">{t('logisticsPartnership.pricing.zone2')}</span>
                  <span className="font-bold text-brand-blue text-lg">4 USD</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                  <span className="font-medium">{t('logisticsPartnership.pricing.zone3')}</span>
                  <span className="font-bold text-brand-blue text-lg">5 USD</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                  <span className="font-medium">{t('logisticsPartnership.pricing.zone4')}</span>
                  <span className="font-bold text-brand-blue text-lg">6–7 USD</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-700">
                  <span className="font-medium">{t('logisticsPartnership.pricing.outOfZone')}</span>
                  <span className="font-bold text-brand-blue text-lg">0,80 USD / km</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-3">{t('logisticsPartnership.pricing.options')}</h3>
               <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-brand-cyan rounded-r-lg">
                  <span className="font-medium">{t('logisticsPartnership.pricing.optionExpress')}</span>
                  <span className="font-bold text-brand-dark dark:text-slate-100 text-lg">+30 %</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-brand-cyan rounded-r-lg">
                  <span className="font-medium">{t('logisticsPartnership.pricing.optionNight')}</span>
                  <span className="font-bold text-brand-dark dark:text-slate-100 text-lg">+20 %</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-brand-cyan rounded-r-lg">
                  <span className="font-medium">{t('logisticsPartnership.pricing.optionHeavy')}</span>
                  <span className="font-bold text-brand-dark dark:text-slate-100 text-lg">+15 %</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};