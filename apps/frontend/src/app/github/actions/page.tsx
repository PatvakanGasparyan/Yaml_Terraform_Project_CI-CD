'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { GitHubWorkflowRun } from '@iac-platform/shared';
import { RefreshCw, ExternalLink, RotateCcw } from 'lucide-react';

export default function GithubActionsPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [repos, setRepos] = useState<Array<{ fullName: string }>>([]);
  const [repo, setRepo] = useState('');
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Array<{ id: number; name: string; status: string; conclusion: string | null; html_url: string }>>([]);
  const [loading, setLoading] = useState(false);

  const loadRuns = useCallback(async (r: string) => {
    setLoading(true);
    try {
      const data = await api.post<GitHubWorkflowRun[]>('/github/workflows', { repo: r });
      setRuns(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<typeof repos>('/github/repositories').then(setRepos).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!repo) return;
    loadRuns(repo);
    const interval = setInterval(() => loadRuns(repo), 30000);
    return () => clearInterval(interval);
  }, [repo, loadRuns]);

  const loadJobs = async (runId: number) => {
    setSelectedRun(runId);
    const data = await api.post<typeof jobs>(`/github/workflows/${runId}/logs`, { repo });
    setJobs(data);
  };

  const rerun = async (runId: number) => {
    await api.post(`/github/workflows/${runId}/rerun`, { repo });
    loadRuns(repo);
  };

  const statusColor = (run: GitHubWorkflowRun) => {
    if (run.status === 'in_progress' || run.status === 'queued') return 'text-blue-500';
    if (run.conclusion === 'success') return 'text-green-500';
    if (run.conclusion === 'failure') return 'text-red-500';
    if (run.conclusion === 'cancelled') return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('github.actionsTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('github.signInPrompt')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('github.actionsTitle')}</h1>
          {repo && (
            <Button variant="outline" size="sm" onClick={() => loadRuns(repo)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> {t('common.refresh')}
            </Button>
          )}
        </div>

        <select value={repo} onChange={(e) => { setRepo(e.target.value); setRuns([]); }} className="px-3 py-2 rounded-lg border bg-background min-w-[300px]">
          <option value="">{t('github.selectRepo')}</option>
          {repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
        </select>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>{t('github.workflowRuns')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {runs.map((run) => (
                <div key={run.id} className={`p-3 rounded-lg border border-border cursor-pointer hover:bg-accent ${selectedRun === run.id ? 'ring-1 ring-primary' : ''}`}
                  onClick={() => loadJobs(run.id)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{run.name}</p>
                      <p className={`text-xs ${statusColor(run)}`}>
                        {run.status === 'completed' ? run.conclusion : run.status}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{run.branch} · {run.actor} · {run.event}</p>
                    </div>
                    <div className="flex gap-1">
                      {run.durationSeconds != null && <span className="text-xs text-muted-foreground">{run.durationSeconds}s</span>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); rerun(run.id); }}>
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      <a href={run.htmlUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('github.workflowJobs')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('github.selectRun')}</p>
              ) : jobs.map((j) => (
                <div key={j.id} className="flex justify-between items-center p-2 rounded bg-secondary text-sm">
                  <span>{j.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${j.conclusion === 'success' ? 'text-green-500' : j.conclusion === 'failure' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {j.status === 'completed' ? j.conclusion : j.status}
                    </span>
                    <a href={j.html_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /></a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
