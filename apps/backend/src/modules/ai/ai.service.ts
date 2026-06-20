import { Injectable } from '@nestjs/common';
import type {
  ExplainLevel,
  FileFormat,
  HoverExplainResult,
  OptimizationSuggestion,
  SecurityAuditResult,
  ValidationIssue,
} from '@iac-platform/shared';
import { OpenAIService } from '../../services/openai';
import { OPENAI_MODELS } from '../../services/openai/openai.types';

@Injectable()
export class AiService {
  constructor(private readonly openai: OpenAIService) {}

  isConfigured(): boolean {
    return this.openai.isConfigured();
  }

  getAvailableProviders() {
    return [{ name: 'openai' as const, configured: this.openai.isConfigured() }];
  }

  getModels() {
    return OPENAI_MODELS;
  }

  validateWithAI(content: string, format: FileFormat, userId?: string, model?: string) {
    return this.openai.validate(content, format, userId, model);
  }

  fixContent(content: string, format: FileFormat, issues: ValidationIssue[], userId?: string, model?: string) {
    return this.openai.fix(content, format, issues, userId, model);
  }

  explain(content: string, format: FileFormat, level: ExplainLevel, userId?: string, model?: string) {
    return this.openai.explain(content, format, level, userId, model);
  }

  optimize(content: string, format: FileFormat, userId?: string, model?: string): Promise<OptimizationSuggestion[]> {
    return this.openai.optimize(content, format, userId, model);
  }

  securityAudit(content: string, format: FileFormat, userId?: string, model?: string): Promise<SecurityAuditResult> {
    return this.openai.securityAudit(content, format, userId, model);
  }

  hoverExplain(content: string, format: FileFormat, line: number, lineContent: string, userId?: string, model?: string): Promise<HoverExplainResult> {
    return this.openai.hoverExplain(content, format, line, lineContent, userId, model);
  }

  translate(text: string, targetLanguage: string, context?: string, userId?: string, model?: string) {
    return this.openai.translate(text, targetLanguage, context, userId, model);
  }

  chat(messages: Array<{ role: string; content: string }>, fileContext?: string, userId?: string, model?: string) {
    return this.openai.chat(messages, fileContext, userId, model);
  }

  generateResource(prompt: string, format: FileFormat, userId?: string, model?: string) {
    return this.openai.generate(prompt, format, userId, model);
  }

  rootCauseAnalysis(content: string, error: string, format: FileFormat, userId?: string, model?: string) {
    return this.openai.rootCause(content, error, format, userId, model);
  }

  costAnalysis(content: string, format: FileFormat, userId?: string, model?: string) {
    return this.openai.costAnalysis(content, format, userId, model);
  }

  generateDocumentation(content: string, format: FileFormat, userId?: string, model?: string) {
    return this.openai.generateDocumentation(content, format, userId, model);
  }

  explainError(
    issue: { message: string; line?: number; severity?: string; rule?: string },
    content: string,
    format: FileFormat,
    userId?: string,
    model?: string,
  ) {
    return this.openai.explainError(issue, content, format, userId, model);
  }
}
