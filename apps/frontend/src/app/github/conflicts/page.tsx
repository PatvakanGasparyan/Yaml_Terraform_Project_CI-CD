'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { MergeConflictResolution } from '@iac-platform/shared';

export default function MergeConflictsPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [fileName, setFileName] = useState('deployment.yaml');
  const [conflictContent, setConflictContent] = useState('');
  const [result, setResult] = useState<MergeConflictResolution | null>(null);
  const [loading, setLoading] = useState(false);

  const resolve = async () => {
    setLoading(true);
    try {
      const res = await api.post<MergeConflictResolution>('/github/resolve-conflicts', { fileName, conflictContent });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.conflictsTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('github.signInPrompt')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.conflictsTitle')}</h1>
        <p className="text-muted-foreground">{t('enterprise.conflictsDesc')}</p>
        <div>
          <label className="text-xs text-muted-foreground">{t('github.filePath')}</label>
          <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="block w-full max-w-md px-3 py-2 rounded-lg border bg-background mt-1" />
        </div>
        <textarea
          value={conflictContent}
          onChange={(e) => setConflictContent(e.target.value)}
          placeholder={'<<<<<<< HEAD\n...\n=======\n...\n>>>>>>> branch'}
          className="w-full h-48 px-3 py-2 rounded-lg border bg-background font-mono text-sm"
        />
        <Button onClick={resolve} disabled={!conflictContent || loading}>{loading ? t('common.loading') : t('enterprise.resolveConflicts')}</Button>
        {result && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('enterprise.resolutions')}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.conflicts.map((c, i) => (
                  <div key={i} className="text-sm p-2 border rounded"><strong>{c.file}</strong><p>{c.explanation}</p></div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('enterprise.mergedContent')}</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96 bg-secondary p-3 rounded">{result.mergedContent}</pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
