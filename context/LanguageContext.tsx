import React, { createContext, useState, useContext, useMemo, useCallback, useEffect, useRef } from 'react';

export type Language = 'fr' | 'en' | 'sw';

type TranslationsCache = {
  [key in Language]?: any;
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: any) => string;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialLanguage = (): Language => {
    // 1. Check for a stored language preference
    const storedLang = localStorage.getItem('app-language') as Language | null;
    if (storedLang && ['fr', 'en', 'sw'].includes(storedLang)) {
      return storedLang;
    }

    // 2. Detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (['fr', 'en', 'sw'].includes(browserLang)) {
      return browserLang as Language;
    }
    
    // 3. Fallback to default
    return 'fr';
  };
  
  const [language, _setLanguage] = useState<Language>(getInitialLanguage);
  const [translations, setTranslations] = useState<TranslationsCache>({});
  const fetchedLanguages = useRef<Set<Language>>(new Set());
  const [isFetching, setIsFetching] = useState(false);

  // New setLanguage function that persists to localStorage
  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('app-language', lang);
    _setLanguage(lang);
  }, []);

  useEffect(() => {
    const fetchTranslations = async (lang: Language) => {
      // Don't fetch if it has already been requested (successfully or not)
      if (fetchedLanguages.current.has(lang)) {
        return;
      }

      setIsFetching(true);
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`/locales/${lang}.json`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch translations for ${lang}`);
        }
        const data = await response.json();
        setTranslations(prev => ({ ...prev, [lang]: data }));
        fetchedLanguages.current.add(lang);
      } catch (error) {
        console.error("Failed to load translations:", error);
        // Set an empty object to mark it as "fetched but failed" to prevent retries
        setTranslations(prev => ({ ...prev, [lang]: {} })); 
        fetchedLanguages.current.add(lang);
      } finally {
        globalThis.clearTimeout(timeout);
        setIsFetching(false);
      }
    };

    fetchTranslations(language);
  }, [language]);

  // FIX: Added explicit 'string' return type to useCallback to fix type inference issues.
  const t = useCallback((key: string, options?: any): string => {
    const langFile = translations[language];
    
    if (!langFile) {
      return options?.default ?? key;
    }
    
    let translation = key.split('.').reduce((o: any, i) => o?.[i], langFile);

    if (translation === undefined || translation === null) {
        return options?.default ?? key;
    }
    
    if (options && typeof translation === 'string') {
      Object.keys(options).forEach(optKey => {
        translation = translation.replace(new RegExp(`{{${optKey}}}`, 'g'), options[optKey]);
      });
    }

    return String(translation);
  }, [language, translations]);
  
  // The global loading state is true if we are fetching OR if the current language file hasn't been loaded yet.
  const isLoading = isFetching || !fetchedLanguages.current.has(language);


  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    isLoading
  }), [language, setLanguage, t, isLoading]);
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};
