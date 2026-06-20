'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeEditor } from '@/components/editor/code-editor';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { TerraformPlanView } from '@iac-platform/shared';
import { cn } from '@/lib/utils';

export default function TerraformPlanPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [planInput, setPlanInput] = useState('');
  const [plan, setPlan] = useState<TerraformPlanView | null>(null);
  const [approvalReason, setApprovalReason] = useState('');
  const [loading, setLoading] = useState(false);

  const analyzePlan = async () => {
    setLoading(true);
    try {
      const result = await api.post<TerraformPlanView>('/terraform/plan', { planOutput: planInput });
      setPlan(result);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (decision: 'approved' | 'rejected') => {
    if (!plan?.id) return;
    await api.post(`/terraform/plans/${plan.id}/approve`, { decision, reason: approvalReason });
    setPlan({ ...plan, status: decision === 'approved' ? 'approved' : 'rejected' });
  };

  const riskColor = (risk: string) => risk === 'high' ? 'text-red-500' : risk === 'medium' ? 'text-yellow-500' : 'text-green-500';

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('terraform.planTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('terraform.planTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('terraform.planSubtitle')}</p>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>{t('terraform.planInput')}</CardTitle></CardHeader>
            <CardContent className="h-[400px] p-0">
              <CodeEditor value={planInput} onChange={setPlanInput} format="json" />
            </CardContent>
            <div className="p-4">
              <Button onClick={analyzePlan} disabled={loading || !planInput.trim()}>
                {loading ? t('common.loading') : t('terraform.analyzePlan')}
              </Button>
            </div>
          </Card>

          {plan && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    {t('terraform.planSummary')}
                    <span className={cn('text-lg', plan.riskScore > 60 ? 'text-red-500' : plan.riskScore > 30 ? 'text-yellow-500' : 'text-green-500')}>
                      {t('terraform.riskScore')}: {plan.riskScore}/100
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{plan.costImpact}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded bg-green-500/10"><p className="text-2xl font-bold text-green-500">{plan.creates.length}</p><p className="text-xs">{t('terraform.create')}</p></div>
                    <div className="p-3 rounded bg-yellow-500/10"><p className="text-2xl font-bold text-yellow-500">{plan.updates.length}</p><p className="text-xs">{t('terraform.modify')}</p></div>
                    <div className="p-3 rounded bg-red-500/10"><p className="text-2xl font-bold text-red-500">{plan.deletes.length}</p><p className="text-xs">{t('terraform.destroy')}</p></div>
                  </div>
                </CardContent>
              </Card>

              {[['creates', plan.creates, 'green'], ['updates', plan.updates, 'yellow'], ['deletes', plan.deletes, 'red']].map(([key, items, color]) => (
                (items as TerraformPlanView['creates']).length > 0 && (
                  <Card key={key as string}>
                    <CardHeader><CardTitle className="capitalize">{key as string}</CardTitle></CardHeader>
                    <CardContent className="max-h-40 overflow-y-auto space-y-1">
                      {(items as Array<{ address: string; type: string; risk: string }>).map((r) => (
                        <div key={r.address} className="text-sm font-mono flex justify-between">
                          <span>{r.address}</span>
                          <span className={riskColor(r.risk)}>{r.risk}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )
              ))}

              {plan.aiAnalysis && (
                <Card>
                  <CardHeader><CardTitle>{t('terraform.aiAnalysis')}</CardTitle></CardHeader>
                  <CardContent><pre className="text-sm whitespace-pre-wrap">{plan.aiAnalysis}</pre></CardContent>
                </Card>
              )}

              {plan.status === 'pending' && (
                <Card>
                  <CardHeader><CardTitle>{t('terraform.approval')}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <textarea value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} placeholder={t('terraform.approvalReason')} className="w-full px-3 py-2 rounded border bg-background text-sm min-h-[60px]" />
                    <div className="flex gap-2">
                      <Button onClick={() => approve('approved')}>{t('terraform.approve')}</Button>
                      <Button variant="destructive" onClick={() => approve('rejected')}>{t('terraform.reject')}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {plan.status && plan.status !== 'pending' && (
                <p className="text-sm font-medium capitalize">{t('terraform.status')}: {plan.status}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
