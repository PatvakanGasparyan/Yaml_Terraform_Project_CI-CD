import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type {
  ExplainLevel,
  FileFormat,
  HoverExplainResult,
  OptimizationSuggestion,
  SecurityAuditResult,
  ValidationIssue,
} from '@iac-platform/shared';
import { ApiUsage } from '../../entities';
import { OpenAIClient } from './openai.client';
import type { OpenAICompletionRequest, OpenAIUsageContext } from './openai.types';
import { OPENAI_MODELS } from './openai.types';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private readonly client: OpenAIClient,
    @InjectRepository(ApiUsage) private readonly apiUsageRepo: Repository<ApiUsage>,
  ) {}

  isConfigured(): boolean {
    return this.client.isConfigured();
  }

  getModels(): string[] {
    return [...OPENAI_MODELS];
  }

  async complete(
    request: OpenAICompletionRequest,
    context?: OpenAIUsageContext,
    model?: string,
  ) {
    const start = Date.now();
    const response = await this.client.complete({ ...request, model: model || request.model });

    if (context?.userId) {
      await this.apiUsageRepo.save({
        id: uuidv4(),
        userId: context.userId,
        provider: 'openai',
        model: response.model,
        operation: context.operation,
        tokensInput: response.tokensInput,
        tokensOutput: response.tokensOutput,
        durationMs: Date.now() - start,
      });
    }

    return response;
  }

  async validate(content: string, format: FileFormat, userId?: string, model?: string): Promise<ValidationIssue[]> {
    const response = await this.complete(
      {
        systemPrompt: `You are an expert IaC validator for ${format}. Return JSON: {"issues":[{"line":number,"column":number,"severity":"critical"|"high"|"medium"|"low"|"info","message":string,"rule":string,"suggestion":string,"category":string}]}. Detect syntax, structure, security, deprecated syntax, missing fields, bad practices.`,
        userPrompt: `Format: ${format}\n\n\`\`\`\n${content}\n\`\`\``,
        jsonMode: true,
      },
      { userId, operation: 'validate' },
      model,
    );
    try {
      return (JSON.parse(response.content) as { issues: ValidationIssue[] }).issues || [];
    } catch {
      this.logger.warn('Failed to parse AI validation response');
      return [];
    }
  }

  async fix(content: string, format: FileFormat, issues: ValidationIssue[], userId?: string, model?: string): Promise<string> {
    const response = await this.complete(
      {
        systemPrompt: `Fix all issues in this ${format} file. Return ONLY corrected content with no markdown fences or explanation.`,
        userPrompt: `Issues:\n${JSON.stringify(issues, null, 2)}\n\nContent:\n${content}`,
      },
      { userId, operation: 'fix' },
      model,
    );
    return response.content.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  }

  async explain(content: string, format: FileFormat, level: ExplainLevel, userId?: string, model?: string): Promise<string> {
    const levels: Record<ExplainLevel, string> = {
      beginner: 'Explain simply for DevOps beginners.',
      intermediate: 'Explain for engineers with basic IaC knowledge.',
      expert: 'Deep technical analysis with advanced concepts.',
      detailed: 'Comprehensive explanation of every section.',
    };
    const response = await this.complete(
      {
        systemPrompt: `You are an expert ${format} instructor. ${levels[level]}`,
        userPrompt: content,
      },
      { userId, operation: 'explain' },
      model,
    );
    return response.content;
  }

  async optimize(content: string, format: FileFormat, userId?: string, model?: string): Promise<OptimizationSuggestion[]> {
    const response = await this.complete(
      {
        systemPrompt: `Optimize ${format} for performance, security, maintainability, cost. Return JSON: {"suggestions":[{"category":"performance"|"security"|"maintainability"|"cost","title":string,"description":string,"impact":"critical"|"high"|"medium"|"low","before":string,"after":string}]}`,
        userPrompt: content,
        jsonMode: true,
      },
      { userId, operation: 'optimize' },
      model,
    );
    try {
      return (JSON.parse(response.content) as { suggestions: OptimizationSuggestion[] }).suggestions || [];
    } catch {
      return [];
    }
  }

  async securityAudit(content: string, format: FileFormat, userId?: string, model?: string): Promise<SecurityAuditResult> {
    const response = await this.complete(
      {
        systemPrompt: `Security audit for ${format}. Return JSON: {"findings":[{"id":string,"severity":"critical"|"high"|"medium"|"low","title":string,"description":string,"line":number,"remediation":string,"category":string,"compliance":string[]}],"score":0-100,"summary":string}`,
        userPrompt: content,
        jsonMode: true,
      },
      { userId, operation: 'security_audit' },
      model,
    );
    try {
      return JSON.parse(response.content) as SecurityAuditResult;
    } catch {
      return { findings: [], score: 100, summary: 'Security audit unavailable' };
    }
  }

  async hoverExplain(
    content: string,
    format: FileFormat,
    line: number,
    lineContent: string,
    userId?: string,
    model?: string,
  ): Promise<HoverExplainResult> {
    const response = await this.complete(
      {
        systemPrompt: `Analyze line ${line} from ${format}. Return JSON: {"line":number,"whatItDoes":string,"whyItExists":string,"documentation":[{"title":string,"url":string,"type":"official"|"tutorial"|"best-practice"|"example"}],"securityImplications":string,"bestPractices":string[],"potentialErrors":string[],"suggestedImprovements":string[]}`,
        userPrompt: `Line ${line}: ${lineContent}\n\nFull file:\n${content}`,
        jsonMode: true,
      },
      { userId, operation: 'hover_explain' },
      model,
    );
    try {
      return JSON.parse(response.content) as HoverExplainResult;
    } catch {
      return {
        line,
        whatItDoes: lineContent,
        whyItExists: '',
        documentation: [],
        securityImplications: '',
        bestPractices: [],
        potentialErrors: [],
        suggestedImprovements: [],
      };
    }
  }

  async translate(text: string, targetLanguage: string, context?: string, userId?: string, model?: string): Promise<string> {
    const langs: Record<string, string> = { en: 'English', ru: 'Russian', hy: 'Armenian' };
    const response = await this.complete(
      {
        systemPrompt: `Translate to ${langs[targetLanguage] || targetLanguage}. Preserve technical terms. Context: ${context || 'UI'}. Return only translation.`,
        userPrompt: text,
      },
      { userId, operation: 'translate' },
      model,
    );
    return response.content;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    fileContext?: string,
    userId?: string,
    model?: string,
  ): Promise<string> {
    const system = fileContext
      ? `IaC assistant. Active file:\n\`\`\`\n${fileContext}\n\`\`\``
      : 'Expert IaC assistant for YAML, Terraform, Kubernetes, DevOps.';
    const conversation = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const response = await this.complete(
      { systemPrompt: system, userPrompt: conversation },
      { userId, operation: 'chat' },
      model,
    );
    return response.content;
  }

  async generate(prompt: string, format: FileFormat, userId?: string, model?: string): Promise<string> {
    const response = await this.complete(
      {
        systemPrompt: `Generate valid ${format} configuration. Return ONLY ${format} content.`,
        userPrompt: prompt,
      },
      { userId, operation: 'generate' },
      model,
    );
    return response.content.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
  }

  async rootCause(content: string, error: string, format: FileFormat, userId?: string, model?: string) {
    const response = await this.complete(
      {
        systemPrompt: 'Analyze IaC error root cause. Return JSON: {"cause":string,"fixes":string[]}',
        userPrompt: `Format: ${format}\nError: ${error}\n\n${content}`,
        jsonMode: true,
      },
      { userId, operation: 'root_cause' },
      model,
    );
    try {
      return JSON.parse(response.content) as { cause: string; fixes: string[] };
    } catch {
      return { cause: error, fixes: [] };
    }
  }

  async costAnalysis(content: string, format: FileFormat, userId?: string, model?: string): Promise<string> {
    const response = await this.complete(
      {
        systemPrompt: 'Analyze infrastructure cost implications. Provide monthly estimates, optimization tips, and cost breakdown by resource.',
        userPrompt: `Format: ${format}\n\n${content}`,
      },
      { userId, operation: 'cost_analysis' },
      model,
    );
    return response.content;
  }

  async generateDocumentation(content: string, format: FileFormat, userId?: string, model?: string): Promise<string> {
    const response = await this.complete(
      {
        systemPrompt: 'Generate comprehensive technical documentation in Markdown for this infrastructure configuration.',
        userPrompt: `Format: ${format}\n\n${content}`,
      },
      { userId, operation: 'generate_docs' },
      model,
    );
    return response.content;
  }

  async generateCommitMessage(
    diff: string,
    fileName: string,
    format: string,
    userId?: string,
    model?: string,
  ): Promise<{ message: string; type: string; scope?: string; body?: string }> {
    const response = await this.complete(
      {
        systemPrompt: `Generate a professional conventional commit message for IaC changes. Return JSON: {"message":"full commit line","type":"fix|feat|refactor|docs|chore","scope":"optional scope","body":"optional body"}. Examples: fix(terraform): resolve provider configuration issues`,
        userPrompt: `File: ${fileName}\nFormat: ${format}\n\nDiff:\n${diff.slice(0, 8000)}`,
        jsonMode: true,
      },
      { userId, operation: 'generate_commit' },
      model,
    );
    try {
      return JSON.parse(response.content) as { message: string; type: string; scope?: string; body?: string };
    } catch {
      return { message: `fix(${format}): update ${fileName}`, type: 'fix', scope: format };
    }
  }

  async explainError(
    issue: { message: string; line?: number; severity?: string; rule?: string },
    content: string,
    format: string,
    userId?: string,
    model?: string,
  ) {
    const response = await this.complete(
      {
        systemPrompt: `Explain this IaC validation error in plain language. Return JSON: {"whatHappened":string,"whyItHappened":string,"howToFix":string,"exampleFix":string,"bestPractices":string[],"documentation":[{"title":string,"url":string,"type":"official"|"tutorial"|"best-practice"|"example"}]}`,
        userPrompt: `Format: ${format}\nLine: ${issue.line || 'unknown'}\nSeverity: ${issue.severity || 'error'}\nError: ${issue.message}\nRule: ${issue.rule || 'N/A'}\n\nContent:\n${content.slice(0, 6000)}`,
        jsonMode: true,
      },
      { userId, operation: 'explain_error' },
      model,
    );
    try {
      return JSON.parse(response.content);
    } catch {
      return {
        whatHappened: issue.message,
        whyItHappened: 'Configuration does not meet validation requirements.',
        howToFix: issue.message,
        bestPractices: [],
        documentation: [],
      };
    }
  }

  async planReview(planOutput: string, userId?: string, model?: string): Promise<string> {
    const response = await this.complete(
      {
        systemPrompt: 'Review Terraform plan output. Identify risks, destroy operations, cost implications, security concerns. Provide structured analysis.',
        userPrompt: planOutput,
      },
      { userId, operation: 'plan_review' },
      model,
    );
    return response.content;
  }

  async reviewPullRequest(
    prTitle: string,
    prBody: string,
    files: Array<{ filename: string; patch?: string; status: string }>,
    userId?: string,
    model?: string,
  ): Promise<{ analysis: string; riskScore: number; recommendation: 'approve' | 'request_changes' | 'comment'; findings: Array<{ severity: string; title: string; description: string }> }> {
    const fileSummary = files.map((f) => `${f.status}: ${f.filename}\n${(f.patch || '').slice(0, 2000)}`).join('\n---\n');
    const response = await this.complete(
      {
        systemPrompt: `You are a senior DevOps reviewer for IaC pull requests. Return JSON: {"analysis":"markdown review","riskScore":0-100,"recommendation":"approve"|"request_changes"|"comment","findings":[{"severity":"critical"|"high"|"medium"|"low","title":string,"description":string}]}`,
        userPrompt: `Title: ${prTitle}\nBody: ${prBody}\n\nFiles:\n${fileSummary.slice(0, 12000)}`,
        jsonMode: true,
      },
      { userId, operation: 'pr_review' },
      model,
    );
    try {
      return JSON.parse(response.content);
    } catch {
      return { analysis: response.content, riskScore: 50, recommendation: 'comment', findings: [] };
    }
  }

  async resolveMergeConflicts(
    conflictContent: string,
    fileName: string,
    userId?: string,
    model?: string,
  ): Promise<{ conflicts: Array<{ file: string; resolution: string; explanation: string }>; mergedContent: string }> {
    const response = await this.complete(
      {
        systemPrompt: `Resolve Git merge conflicts in IaC files. Remove conflict markers (<<<<<<<, =======, >>>>>>>). Return JSON: {"conflicts":[{"file":string,"resolution":string,"explanation":string}],"mergedContent":"full resolved file content"}`,
        userPrompt: `File: ${fileName}\n\n${conflictContent.slice(0, 12000)}`,
        jsonMode: true,
      },
      { userId, operation: 'resolve_conflicts' },
      model,
    );
    try {
      return JSON.parse(response.content);
    } catch {
      return { conflicts: [{ file: fileName, resolution: 'manual', explanation: 'Could not auto-resolve' }], mergedContent: conflictContent };
    }
  }

  async generateInfrastructureDiagram(
    content: string,
    format: string,
    userId?: string,
    model?: string,
  ): Promise<{ mermaid: string; resourceCount: number }> {
    const response = await this.complete(
      {
        systemPrompt: `Generate a Mermaid infrastructure diagram from ${format} configuration. Use graph TD or flowchart. Include providers, resources, dependencies. Return JSON: {"mermaid":"valid mermaid syntax","resourceCount":number}`,
        userPrompt: content.slice(0, 10000),
        jsonMode: true,
      },
      { userId, operation: 'generate_diagram' },
      model,
    );
    try {
      return JSON.parse(response.content);
    } catch {
      return { mermaid: 'graph TD\n  A[Infrastructure]\n  B[Resources]', resourceCount: 1 };
    }
  }

  async generateIssueFromError(
    issue: { message: string; line?: number; severity?: string; rule?: string },
    content: string,
    format: string,
    userId?: string,
    model?: string,
  ): Promise<{ title: string; body: string; labels: string[] }> {
    const response = await this.complete(
      {
        systemPrompt: 'Generate a GitHub issue from an IaC validation error. Return JSON: {"title":string,"body":"markdown body with steps to reproduce and fix","labels":["iac","bug" or "enhancement"]}',
        userPrompt: `Format: ${format}\nError: ${issue.message}\nLine: ${issue.line || 'N/A'}\nSeverity: ${issue.severity || 'error'}\nRule: ${issue.rule || 'N/A'}\n\nContent snippet:\n${content.slice(0, 4000)}`,
        jsonMode: true,
      },
      { userId, operation: 'create_issue' },
      model,
    );
    try {
      return JSON.parse(response.content);
    } catch {
      return { title: `[${format}] ${issue.message.slice(0, 80)}`, body: issue.message, labels: ['iac'] };
    }
  }
}
