'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { CodeEditor } from '@/components/editor/code-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { FileFormat } from '@iac-platform/shared';
import { useI18n } from '@/i18n/provider';

export default function ConvertPage() {
  const { t } = useI18n();
  const [content, setContent] = useState('key: value\nlist:\n  - item1\n  - item2');
  const [from, setFrom] = useState<FileFormat>('yaml');
  const [to, setTo] = useState<FileFormat>('json');
  const [result, setResult] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const convert = async () => {
    const res = await api.post<{ content: string; valid: boolean }>('/conversion', { content, from, to });
    setResult(res.content);
    setValid(res.valid);
  };

  const download = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${to}`;
    a.click();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="p-6 h-full flex flex-col gap-4 overflow-auto">
        <h1 className="text-2xl font-bold">{t('convert.title')}</h1>
        <div className="flex gap-4 items-center flex-wrap">
          <select value={from} onChange={(e) => setFrom(e.target.value as FileFormat)} className="px-3 py-2 rounded-lg border bg-background">
            <option value="yaml">YAML</option><option value="json">JSON</option><option value="xml">XML</option>
            <option value="toml">TOML</option><option value="terraform">Terraform</option><option value="csv">CSV</option>
            <option value="ini">INI</option>
          </select>
          <span>→</span>
          <select value={to} onChange={(e) => setTo(e.target.value as FileFormat)} className="px-3 py-2 rounded-lg border bg-background">
            <option value="json">JSON</option><option value="yaml">YAML</option><option value="xml">XML</option>
            <option value="terraform">Terraform</option><option value="toml">TOML</option><option value="csv">CSV</option>
            <option value="ini">INI</option>
          </select>
          <Button onClick={convert}>{t('convert.convert')}</Button>
          {result && (
            <>
              <Button variant="outline" onClick={download}>{t('common.download')}</Button>
              <Button variant="outline" onClick={copyToClipboard}>{copied ? t('common.copied') : t('common.copy')}</Button>
              {valid !== null && (
                <span className={`text-sm font-medium ${valid ? 'text-green-500' : 'text-red-500'}`}>
                  {valid ? t('convert.valid') : t('convert.invalid')}
                </span>
              )}
            </>
          )}
        </div>
        <div className="grid lg:grid-cols-2 gap-4 flex-1">
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>{t('convert.source')} ({from})</CardTitle></CardHeader>
            <CardContent className="h-[400px] p-0">
              <CodeEditor value={content} onChange={setContent} format={from} />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>{t('convert.result')} ({to})</CardTitle></CardHeader>
            <CardContent className="h-[400px] p-0">
              <CodeEditor value={result} onChange={setResult} format={to} readOnly />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
