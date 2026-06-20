'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { DriftReport } from '@iac-platform/shared';

export default function TerraformDriftPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [stateContent, setStateContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [report, setReport] = useState<DriftReport | null>(null);
  const [snapshots, setSnapshots] = useState<Array<{ id: string; name: string }>>([]);
  const [stateId, setStateId] = useState('');

  useEffect(() => {
    if (isAuthenticated) api.get<typeof snapshots>('/terraform/state').then(setSnapshots).catch(() => {});
  }, [isAuthenticated]);

  const detect = async () => {
    const result = await api.post<DriftReport>('/terraform/drift', { stateContent, codeContent });
    setReport(result);
  };

  const detectFromSnapshot = async () => {
    if (!stateId) return;
    const result = await api.post<DriftReport>(`/terraform/state/${stateId}/drift`, { codeContent });
    setReport(result);
  };

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.driftTitle')}</h1>
        <p className="text-muted-foreground">{t('enterprise.driftDesc')}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="text-xs">{t('enterprise.stateJson')}</label>
            <textarea value={stateContent} onChange={(e) => setStateContent(e.target.value)} className="w-full h-40 mt-1 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs">{t('enterprise.terraformCode')}</label>
            <textarea value={codeContent} onChange={(e) => setCodeContent(e.target.value)} className="w-full h-40 mt-1 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-end">
          <Button onClick={detect}>{t('enterprise.detectDrift')}</Button>
          {isAuthenticated && snapshots.length > 0 && (
            <>
              <select value={stateId} onChange={(e) => setStateId(e.target.value)} className="px-3 py-2 rounded-lg border bg-background">
                <option value="">{t('enterprise.useSnapshot')}</option>
                {snapshots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <Button variant="outline" onClick={detectFromSnapshot} disabled={!stateId}>{t('enterprise.detectFromSnapshot')}</Button>
            </>
          )}
        </div>
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>{report.hasDrift ? t('enterprise.driftDetected') : t('enterprise.noDrift')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{t('enterprise.driftSummary')}: +{report.summary.added} / -{report.summary.removed} / ~{report.summary.modified}</p>
              <ul className="space-y-1 text-sm">
                {report.drift.map((d, i) => (
                  <li key={i} className="p-2 border rounded"><strong>{d.resource}</strong> — {d.status} {d.details && <span className="text-muted-foreground">({d.details})</span>}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
