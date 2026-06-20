'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CodeEditor } from '@/components/editor/code-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { DependencyGraph } from '@iac-platform/shared';
import { useI18n } from '@/i18n/provider';

const SAMPLE_TF = `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "main-vpc" }
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}
`;

export default function TerraformPage() {
  const { t } = useI18n();
  const [content, setContent] = useState(SAMPLE_TF);
  const [graph, setGraph] = useState<DependencyGraph | null>(null);
  const [cost, setCost] = useState<{ monthlyEstimateUsd: number; breakdown: Array<{ resource: string; estimatedMonthly: number }> } | null>(null);
  const [modules, setModules] = useState<unknown>(null);

  const runAction = async (endpoint: string, setter?: (data: unknown) => void) => {
    const result = await api.post<Record<string, unknown>>(endpoint, { content });
    if (setter) setter(result);
    else if (result && typeof result.formatted === 'string') setContent(result.formatted);
  };

  return (
    <AppShell>
      <div className="p-6 h-full flex flex-col gap-4 overflow-auto">
        <h1 className="text-2xl font-bold">{t('terraform.title')}</h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => runAction('/terraform/validate')}>{t('terraform.validate')}</Button>
          <Button variant="secondary" onClick={() => runAction('/terraform/format')}>{t('terraform.format')}</Button>
          <Button variant="outline" onClick={() => runAction('/terraform/dependency-graph', (d) => setGraph(d as DependencyGraph))}>{t('terraform.dependencyGraph')}</Button>
          <Button variant="outline" onClick={() => runAction('/terraform/modules', setModules)}>{t('terraform.moduleAnalysis')}</Button>
          <Button variant="outline" onClick={() => runAction('/terraform/cost-estimate', (d) => setCost(d as NonNullable<typeof cost>))}>{t('terraform.costEstimate')}</Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="h-[400px] lg:h-auto border rounded-lg overflow-hidden">
            <CodeEditor value={content} onChange={setContent} format="terraform" />
          </div>
          <div className="space-y-4 overflow-y-auto">
            {cost && (
              <Card>
                <CardHeader><CardTitle>{t('terraform.costTitle')}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">${cost.monthlyEstimateUsd}/mo</p>
                  {cost.breakdown.map((b) => (
                    <div key={b.resource} className="flex justify-between text-sm mt-2">
                      <span>{b.resource}</span><span>${b.estimatedMonthly}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {graph && (
              <Card>
                <CardHeader><CardTitle>{t('terraform.graphTitle')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {graph.nodes.map((n) => (
                      <div key={n.id} className="px-3 py-2 rounded bg-secondary text-sm font-mono">{n.label} <span className="text-muted-foreground">({n.type})</span></div>
                    ))}
                    {graph.edges.map((e, i) => (
                      <div key={i} className="text-xs text-muted-foreground pl-4">{e.from} → {e.to}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {modules != null && (
              <Card>
                <CardHeader><CardTitle>{t('terraform.moduleTitle')}</CardTitle></CardHeader>
                <CardContent><pre className="text-xs overflow-auto">{JSON.stringify(modules, null, 2)}</pre></CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
