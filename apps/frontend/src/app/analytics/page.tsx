'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import type { AnalyticsSummary } from '@iac-platform/shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useI18n } from '@/i18n/provider';

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<AnalyticsSummary>('/analytics/summary').then(setSummary).catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('analytics.signInPrompt')}</p>
        </div>
      </AppShell>
    );
  }

  const stats = [
    { label: t('analytics.validations'), value: summary?.totalValidations || 0 },
    { label: t('analytics.fixes'), value: summary?.totalFixes || 0 },
    { label: t('analytics.uploads'), value: summary?.totalUploads || 0 },
    { label: t('analytics.aiRequests'), value: summary?.totalAiRequests || 0 },
  ];

  return (
    <AppShell>
      <div className="p-6 space-y-6 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('analytics.title')}</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {summary?.activityChart && summary.activityChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('analytics.activity')}</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.activityChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        {summary?.commonErrors && summary.commonErrors.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('analytics.commonErrors')}</CardTitle></CardHeader>
            <CardContent>
              {summary.commonErrors.map((e, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-border text-sm">
                  <span className="truncate mr-4">{e.error}</span>
                  <span className="text-muted-foreground shrink-0">{e.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
