'use client';

import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { motion } from 'framer-motion';
import {
  CheckCircle, Wrench, BookOpen, Shield, Zap, Upload, Plus, X, Download, Rocket,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { CodeEditor } from '@/components/editor/code-editor';
import { IssuesPanel } from '@/components/editor/issues-panel';
import { DiffViewer } from '@/components/editor/diff-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEditorStore, useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/provider';
import { api } from '@/lib/api';
import type { WorkflowResult } from '@iac-platform/shared';

const DEFAULT_YAML = `# Sample Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
`;

export default function EditorPage() {
  const {
    tabs, activeTabId,     validationResult, fixDiff, hoverExplain, explanation, securityResult, optimizeResult,
    isValidating, isFixing, isOptimizing, isAuditing,
    addTab, closeTab, setActiveTab, updateTabContent,
    validate, fixAll, explain, hoverLine, securityAudit, optimize,
  } = useEditorStore();
  const { rightPanel, setRightPanel } = useUIStore();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [workflowRepo, setWorkflowRepo] = useState('');
  const [workflowPath, setWorkflowPath] = useState('');
  const [workflowBranch, setWorkflowBranch] = useState('main');
  const [workflowRunning, setWorkflowRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const originalContentRef = useRef<string>('');

  useEffect(() => {
    if (tabs.length === 0) {
      addTab('deployment.yaml', DEFAULT_YAML);
    }
  }, [tabs.length, addTab]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => addTab(file.name, ev.target?.result as string);
    e.target.value = '';
  };

  const handleDownload = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runWorkflow = async () => {
    if (!activeTab || !workflowRepo || !workflowPath) return;
    setWorkflowRunning(true);
    try {
      const result = await api.post<WorkflowResult>('/workflow/full', {
        content: activeTab.content,
        originalContent: originalContentRef.current || activeTab.content,
        fileName: activeTab.name,
        format: activeTab.format,
        repo: workflowRepo,
        path: workflowPath,
        branch: workflowBranch,
      });
      setWorkflowResult(result);
      if (result.success) setWorkflowOpen(false);
    } finally {
      setWorkflowRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab && !originalContentRef.current) {
      originalContentRef.current = activeTab.content;
    }
  }, [activeTab?.id]);

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b border-border glass shrink-0 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => addTab('untitled.yaml', '')}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} accept=".yaml,.yml,.tf,.json,.xml,.toml,.hcl,.env,.csv,.md" />
          <Button size="sm" variant="outline" onClick={handleDownload} disabled={!activeTab}>
            <Download className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button size="sm" onClick={() => validate(true)} disabled={isValidating}>
            <CheckCircle className="h-4 w-4" /> {isValidating ? t('editor.validating') : t('editor.validate')}
          </Button>
          <Button size="sm" variant="secondary" onClick={fixAll} disabled={isFixing}>
            <Wrench className="h-4 w-4" /> {isFixing ? t('editor.fixing') : t('editor.fixAll')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { explain(); setRightPanel('explain'); }}>
            <BookOpen className="h-4 w-4" /> {t('editor.explain')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { optimize(); setRightPanel('optimize'); }} disabled={isOptimizing}>
            <Zap className="h-4 w-4" /> {t('editor.optimize')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { securityAudit(); setRightPanel('security'); }} disabled={isAuditing}>
            <Shield className="h-4 w-4" /> {t('editor.securityAudit')}
          </Button>
          <Button size="sm" variant="default" className="bg-gradient-to-r from-primary to-blue-500" onClick={() => { setWorkflowPath(activeTab?.name || ''); setWorkflowOpen(true); }} disabled={!activeTab}>
            <Rocket className="h-4 w-4" /> {t('editor.oneClickWorkflow')}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-2 border-b border-border bg-secondary/30 shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors',
                tab.id === activeTabId
                  ? 'border-primary bg-background text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.name}{tab.isDirty && ' •'}
              <X
                className="h-3 w-3 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              />
            </button>
          ))}
        </div>

        {/* Editor + Panel */}
        <PanelGroup direction="horizontal" className="flex-1">
          <Panel defaultSize={65} minSize={30}>
            <div className="h-full">
              {activeTab && (
                <CodeEditor
                  value={activeTab.content}
                  onChange={(v) => updateTabContent(activeTab.id, v)}
                  format={activeTab.format}
                  onLineHover={(line) => hoverLine(line)}
                />
              )}
            </div>
          </Panel>
          <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          <Panel defaultSize={35} minSize={20}>
            <div className="h-full flex flex-col border-l border-border">
              <div className="flex border-b border-border shrink-0">
                {(['issues', 'explain', 'hover', 'security', 'optimize'] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setRightPanel(panel)}
                    className={cn(
                      'px-4 py-2 text-sm',
                      rightPanel === panel ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {t(`editor.panel${panel.charAt(0).toUpperCase()}${panel.slice(1)}` as 'editor.panelIssues')}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden">
                {rightPanel === 'issues' && (
                  fixDiff ? (
                    <DiffViewer diff={fixDiff} />
                  ) : (
                    <IssuesPanel
                      issues={validationResult?.issues || []}
                      score={validationResult?.score}
                    />
                  )
                )}
                {rightPanel === 'explain' && (
                  <div className="p-4 overflow-y-auto h-full text-sm whitespace-pre-wrap">
                    {explanation || t('editor.explainPlaceholder')}
                  </div>
                )}
                {rightPanel === 'security' && securityResult && (
                  <div className="p-4 overflow-y-auto h-full space-y-3 text-sm">
                    <p className="font-medium">{t('compliance.findings')} — {securityResult.score}/100</p>
                    <p>{securityResult.summary}</p>
                    {securityResult.findings.map((f, i) => (
                      <div key={i} className="p-2 rounded bg-secondary">
                        <span className="font-medium text-red-500">[{f.severity}]</span> {f.title}
                      </div>
                    ))}
                  </div>
                )}
                {rightPanel === 'optimize' && optimizeResult && (
                  <div className="p-4 overflow-y-auto h-full space-y-3 text-sm">
                    {optimizeResult.map((s, i) => (
                      <div key={i} className="p-3 rounded bg-secondary">
                        <p className="font-medium">{s.title}</p>
                        <p className="text-muted-foreground mt-1">{s.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                {rightPanel === 'hover' && hoverExplain && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 overflow-y-auto h-full space-y-4 text-sm">
                    <div><strong>Line {hoverExplain.line}</strong></div>
                    <div><h4 className="font-medium text-primary">{t('editor.hoverWhatItDoes')}</h4><p>{hoverExplain.whatItDoes}</p></div>
                    <div><h4 className="font-medium text-primary">{t('editor.hoverWhyItExists')}</h4><p>{hoverExplain.whyItExists}</p></div>
                    {hoverExplain.bestPractices.length > 0 && (
                      <div><h4 className="font-medium text-primary">{t('editor.hoverBestPractices')}</h4><ul className="list-disc pl-4">{hoverExplain.bestPractices.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
                    )}
                    {hoverExplain.documentation.length > 0 && (
                      <div><h4 className="font-medium text-primary">{t('editor.hoverDocumentation')}</h4>
                        {hoverExplain.documentation.map((d, i) => (
                          <a key={i} href={d.url} target="_blank" rel="noopener" className="block text-primary hover:underline">{d.title}</a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>

        {workflowOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardHeader><CardTitle>{t('editor.oneClickWorkflow')}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <input value={workflowRepo} onChange={(e) => setWorkflowRepo(e.target.value)} placeholder="owner/repo" className="w-full px-3 py-2 rounded border bg-background text-sm" />
                <input value={workflowPath} onChange={(e) => setWorkflowPath(e.target.value)} placeholder={t('github.filePath')} className="w-full px-3 py-2 rounded border bg-background text-sm" />
                <input value={workflowBranch} onChange={(e) => setWorkflowBranch(e.target.value)} placeholder={t('github.branch')} className="w-full px-3 py-2 rounded border bg-background text-sm" />
                {workflowResult && (
                  <div className="text-sm space-y-1">
                    {workflowResult.steps.map((s, i) => (
                      <div key={i} className={s.status === 'success' ? 'text-green-500' : 'text-red-500'}>{s.step}: {s.message || s.status}</div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={runWorkflow} disabled={workflowRunning}>{workflowRunning ? t('common.loading') : t('editor.runWorkflow')}</Button>
                  <Button variant="outline" onClick={() => setWorkflowOpen(false)}>{t('common.cancel')}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
