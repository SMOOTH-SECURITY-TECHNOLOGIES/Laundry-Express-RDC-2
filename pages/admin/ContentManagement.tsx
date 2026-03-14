import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SiteContent, HowItWorksStep, FAQItem } from '../../types';
import { Icon } from '../../components/Icon';

export const ContentManagement: React.FC = () => {
  const { siteContent, updateSiteContent, addNotification, t } = useAppContext();
  const [content, setContent] = useState<SiteContent>(siteContent);

  useEffect(() => {
    setContent(siteContent);
  }, [siteContent]);

  const handleSave = () => {
    updateSiteContent(content);
    addNotification(t('notifications.siteContentUpdated'), 'success');
  };

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({ ...prev, hero: { ...prev.hero, [name]: value } }));
  };

  const handleHowItWorksChange = (index: number, field: keyof Omit<HowItWorksStep, 'id' | 'icon'>, value: string) => {
    const newSteps = [...content.howItWorksSteps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setContent(prev => ({ ...prev, howItWorksSteps: newSteps }));
  };
  
  const handleFAQChange = (index: number, field: keyof Omit<FAQItem, 'id'>, value: string) => {
    const newFaq = [...content.faq];
    newFaq[index] = { ...newFaq[index], [field]: value };
    setContent(prev => ({ ...prev, faq: newFaq }));
  };

  const addFAQItem = () => {
    const newItem: FAQItem = {
        id: `FAQ-${Date.now()}`,
        question: t('contentManagement.newQuestion'),
        answer: t('contentManagement.newAnswer'),
    };
    setContent(prev => ({...prev, faq: [...prev.faq, newItem]}));
  }

  const deleteFAQItem = (id: string) => {
    setContent(prev => ({...prev, faq: prev.faq.filter(item => item.id !== id)}));
  }


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('adminPage.contentManagement')}</h1>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-brand-success text-white font-bold rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
        >
          <Icon name="check" className="w-5 h-5" />
          <span>{t('contentManagement.saveChanges')}</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card">
        <h2 className="text-2xl font-bold mb-4">{t('contentManagement.heroSection')}</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="hero-title" className="block text-sm font-medium text-gray-700 mb-1">{t('contentManagement.mainTitle')}</label>
            <input
              type="text"
              id="hero-title"
              name="title"
              value={content.hero.title}
              onChange={handleHeroChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="hero-subtitle" className="block text-sm font-medium text-gray-700 mb-1">{t('contentManagement.subtitle')}</label>
            <textarea
              id="hero-subtitle"
              name="subtitle"
              value={content.hero.subtitle}
              onChange={handleHeroChange}
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-card">
        <h2 className="text-2xl font-bold mb-4">{t('contentManagement.howItWorksSection')}</h2>
        <div className="space-y-4">
          {content.howItWorksSteps.map((step, index) => (
            <div key={step.id} className="p-4 border rounded-lg bg-gray-50 flex items-start space-x-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-brand-lightblue text-brand-blue shrink-0">
                  <Icon name={step.icon} className="w-8 h-8"/>
              </div>
              <div className="flex-grow space-y-2">
                <div>
                    <label className="text-xs font-medium text-gray-500">{t('contentManagement.stepTitle', { index: index + 1 })}</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => handleHowItWorksChange(index, 'title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg font-semibold"
                    />
                </div>
                <div>
                     <label className="text-xs font-medium text-gray-500">{t('contentManagement.description')}</label>
                    <textarea
                      value={step.description}
                      onChange={(e) => handleHowItWorksChange(index, 'description', e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
       <div className="bg-white p-6 rounded-2xl shadow-card">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t('contentManagement.faqSection')}</h2>
            <button onClick={addFAQItem} className="px-4 py-2 text-sm bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90">
                {t('contentManagement.addQuestion')}
            </button>
        </div>
        <div className="space-y-4">
          {content.faq.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-end">
                 <button onClick={() => deleteFAQItem(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                    <Icon name="xmark" className="w-5 h-5"/>
                 </button>
              </div>
              <div className="space-y-2">
                <div>
                    <label className="text-sm font-medium text-gray-700">{t('contentManagement.question')}</label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg font-semibold"
                    />
                </div>
                <div>
                     <label className="text-sm font-medium text-gray-700">{t('contentManagement.answer')}</label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                </div>
              </div>
            </div>
          ))}
           {content.faq.length === 0 && <p className="text-center text-slate-500 py-4">{t('contentManagement.noFaq')}</p>}
        </div>
      </div>
    </div>
  );
};