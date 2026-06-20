'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CodeEditor } from '@/components/editor/code-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { FileFormat } from '@iac-platform/shared';
import { useI18n } from '@/i18n/provider';

export default function CompliancePage() {
  const { t } = useI18n();
  const [content, setContent] = useState('resource "aws_security_group" "web" {\n  ingress {\n    cidr_blocks = ["0.0.0.0/0"]\n  }\n}');
  const [format] = useState<FileFormat>('terraform');
  const [result, setResult] = useState<{
    findings: Array<{ severity: string; title: string; description: string; line?: number }>;
    riskScores: { security: number; reliability: number; cost: number; maintainability: number; overall: number };
    compliance: Array<{ framework: string; findings: Array<{ rule: string; passed: boolean; description: string }> }>;
  } | null>(null);

  const scan = async () => {
    const res = await api.post<typeof result>('/compliance/scan', {
      content, format, frameworks: ['CIS', 'NIST', 'SOC2', 'ISO27001'],
    });
    setResult(res);
  };

  return (
    <AppShell>
      <div className="p-6 space-y-4 overflow-auto h-full">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('compliance.title')}</h1>
          <Button onClick={scan}>{t('compliance.runScan')}</Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-[400px] border rounded-lg overflow-hidden">
            <CodeEditor value={content} onChange={setContent} format={format} />
          </div>
          <div className="space-y-4">
            {result?.riskScores && (
              <Card>
                <CardHeader><CardTitle>{t('compliance.riskScores')}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {Object.entries(result.riskScores).map(([key, val]) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="text-2xl font-bold">{val}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {result?.findings && (
              <Card>
                <CardHeader><CardTitle>{t('compliance.findings')} ({result.findings.length})</CardTitle></CardHeader>
                <CardContent className="max-h-60 overflow-y-auto space-y-2">
                  {result.findings.map((f, i) => (
                    <div key={i} className="p-2 rounded bg-secondary text-sm">
                      <span className="font-medium text-red-500">[{f.severity}]</span> {f.title}
                      {f.line && <span className="text-muted-foreground"> (L{f.line})</span>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {result?.compliance && (
              <Card>
                <CardHeader><CardTitle>{t('compliance.frameworks')}</CardTitle></CardHeader>
                <CardContent>
                  {result.compliance.map((c) => (
                    <div key={c.framework} className="mb-3">
                      <p className="font-medium">{c.framework}</p>
                      {c.findings.map((f, i) => (
                        <div key={i} className="text-sm flex items-center gap-2 mt-1">
                          <span className={f.passed ? 'text-green-500' : 'text-red-500'}>{f.passed ? '✓' : '✗'}</span>
                          {f.rule}: {f.description}
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
