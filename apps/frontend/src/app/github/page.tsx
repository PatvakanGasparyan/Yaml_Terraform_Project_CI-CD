'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { GitCommit, RotateCcw, Sparkles } from 'lucide-react';

export default function GithubPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [repos, setRepos] = useState<Array<{ fullName: string; defaultBranch: string }>>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [branch, setBranch] = useState('main');
  const [commits, setCommits] = useState<Array<{ sha: string; message: string; author: string; date: string }>>([]);
  const [history, setHistory] = useState<Array<{ actionType: string; repository: string; createdAt: string }>>([]);
  const [commitPath, setCommitPath] = useState('');
  const [commitContent, setCommitContent] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [rollbackSha, setRollbackSha] = useState('');
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [recentFiles, setRecentFiles] = useState<Array<{ fileName: string; format: string }>>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<typeof repos>('/github/repositories').then(setRepos).catch(() => {});
      api.get<typeof history>('/github/history').then(setHistory).catch(() => {});
      api.get<typeof recentFiles>('/recent-files').then(setRecentFiles).catch(() => {});
    }
  }, [isAuthenticated]);

  const loadCommits = async (repo: string) => {
    setSelectedRepo(repo);
    const def = repos.find((r) => r.fullName === repo)?.defaultBranch || 'main';
    setBranch(def);
    const res = await api.post<typeof commits>('/github/commits', { repo, path: commitPath || undefined });
    setCommits(res);
  };

  const generateMessage = async () => {
    if (!commitContent || !originalContent) return;
    const result = await api.post<{ message: string; id: string }>('/github/generate-commit-message', {
      originalContent,
      newContent: commitContent,
      fileName: commitPath || 'file.yaml',
      format: 'yaml',
      repo: selectedRepo,
    });
    setCommitMessage(result.message);
  };

  const submitCommit = async () => {
    if (!selectedRepo || !commitPath || !commitMessage) return;
    await api.post('/github/commit', {
      repo: selectedRepo,
      path: commitPath,
      content: commitContent,
      message: commitMessage,
      branch,
    });
    loadCommits(selectedRepo);
    setCommitMessage('');
  };

  const confirmRollback = async () => {
    if (!rollbackSha || !selectedRepo || !commitPath) return;
    await api.post('/github/rollback', {
      repo: selectedRepo,
      commitSha: rollbackSha,
      path: commitPath,
      branch,
    });
    setShowRollbackConfirm(false);
    loadCommits(selectedRepo);
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('github.title')}</h1>
          <p className="text-muted-foreground mb-4">{t('github.signInPrompt')}</p>
          <Button asChild><a href="/auth/login">{t('common.signIn')}</a></Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('github.title')}</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>{t('github.repositories')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {repos.map((r) => (
                <button key={r.fullName} onClick={() => loadCommits(r.fullName)}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm font-mono ${selectedRepo === r.fullName ? 'bg-primary/10 ring-1 ring-primary' : ''}`}>
                  {r.fullName} <span className="text-muted-foreground text-xs">({r.defaultBranch})</span>
                </button>
              ))}
            </CardContent>
          </Card>
          <ActivityFeed />
        </div>

        {selectedRepo && (
          <>
            <Card>
              <CardHeader><CardTitle>{t('github.commitFile')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <input value={commitPath} onChange={(e) => setCommitPath(e.target.value)} placeholder={t('github.filePath')} className="px-3 py-2 rounded border bg-background text-sm" />
                  <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder={t('github.branch')} className="px-3 py-2 rounded border bg-background text-sm" />
                </div>
                <textarea value={originalContent} onChange={(e) => setOriginalContent(e.target.value)} placeholder={t('github.originalContent')} className="w-full h-20 px-3 py-2 rounded border bg-background text-sm font-mono" />
                <textarea value={commitContent} onChange={(e) => setCommitContent(e.target.value)} placeholder={t('github.newContent')} className="w-full h-32 px-3 py-2 rounded border bg-background text-sm font-mono" />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={generateMessage}><Sparkles className="h-4 w-4 mr-1" />{t('github.generateMessage')}</Button>
                  {recentFiles.slice(0, 3).map((f) => (
                    <Button key={f.fileName} variant="ghost" size="sm" onClick={() => setCommitPath(f.fileName)}>{f.fileName}</Button>
                  ))}
                </div>
                <input value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} placeholder={t('github.commitMessage')} className="w-full px-3 py-2 rounded border bg-background text-sm" />
                <Button onClick={submitCommit} disabled={!commitMessage}><GitCommit className="h-4 w-4 mr-1" />{t('github.commit')}</Button>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>{t('github.commits')} — {selectedRepo}</CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                  {commits.map((c) => (
                    <div key={c.sha} className="p-3 rounded-lg bg-secondary text-sm">
                      <p className="font-medium truncate">{c.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.sha.slice(0, 7)} · {c.author} · {new Date(c.date).toLocaleDateString()}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => { setRollbackSha(c.sha); setShowRollbackConfirm(true); }}>
                        <RotateCcw className="h-3 w-3 mr-1" />{t('github.rollback')}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('github.actionHistory')}</CardTitle></CardHeader>
                <CardContent>
                  {history.filter((h) => h.repository === selectedRepo).map((h, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-border text-sm">
                      <span>{h.actionType} → {h.repository}</span>
                      <span className="text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {showRollbackConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader><CardTitle>{t('github.confirmRollback')}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{t('github.rollbackWarning')}</p>
                <p className="text-xs font-mono text-muted-foreground">{rollbackSha}</p>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={confirmRollback}>{t('github.confirmRollbackBtn')}</Button>
                  <Button variant="outline" onClick={() => setShowRollbackConfirm(false)}>{t('common.cancel')}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
