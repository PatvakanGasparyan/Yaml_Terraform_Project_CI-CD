'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { PrReviewResult } from '@iac-platform/shared';

export default function PrReviewPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [repos, setRepos] = useState<Array<{ fullName: string }>>([]);
  const [repo, setRepo] = useState('');
  const [prs, setPrs] = useState<Array<{ number: number; title: string; author: string; head: string; base: string }>>([]);
  const [prNumber, setPrNumber] = useState<number | null>(null);
  const [review, setReview] = useState<PrReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PrReviewResult[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<Array<{ fullName: string }>>('/github/repositories').then(setRepos).catch(() => {});
      api.get<PrReviewResult[]>('/github/pull-requests/reviews').then(setHistory).catch(() => {});
    }
  }, [isAuthenticated]);

  const loadPrs = async (r: string) => {
    setRepo(r);
    const list = await api.post<typeof prs>('/github/pull-requests', { repo: r });
    setPrs(list);
    setPrNumber(list[0]?.number ?? null);
  };

  const runReview = async () => {
    if (!repo || !prNumber) return;
    setLoading(true);
    try {
      const result = await api.post<PrReviewResult>('/github/pull-requests/review', { repo, prNumber });
      setReview(result);
      setHistory(await api.get<PrReviewResult[]>('/github/pull-requests/reviews'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.prReviewTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('github.signInPrompt')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.prReviewTitle')}</h1>
        <p className="text-muted-foreground">{t('enterprise.prReviewDesc')}</p>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="text-xs text-muted-foreground">{t('github.repositories')}</label>
            <select value={repo} onChange={(e) => loadPrs(e.target.value)} className="block px-3 py-2 rounded-lg border bg-background min-w-[220px]">
              <option value="">{t('github.selectRepo')}</option>
              {repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
            </select>
          </div>
          {prs.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">PR</label>
              <select value={prNumber ?? ''} onChange={(e) => setPrNumber(Number(e.target.value))} className="block px-3 py-2 rounded-lg border bg-background min-w-[280px]">
                {prs.map((p) => <option key={p.number} value={p.number}>#{p.number} — {p.title}</option>)}
              </select>
            </div>
          )}
          <Button onClick={runReview} disabled={!repo || !prNumber || loading}>{loading ? t('common.loading') : t('enterprise.runReview')}</Button>
        </div>
        {review && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>PR #{review.prNumber}</span>
                <span className="text-sm font-normal">{t('terraform.riskScore')}: {review.riskScore}/100 — {review.recommendation}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">{review.analysis}</div>
              {review.findings?.length > 0 && (
                <ul className="space-y-2">
                  {review.findings.map((f, i) => (
                    <li key={i} className="p-2 rounded border text-sm"><strong>{f.severity}:</strong> {f.title} — {f.description}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
        {history.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('enterprise.reviewHistory')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="text-sm p-2 border rounded flex justify-between">
                  <span>{h.repository} #{h.prNumber}</span>
                  <span>{h.recommendation} ({h.riskScore})</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
