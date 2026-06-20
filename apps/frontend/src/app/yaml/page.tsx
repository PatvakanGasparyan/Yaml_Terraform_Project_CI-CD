'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CodeEditor } from '@/components/editor/code-editor';
import { IssuesPanel } from '@/components/editor/issues-panel';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { ValidationResult } from '@iac-platform/shared';
import { useI18n } from '@/i18n/provider';

const SCHEMAS = ['kubernetes', 'openapi', 'docker-compose', 'github-actions', 'helm'] as const;

export default function YamlPage() {
  const { t } = useI18n();
  const [content, setContent] = useState('# YAML Schema Validation\napiVersion: v1\nkind: Service\n');
  const [schema, setSchema] = useState<typeof SCHEMAS[number]>('kubernetes');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validate = async () => {
    const res = await api.post<ValidationResult>('/yaml/validate-schema', { content, schemaType: schema });
    setResult(res);
  };

  return (
    <AppShell>
      <div className="p-6 h-full flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{t('yaml.title')}</h1>
        <div className="flex gap-2 flex-wrap items-center">
          {SCHEMAS.map((s) => (
            <Button key={s} variant={schema === s ? 'default' : 'outline'} size="sm" onClick={() => setSchema(s)}>
              {s}
            </Button>
          ))}
          <Button onClick={validate} className="ml-auto">{t('yaml.validateSchema')}</Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="h-[500px] border rounded-lg overflow-hidden">
            <CodeEditor value={content} onChange={setContent} format="yaml" />
          </div>
          <div className="border rounded-lg overflow-hidden h-[500px]">
            <IssuesPanel issues={result?.issues || []} score={result?.score} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
