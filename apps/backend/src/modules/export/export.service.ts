import { Injectable } from '@nestjs/common';
import type { ValidationResult, SecurityAuditResult } from '@iac-platform/shared';

@Injectable()
export class ExportService {
  exportJson(data: Record<string, unknown>) {
    return JSON.stringify(data, null, 2);
  }

  exportHtmlReport(title: string, sections: Array<{ heading: string; content: string }>) {
    const sectionsHtml = sections
      .map((s) => `<section><h2>${s.heading}</h2><pre>${this.escapeHtml(s.content)}</pre></section>`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
  h1 { color: #1a1a2e; } h2 { color: #16213e; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 8px; overflow-x: auto; white-space: pre-wrap; }
  .meta { color: #666; font-size: 0.9rem; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated: ${new Date().toISOString()}</p>
  ${sectionsHtml}
</body>
</html>`;
  }

  exportValidationReport(
    fileName: string,
    validation: ValidationResult,
    security?: SecurityAuditResult,
  ) {
    return this.exportHtmlReport(`Validation Report: ${fileName}`, [
      { heading: 'Summary', content: `Valid: ${validation.valid}\nScore: ${validation.score}\nIssues: ${validation.issues.length}` },
      { heading: 'Issues', content: validation.issues.map((i) => `[${i.severity}] Line ${i.line || '?'}: ${i.message}`).join('\n') },
      ...(security ? [{ heading: 'Security', content: `Score: ${security.score}\n${security.summary}\n\n${security.findings.map((f) => `[${f.severity}] ${f.title}: ${f.description}`).join('\n')}` }] : []),
    ]);
  }

  exportCsv(data: Array<Record<string, unknown>>) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  private escapeHtml(text: string) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
