import type { SupportedLanguage } from '@iac-platform/shared';

export const locales: SupportedLanguage[] = ['en', 'ru', 'hy'];
export const defaultLocale: SupportedLanguage = 'en';

export const localeNames: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  hy: 'Հայերեն',
};
