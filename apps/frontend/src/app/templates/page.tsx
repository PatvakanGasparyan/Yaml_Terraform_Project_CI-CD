'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { FixTemplateInfo } from '@iac-platform/shared';

export default function TemplatesPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [templates, setTemplates] = useState<FixTemplateInfo[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'fix' | 'validation' | 'conversion' | 'terraform' | 'security'>('fix');

  useEffect(() => {
    if (isAuthenticated) {
      api.get<FixTemplateInfo[]>('/templates').then(setTemplates).catch(() => {});
    }
  }, [isAuthenticated]);

  const create = async () => {
    if (!name.trim()) return;
    const t = await api.post<FixTemplateInfo>('/templates', {
      name,
      category,
      settings: { autoFix: true, useAi: true },
    });
    setTemplates([t, ...templates]);
    setName('');
  };

  const remove = async (id: string) => {
    await api.delete(`/templates/${id}`);
    setTemplates(templates.filter((x) => x.id !== id));
  };

  const exportAll = async () => {
    const data = await api.get<unknown[]>('/templates/export/all');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iac-templates.json';
    a.click();
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
          <Button variant="outline" onClick={exportAll}>{t('templates.export')}</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('templates.name')} className="px-3 py-2 rounded-lg border bg-background" />
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="px-3 py-2 rounded-lg border bg-background">
            {(['fix', 'validation', 'conversion', 'terraform', 'security'] as const).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button onClick={create}>{t('templates.create')}</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tmpl) => (
            <Card key={tmpl.id}>
              <CardHeader>
                <CardTitle className="text-base">{tmpl.name}</CardTitle>
                <p className="text-xs text-muted-foreground capitalize">{tmpl.category}</p>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-secondary p-2 rounded overflow-auto max-h-24">{JSON.stringify(tmpl.settings, null, 2)}</pre>
                <Button variant="destructive" size="sm" className="mt-2" onClick={() => remove(tmpl.id)}>{t('common.delete')}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
