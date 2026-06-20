'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiffViewer } from '@/components/editor/diff-viewer';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { BranchCompareResult } from '@iac-platform/shared';
import { Star } from 'lucide-react';

export default function GithubComparePage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [repos, setRepos] = useState<Array<{ fullName: string; defaultBranch: string }>>([]);
  const [repo, setRepo] = useState('');
  const [branches, setBranches] = useState<Array<{ name: string; sha: string }>>([]);
  const [base, setBase] = useState('main');
  const [head, setHead] = useState('');
  const [compare, setCompare] = useState<BranchCompareResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Array<{ id: string; repository: string; pinned: boolean }>>([]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get<typeof repos>('/github/repositories').then(setRepos).catch(() => {});
      api.get<typeof favorites>('/favorites').then(setFavorites).catch(() => {});
    }
  }, [isAuthenticated]);

  const loadBranches = async (r: string) => {
    setRepo(r);
    const b = await api.post<typeof branches>('/github/branches', { repo: r });
    setBranches(b);
    const def = repos.find((x) => x.fullName === r)?.defaultBranch || 'main';
    setBase(def);
    setHead(b.find((x) => x.name !== def)?.name || def);
  };

  const runCompare = async () => {
    if (!repo || !base || !head) return;
    const result = await api.post<BranchCompareResult>('/github/compare', { repo, base, head });
    setCompare(result);
    setSelectedFile(result.files[0]?.filename || null);
  };

  const addFavorite = async (fullName: string, defaultBranch: string) => {
    await api.post('/favorites', { repository: fullName, defaultBranch });
    const f = await api.get<typeof favorites>('/favorites');
    setFavorites(f);
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('github.compareTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('github.signInPrompt')}</p>
        </div>
      </AppShell>
    );
  }

  const selectedPatch = compare?.files.find((f) => f.filename === selectedFile)?.patch || '';

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('github.compareTitle')}</h1>
        <div className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="text-xs text-muted-foreground">{t('github.repositories')}</label>
            <select value={repo} onChange={(e) => loadBranches(e.target.value)} className="block px-3 py-2 rounded-lg border bg-background min-w-[200px]">
              <option value="">{t('github.selectRepo')}</option>
              {repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}</option>)}
            </select>
          </div>
          {repo && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">{t('github.baseBranch')}</label>
                <select value={base} onChange={(e) => setBase(e.target.value)} className="block px-3 py-2 rounded-lg border bg-background">
                  {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t('github.headBranch')}</label>
                <select value={head} onChange={(e) => setHead(e.target.value)} className="block px-3 py-2 rounded-lg border bg-background">
                  {branches.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <Button onClick={runCompare}>{t('github.compare')}</Button>
              <Button variant="outline" size="sm" onClick={() => addFavorite(repo, base)}>
                <Star className="h-4 w-4 mr-1" /> {t('github.addFavorite')}
              </Button>
            </>
          )}
        </div>

        {favorites.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {favorites.map((f) => (
              <Button key={f.id} variant="outline" size="sm" onClick={() => loadBranches(f.repository)}>
                {f.pinned && '★ '}{f.repository}
              </Button>
            ))}
          </div>
        )}

        {compare && (
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>{t('github.changedFiles')} ({compare.files.length})</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                <div className="text-xs text-muted-foreground px-4 pb-2">+{compare.totalAdditions} / -{compare.totalDeletions}</div>
                {compare.files.map((f) => (
                  <button key={f.filename} onClick={() => setSelectedFile(f.filename)}
                    className={`w-full text-left px-4 py-2 text-sm border-b border-border hover:bg-accent ${selectedFile === f.filename ? 'bg-primary/10' : ''}`}>
                    <span className={`text-xs mr-2 ${f.status === 'added' ? 'text-green-500' : f.status === 'removed' ? 'text-red-500' : 'text-yellow-500'}`}>{f.status}</span>
                    {f.filename}
                    <span className="text-xs text-muted-foreground ml-2">+{f.additions}/-{f.deletions}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>{selectedFile || t('github.diff')}</CardTitle></CardHeader>
              <CardContent className="max-h-[500px] overflow-auto">
                {selectedPatch ? <DiffViewer diff={selectedPatch} /> : <p className="text-muted-foreground text-sm">{t('github.noDiff')}</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
