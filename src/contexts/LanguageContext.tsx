import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/locales/en';
import { ta } from '@/locales/ta';

type Language = 'en' | 'ta';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('app_language') as Language) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
        // Update HTML lang attribute for accessibility if needed
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: keyof Translations): string => {
        const translations = language === 'ta' ? ta : en;
        return translations[key] || en[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
