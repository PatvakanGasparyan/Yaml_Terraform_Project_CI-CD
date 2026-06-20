'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Globe, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore, useSettingsStore } from '@/stores';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/provider';
import type { SupportedLanguage } from '@iac-platform/shared';

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const { language } = useSettingsStore();
  const { t, setLocale } = useI18n();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const cycleLanguage = () => {
    const langs: SupportedLanguage[] = ['en', 'ru', 'hy'];
    const idx = langs.indexOf(language);
    setLocale(langs[(idx + 1) % langs.length]);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    useSettingsStore.getState().setTheme(next);
  };

  return (
    <header className="h-14 glass border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="text-sm text-muted-foreground">{t('app.description')}</div>
      <div className="flex items-center gap-2">
        {isAuthenticated && <NotificationCenter />}
        <Button variant="ghost" size="icon" onClick={cycleLanguage} title={localeNames[language]}>
          <Globe className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title={t('auth.logout')}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <a href="/auth/login">{t('auth.login')}</a>
          </Button>
        )}
      </div>
    </header>
  );
}
