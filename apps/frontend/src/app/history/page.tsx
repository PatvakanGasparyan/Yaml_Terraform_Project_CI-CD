'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import type { HistoryEntry } from '@iac-platform/shared';
import { useI18n } from '@/i18n/provider';

export default function HistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | undefined>();

  useEffect(() => {
    if (isAuthenticated) {
      const params = filter ? `?filter=${filter}` : '';
      api.get<HistoryEntry[]>(`/history${params}`).then(setEntries).catch(() => {});
    }
  }, [isAuthenticated, filter]);

  const filterLabels = {
    today: t('history.today'),
    week: t('history.week'),
    month: t('history.month'),
  };

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('history.title')}</h1>
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {filterLabels[f]}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={() => setFilter(undefined)}>{t('history.all')}</Button>
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle>{t('history.activityLog')}</CardTitle></CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('history.noHistory')}</p>
            ) : (
              entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3 border-b border-border text-sm">
                  <div>
                    <span className="font-medium capitalize">{e.type.replace('_', ' ')}</span>
                    {e.fileName && <span className="text-muted-foreground ml-2">{e.fileName}</span>}
                  </div>
                  <span className="text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
