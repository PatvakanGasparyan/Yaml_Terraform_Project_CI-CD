'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { useI18n } from '@/i18n/provider';
import type { InfrastructureDiagramResult } from '@iac-platform/shared';

export default function DiagramsPage() {
  const { isAuthenticated } = useAuthStore();
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [format, setFormat] = useState('terraform');
  const [diagram, setDiagram] = useState<InfrastructureDiagramResult | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; format: string; resourceCount: number; createdAt: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) api.get<typeof history>('/diagrams').then(setHistory).catch(() => {});
  }, [isAuthenticated]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await api.post<InfrastructureDiagramResult>('/diagrams/generate', { content, format });
      setDiagram(result);
      setHistory(await api.get<typeof history>('/diagrams'));
    } finally {
      setLoading(false);
    }
  };

  const loadDiagram = async (id: string) => {
    const d = await api.get<InfrastructureDiagramResult>(`/diagrams/${id}`);
    setDiagram(d);
  };

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">{t('enterprise.diagramsTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('common.signInRequired')}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.diagramsTitle')}</h1>
        <p className="text-muted-foreground">{t('enterprise.diagramsDesc')}</p>
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="px-3 py-2 rounded-lg border bg-background">
          <option value="terraform">Terraform</option>
          <option value="yaml">YAML / Kubernetes</option>
        </select>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full h-40 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
        <Button onClick={generate} disabled={!content || loading}>{loading ? t('common.loading') : t('enterprise.generateDiagram')}</Button>
        {diagram && (
          <Card>
            <CardHeader><CardTitle>{t('enterprise.mermaidDiagram')} ({diagram.resourceCount} resources)</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto bg-secondary p-3 rounded">{diagram.mermaid}</pre>
            </CardContent>
          </Card>
        )}
        {history.length > 0 && (
          <Card>
            <CardHeader><CardTitle>{t('enterprise.diagramHistory')}</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {history.map((h) => (
                <button key={h.id} onClick={() => loadDiagram(h.id)} className="block w-full text-left p-2 border rounded text-sm hover:bg-accent">
                  {h.format} — {h.resourceCount} resources
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
