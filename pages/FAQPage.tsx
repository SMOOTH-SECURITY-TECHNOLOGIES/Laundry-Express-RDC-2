import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const FAQItemComponent: React.FC<{ question: string; answer: string, id: string }> = ({ question, answer, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = `faq-content-${id}`;

  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h3 className="text-lg font-semibold text-brand-dark dark:text-slate-100">{question}</h3>
        <svg
          className={`w-6 h-6 text-brand-blue transform transition-transform duration-500 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        id={contentId}
        role="region"
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}
      >
        <div className="py-2 pb-5 text-slate-600 dark:text-slate-300 prose">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const { siteContent, t } = useAppContext();

  useEffect(() => {
    if (siteContent.faq && siteContent.faq.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": siteContent.faq.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'faq-schema';
      script.innerHTML = JSON.stringify(faqSchema);
      
      document.head.appendChild(script);

      return () => {
        const existingScript = document.getElementById('faq-schema');
        if (existingScript) {
          existingScript.remove();
        }
      };
    }
  }, [siteContent.faq]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-brand-dark dark:text-slate-100">{t('faqPage.title')}</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          {t('faqPage.subtitle')}
        </p>
      </div>
      
      {siteContent.faq.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-card dark:border dark:border-slate-700">
            {siteContent.faq.map(item => (
                <FAQItemComponent key={item.id} id={item.id} question={item.question} answer={item.answer} />
            ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-card dark:border dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-4">{t('faqPage.noFaqTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-300">{t('faqPage.noFaqSubtitle')}</p>
        </div>
      )}
    </div>
  );
};