'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { TerraformStateView } from '@iac-platform/shared';

export default function TerraformStatePage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [stateJson, setStateJson] = useState('');
  const [snapshots, setSnapshots] = useState<Array<{ id: string; name: string; resourceCount: number; createdAt: string }>>([]);
  const [selected, setSelected] = useState<TerraformStateView | null>(null);

  useEffect(() => {
    if (isAuthenticated) loadSnapshots();
  }, [isAuthenticated]);

  const loadSnapshots = () => api.get<typeof snapshots>('/terraform/state').then(setSnapshots).catch(() => {});

  const save = async () => {
    await api.post('/terraform/state', { name, stateJson });
    setName('');
    loadSnapshots();
  };

  const view = async (id: string) => {
    const state = await api.get<TerraformStateView>(`/terraform/state/${id}`);
    setSelected(state);
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.stateTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.stateTitle')}</h1>
        <Card>
          <CardHeader><CardTitle>{t('enterprise.uploadState')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enterprise.snapshotName')} className="w-full max-w-md px-3 py-2 rounded-lg border bg-background" />
            <textarea value={stateJson} onChange={(e) => setStateJson(e.target.value)} placeholder="terraform.tfstate JSON" className="w-full h-40 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
            <Button onClick={save} disabled={!name || !stateJson}>{t('common.save')}</Button>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t('enterprise.snapshots')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {snapshots.map((s) => (
                <button key={s.id} onClick={() => view(s.id)} className="w-full text-left p-2 border rounded hover:bg-accent text-sm">
                  {s.name} — {s.resourceCount} resources
                </button>
              ))}
            </CardContent>
          </Card>
          {selected && (
            <Card>
              <CardHeader><CardTitle>{selected.name} ({selected.resourceCount})</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm space-y-1 max-h-96 overflow-auto">
                  {selected.resources.map((r, i) => (
                    <div key={i} className="p-1 border-b">{r.type}.{r.name} {r.module && <span className="text-muted-foreground">({r.module})</span>}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
