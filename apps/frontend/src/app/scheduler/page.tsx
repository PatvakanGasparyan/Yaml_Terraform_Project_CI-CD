'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { ScheduledJobInfo } from '@iac-platform/shared';

export default function SchedulerPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [jobs, setJobs] = useState<ScheduledJobInfo[]>([]);
  const [name, setName] = useState('');
  const [cron, setCron] = useState('0 9 * * *');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('yaml');

  useEffect(() => {
    if (isAuthenticated) loadJobs();
  }, [isAuthenticated]);

  const loadJobs = () => api.get<ScheduledJobInfo[]>('/scheduler/jobs').then(setJobs).catch(() => {});

  const create = async () => {
    await api.post('/scheduler/jobs', { name, cronExpression: cron, content, format });
    setName('');
    loadJobs();
  };

  const runNow = async (id: string) => {
    await api.post(`/scheduler/jobs/${id}/run`);
    loadJobs();
  };

  const toggle = async (job: ScheduledJobInfo) => {
    await api.put(`/scheduler/jobs/${job.id}`, { enabled: !job.enabled });
    loadJobs();
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.schedulerTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.schedulerTitle')}</h1>
        <Card>
          <CardHeader><CardTitle>{t('enterprise.createJob')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('enterprise.jobName')} className="w-full max-w-md px-3 py-2 rounded-lg border bg-background" />
            <input value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 9 * * *" className="w-full max-w-md px-3 py-2 rounded-lg border bg-background font-mono" />
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-2 rounded-lg border bg-background">
              <option value="yaml">YAML</option>
              <option value="terraform">Terraform</option>
            </select>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-32 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
            <Button onClick={create} disabled={!name || !cron}>{t('enterprise.createJob')}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('enterprise.scheduledJobs')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {jobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between p-2 border rounded text-sm">
                <div>
                  <strong>{j.name}</strong> — {j.cronExpression}
                  {j.lastStatus && <span className="ml-2 text-muted-foreground">({j.lastStatus})</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => runNow(j.id)}>{t('enterprise.runNow')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(j)}>{j.enabled ? t('enterprise.disable') : t('enterprise.enable')}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
