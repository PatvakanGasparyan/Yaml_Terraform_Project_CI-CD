'use client';

import { useState } from 'react';
import type { ValidationIssue } from '@iac-platform/shared';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, XCircle, HelpCircle } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { useEditorStore } from '@/stores';
import { api } from '@/lib/api';
import type { ErrorExplanation } from '@iac-platform/shared';
import { Button } from '@/components/ui/button';

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  info: { icon: Info, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

interface IssuesPanelProps {
  issues: ValidationIssue[];
  score?: number;
}

export function IssuesPanel({ issues, score }: IssuesPanelProps) {
  const { t } = useI18n();
  const { getActiveTab } = useEditorStore();
  const [explaining, setExplaining] = useState<number | null>(null);
  const [creatingIssue, setCreatingIssue] = useState<number | null>(null);
  const [issueLinks, setIssueLinks] = useState<Record<number, string>>({});
  const [explanations, setExplanations] = useState<Record<number, ErrorExplanation>>({});

  const createIssue = async (issue: ValidationIssue, index: number) => {
    const tab = getActiveTab();
    if (!tab) return;
    const repo = window.prompt('GitHub repository (owner/repo):');
    if (!repo) return;
    setCreatingIssue(index);
    try {
      const result = await api.post<{ issueUrl: string }>('/github/issues/from-validation', {
        repo,
        content: tab.content,
        format: tab.format,
        issue: { message: issue.message, line: issue.line, severity: issue.severity, rule: issue.rule },
      });
      setIssueLinks((prev) => ({ ...prev, [index]: result.issueUrl }));
    } finally {
      setCreatingIssue(null);
    }
  };

  const explainIssue = async (issue: ValidationIssue, index: number) => {
    const tab = getActiveTab();
    if (!tab) return;
    setExplaining(index);
    try {
      const result = await api.post<ErrorExplanation>('/ai/explain-error', {
        content: tab.content,
        format: tab.format,
        issue: { message: issue.message, line: issue.line, severity: issue.severity, rule: issue.rule },
      });
      setExplanations((prev) => ({ ...prev, [index]: result }));
    } finally {
      setExplaining(null);
    }
  };

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <div className="text-green-500 text-4xl mb-2">✓</div>
        <p className="font-medium">{t('editor.noIssues')}</p>
        {score !== undefined && <p className="text-sm mt-1">{t('editor.validationScore')}: {score}/100</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {score !== undefined && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('editor.validationScore')}</span>
            <span className={cn('text-lg font-bold', score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500')}>
              {score}/100
            </span>
          </div>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${score}%` }} />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {issues.map((issue, i) => {
          const config = severityConfig[issue.severity] || severityConfig.info;
          const Icon = config.icon;
          const explanation = explanations[i];
          return (
            <div key={i} className={cn('p-3 rounded-lg border border-border', config.bg)}>
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-medium uppercase', config.color)}>{issue.severity}</span>
                    {issue.line && <span className="text-xs text-muted-foreground">{t('editor.line')} {issue.line}</span>}
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => explainIssue(issue, i)} disabled={explaining === i}>
                      <HelpCircle className="h-3 w-3 mr-1" />{explaining === i ? t('common.loading') : t('editor.explainError')}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => createIssue(issue, i)} disabled={creatingIssue === i}>
                      {creatingIssue === i ? t('common.loading') : t('enterprise.createIssue')}
                    </Button>
                  </div>
                  <p className="text-sm mt-1">{issue.message}</p>
                  {issue.suggestion && <p className="text-xs text-muted-foreground mt-1">💡 {issue.suggestion}</p>}
                  {issueLinks[i] && (
                    <a href={issueLinks[i]} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block">
                      {t('enterprise.issueCreated')}
                    </a>
                  )}
                  {explanation && (
                    <div className="mt-3 space-y-2 text-xs border-t border-border pt-2">
                      <div><strong>{t('editor.whatHappened')}:</strong> {explanation.whatHappened}</div>
                      <div><strong>{t('editor.whyItHappened')}:</strong> {explanation.whyItHappened}</div>
                      <div><strong>{t('editor.howToFix')}:</strong> {explanation.howToFix}</div>
                      {explanation.exampleFix && <pre className="bg-secondary p-2 rounded mt-1 overflow-x-auto">{explanation.exampleFix}</pre>}
                      {explanation.documentation?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {explanation.documentation.map((d, j) => (
                            <a key={j} href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{d.title}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
