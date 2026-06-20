'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { SupportedLanguage } from '@iac-platform/shared';
import { useSettingsStore } from '@/stores';
import en from '@/locales/en.json';
import ru from '@/locales/ru.json';
import hy from '@/locales/hy.json';

const messages: Record<SupportedLanguage, Record<string, unknown>> = { en, ru, hy };

function getNested(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

interface I18nContextValue {
  locale: SupportedLanguage;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (lang: SupportedLanguage) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useSettingsStore();
  const [locale, setLocaleState] = useState<SupportedLanguage>(language);

  useEffect(() => {
    const stored = typeof window !== 'undefined' && localStorage.getItem('iac-settings');
    if (!stored) {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'ru' || browserLang === 'hy') {
        setLanguage(browserLang);
      }
    }
  }, [setLanguage]);

  useEffect(() => {
    setLocaleState(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLocale = useCallback((lang: SupportedLanguage) => {
    setLanguage(lang);
    setLocaleState(lang);
    document.documentElement.lang = lang;
  }, [setLanguage]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = getNested(messages[locale] as Record<string, unknown>, key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
