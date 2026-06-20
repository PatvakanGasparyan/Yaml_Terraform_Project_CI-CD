'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { AuditLogEntry } from '@iac-platform/shared';
import { Download, Search } from 'lucide-react';

export default function AuditPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (search) params.set('search', search);
    if (actionFilter) params.set('action', actionFilter);
    api.get<{ items: AuditLogEntry[]; total: number }>(`/audit?${params}`).then((r) => {
      setEntries(r.items);
      setTotal(r.total);
    }).catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, page, actionFilter]);

  const exportCsv = () => {
    const token = localStorage.getItem('accessToken');
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/audit/export/csv?token=${token}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('audit.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('audit.title')}</h1>
          <Button variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/audit/export/csv`, '_blank')}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder={t('common.search')} className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
          </div>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 rounded-lg border bg-background text-sm">
            <option value="">{t('audit.allActions')}</option>
            {['login', 'validation', 'fix', 'conversion', 'github_commit', 'github_rollback', 'terraform_plan', 'workflow', 'backup'].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <Button onClick={load}>{t('common.search')}</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>{t('audit.log')} ({total})</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4">{t('audit.time')}</th>
                  <th className="py-2 pr-4">{t('audit.action')}</th>
                  <th className="py-2 pr-4">{t('audit.module')}</th>
                  <th className="py-2 pr-4">{t('audit.status')}</th>
                  <th className="py-2 pr-4">{t('audit.duration')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-accent/50">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{e.action}</td>
                    <td className="py-2 pr-4">{e.module || '—'}</td>
                    <td className="py-2 pr-4"><span className={e.status === 'success' ? 'text-green-500' : e.status === 'failed' ? 'text-red-500' : 'text-yellow-500'}>{e.status}</span></td>
                    <td className="py-2 pr-4">{e.durationMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
