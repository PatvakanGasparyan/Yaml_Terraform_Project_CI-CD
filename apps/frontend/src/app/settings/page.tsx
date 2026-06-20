'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/stores';
import { OPENAI_MODELS } from '@iac-platform/shared';
import { localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/provider';

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="p-6 max-w-2xl space-y-6 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

        <Card>
          <CardHeader><CardTitle>{t('settings.appearance')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label>{t('settings.theme')}</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((th) => (
                  <Button key={th} size="sm" variant={settings.theme === th ? 'default' : 'outline'} onClick={() => settings.setTheme(th)}>
                    {t(`settings.${th}`)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label>{t('settings.language')}</label>
              <div className="flex gap-2">
                {Object.entries(localeNames).map(([code, name]) => (
                  <Button key={code} size="sm" variant={settings.language === code ? 'default' : 'outline'}
                    onClick={() => settings.setLanguage(code as 'en' | 'ru' | 'hy')}>
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('settings.editorSection')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label>{t('settings.editorFontSize')}</label>
              <input type="range" min={10} max={24} value={settings.editorFontSize}
                onChange={(e) => settings.updateSettings({ editorFontSize: parseInt(e.target.value) })}
                className="w-32" />
              <span className="text-sm w-8">{settings.editorFontSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <label>{t('settings.editorTheme')}</label>
              <select value={settings.editorTheme} onChange={(e) => settings.updateSettings({ editorTheme: e.target.value })}
                className="px-3 py-1.5 rounded border bg-background">
                <option value="vs-dark">{t('settings.dark')}</option>
                <option value="vs-light">{t('settings.light')}</option>
                <option value="hc-black">{t('settings.highContrast')}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('settings.aiSection')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label>{t('settings.aiModel')}</label>
              <select value={settings.aiModel} onChange={(e) => settings.updateSettings({ aiModel: e.target.value })}
                className="px-3 py-1.5 rounded border bg-background">
                {OPENAI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.autoFixOnUpload}
                onChange={(e) => settings.updateSettings({ autoFixOnUpload: e.target.checked })} />
              {t('settings.autoFix')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.autoSave}
                onChange={(e) => settings.updateSettings({ autoSave: e.target.checked })} />
              {t('settings.autoSave')}
            </label>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
