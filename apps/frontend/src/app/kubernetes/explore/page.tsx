'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n/provider';
import type { K8sResourceNode } from '@iac-platform/shared';

export default function K8sExplorePage() {
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [resources, setResources] = useState<K8sResourceNode[]>([]);
  const [selected, setSelected] = useState<K8sResourceNode | null>(null);

  const explore = async () => {
    const result = await api.post<{ resources: K8sResourceNode[]; totalCount: number }>('/yaml/kubernetes/explore', { content });
    setResources(result.resources);
    setSelected(result.resources[0] || null);
  };

  const renderNode = (node: K8sResourceNode, depth = 0) => (
    <div key={node.id} style={{ marginLeft: depth * 16 }}>
      <button
        onClick={() => setSelected(node)}
        className={`text-sm w-full text-left p-1 rounded hover:bg-accent ${selected?.id === node.id ? 'bg-primary/10' : ''}`}
      >
        {node.kind}/{node.name} {node.namespace && <span className="text-muted-foreground">({node.namespace})</span>}
      </button>
      {node.children?.map((c) => renderNode(c, depth + 1))}
    </div>
  );

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <h1 className="text-2xl font-bold">{t('enterprise.k8sTitle')}</h1>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Kubernetes YAML" className="w-full h-40 px-3 py-2 rounded-lg border bg-background font-mono text-sm" />
        <Button onClick={explore} disabled={!content}>{t('enterprise.exploreResources')}</Button>
        {resources.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('enterprise.resourceTree')} ({resources.length})</CardTitle></CardHeader>
              <CardContent>{resources.map((r) => renderNode(r))}</CardContent>
            </Card>
            {selected && (
              <Card>
                <CardHeader><CardTitle>{selected.kind}: {selected.name}</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                  {selected.apiVersion && <div>apiVersion: {selected.apiVersion}</div>}
                  {selected.namespace && <div>namespace: {selected.namespace}</div>}
                  {selected.labels && Object.entries(selected.labels).map(([k, v]) => <div key={k}>{k}: {v}</div>)}
                  {selected.children && <div className="mt-2">{selected.children.length} child resources</div>}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
