import { Injectable } from '@nestjs/common';
import * as yaml from 'js-yaml';
import type { FileFormat, ValidationIssue, ValidationResult, Severity } from '@iac-platform/shared';
import { SECRET_PATTERNS } from '@iac-platform/shared';
import { detectFormat } from '@iac-platform/shared';

@Injectable()
export class OfflineValidationService {
  validate(content: string, format?: FileFormat, fileName?: string): ValidationResult {
    const start = Date.now();
    const detectedFormat = format || detectFormat(fileName || '', content);
    const issues: ValidationIssue[] = [];

    switch (detectedFormat) {
      case 'yaml':
      case 'kubernetes':
      case 'docker-compose':
      case 'helm':
      case 'ansible':
      case 'github-actions':
      case 'gitlab-ci':
      case 'cloudformation':
      case 'openapi':
      case 'crd':
        issues.push(...this.validateYaml(content));
        break;
      case 'json':
        issues.push(...this.validateJson(content));
        break;
      case 'terraform':
      case 'tfvars':
      case 'hcl':
        issues.push(...this.validateTerraform(content));
        break;
      case 'xml':
        issues.push(...this.validateXml(content));
        break;
      case 'toml':
        issues.push(...this.validateToml(content));
        break;
      case 'ini':
      case 'properties':
      case 'env':
        issues.push(...this.validateIni(content));
        break;
      case 'csv':
        issues.push(...this.validateCsv(content));
        break;
      default:
        issues.push(...this.validateGeneric(content));
    }

    issues.push(...this.detectSecrets(content));

    if (detectedFormat === 'kubernetes') {
      issues.push(...this.validateKubernetes(content));
    }

    const score = Math.max(0, 100 - issues.reduce((sum, i) => {
      const weights: Record<Severity, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 1 };
      return sum + (weights[i.severity] || 0);
    }, 0));

    return {
      valid: issues.filter((i) => ['critical', 'high'].includes(i.severity)).length === 0,
      format: detectedFormat,
      issues,
      score,
      durationMs: Date.now() - start,
    };
  }

  private validateYaml(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    try {
      yaml.loadAll(content, undefined, { json: true });
    } catch (error) {
      const err = error as yaml.YAMLException;
      issues.push({
        line: (err.mark?.line ?? 0) + 1,
        column: (err.mark?.column ?? 0) + 1,
        severity: 'critical',
        message: err.message,
        category: 'syntax',
        rule: 'yaml-syntax',
      });
    }

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('\t')) {
        issues.push({
          line: idx + 1,
          severity: 'medium',
          message: 'Tabs are not allowed in YAML; use spaces for indentation',
          category: 'formatting',
          rule: 'yaml-no-tabs',
        });
      }
      const trimmed = line.trimEnd();
      if (trimmed.length > 0 && trimmed.endsWith(' ') && !trimmed.startsWith('#')) {
        issues.push({
          line: idx + 1,
          severity: 'low',
          message: 'Trailing whitespace detected',
          category: 'formatting',
          rule: 'yaml-trailing-whitespace',
        });
      }
    });

    return issues;
  }

  private validateJson(content: string): ValidationIssue[] {
    try {
      JSON.parse(content);
      return [];
    } catch (error) {
      const err = error as SyntaxError;
      const match = err.message.match(/position (\d+)/);
      let line = 1;
      if (match) {
        const pos = parseInt(match[1], 10);
        line = content.substring(0, pos).split('\n').length;
      }
      return [{
        line,
        severity: 'critical',
        message: err.message,
        category: 'syntax',
        rule: 'json-syntax',
      }];
    }
  }

  private validateTerraform(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');
    let braceDepth = 0;
    let inBlock = false;
    const resources = new Map<string, number>();

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      if (trimmed.startsWith('#') || trimmed === '') return;

      braceDepth += (line.match(/{/g) || []).length;
      braceDepth -= (line.match(/}/g) || []).length;

      const resourceMatch = trimmed.match(/^(resource|data|module|provider|variable|output)\s+"([^"]+)"\s+"([^"]+)"/);
      if (resourceMatch) {
        const key = `${resourceMatch[1]}.${resourceMatch[2]}.${resourceMatch[3]}`;
        if (resources.has(key)) {
          issues.push({
            line: lineNum,
            severity: 'high',
            message: `Duplicate ${resourceMatch[1]} "${resourceMatch[2]}.${resourceMatch[3]}" (also at line ${resources.get(key)})`,
            category: 'structure',
            rule: 'tf-duplicate-resource',
          });
        }
        resources.set(key, lineNum);
        inBlock = true;
      }

      if (trimmed.includes('password') && trimmed.includes('=') && !trimmed.includes('var.')) {
        issues.push({
          line: lineNum,
          severity: 'high',
          message: 'Hardcoded password detected; use variables or secrets manager',
          category: 'security',
          rule: 'tf-hardcoded-password',
        });
      }

      if (trimmed.match(/0\.0\.0\.0\/0/) && trimmed.includes('cidr')) {
        issues.push({
          line: lineNum,
          severity: 'medium',
          message: 'Overly permissive CIDR block (0.0.0.0/0)',
          category: 'security',
          rule: 'tf-open-cidr',
        });
      }
    });

    if (braceDepth !== 0) {
      issues.push({
        severity: 'critical',
        message: `Unbalanced braces: ${braceDepth > 0 ? 'missing closing' : 'extra closing'} brace(s)`,
        category: 'syntax',
        rule: 'tf-brace-balance',
      });
    }

    return issues;
  }

  private validateXml(content: string): ValidationIssue[] {
    if (!content.trim().startsWith('<?xml') && !content.trim().startsWith('<')) {
      return [{ severity: 'critical', message: 'Invalid XML: must start with < or <?xml', category: 'syntax', rule: 'xml-syntax' }];
    }
    const openTags = (content.match(/<[^/!?][^>]*[^/]>/g) || []).length;
    const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
    if (openTags !== closeTags) {
      return [{ severity: 'high', message: 'Potentially unbalanced XML tags', category: 'syntax', rule: 'xml-balance' }];
    }
    return [];
  }

  private validateToml(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    try {
      require('@iarna/toml').parse(content);
    } catch (error) {
      issues.push({
        severity: 'critical',
        message: (error as Error).message,
        category: 'syntax',
        rule: 'toml-syntax',
      });
    }
    return issues;
  }

  private validateIni(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('[') && !trimmed.includes('=')) {
        issues.push({
          line: idx + 1,
          severity: 'medium',
          message: 'INI line missing key=value format',
          category: 'syntax',
          rule: 'ini-format',
        });
      }
    });
    return issues;
  }

  private validateCsv(content: string): ValidationIssue[] {
    const lines = content.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return [];
    const headerCols = lines[0].split(',').length;
    const issues: ValidationIssue[] = [];
    lines.slice(1).forEach((line, idx) => {
      if (line.split(',').length !== headerCols) {
        issues.push({
          line: idx + 2,
          severity: 'medium',
          message: `Column count mismatch (expected ${headerCols})`,
          category: 'structure',
          rule: 'csv-columns',
        });
      }
    });
    return issues;
  }

  private validateGeneric(content: string): ValidationIssue[] {
    if (!content.trim()) {
      return [{ severity: 'info', message: 'File is empty', category: 'content', rule: 'empty-file' }];
    }
    return [];
  }

  private validateKubernetes(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    try {
      const docs = yaml.loadAll(content) as Array<Record<string, unknown>>;
      docs.forEach((doc, docIdx) => {
        if (!doc || typeof doc !== 'object') return;
        if (!doc.apiVersion) {
          issues.push({
            severity: 'high',
            message: `Document ${docIdx + 1}: missing apiVersion`,
            category: 'kubernetes',
            rule: 'k8s-api-version',
          });
        }
        if (!doc.kind) {
          issues.push({
            severity: 'high',
            message: `Document ${docIdx + 1}: missing kind`,
            category: 'kubernetes',
            rule: 'k8s-kind',
          });
        }
        const metadata = doc.metadata as Record<string, unknown> | undefined;
        if (!metadata?.name) {
          issues.push({
            severity: 'medium',
            message: `Document ${docIdx + 1}: missing metadata.name`,
            category: 'kubernetes',
            rule: 'k8s-metadata-name',
          });
        }
        if (doc.kind === 'Pod' || doc.kind === 'Deployment') {
          const spec = doc.spec as Record<string, unknown> | undefined;
          const containers = (spec?.containers || spec?.template as Record<string, unknown>) as unknown;
          if (!containers) {
            issues.push({
              severity: 'medium',
              message: `${doc.kind}: missing container specification`,
              category: 'kubernetes',
              rule: 'k8s-containers',
            });
          }
        }
        if (doc.kind === 'Deployment' && !((doc.spec as Record<string, unknown>)?.selector)) {
          issues.push({
            severity: 'medium',
            message: 'Deployment: missing selector',
            category: 'kubernetes',
            rule: 'k8s-deployment-selector',
          });
        }
      });
    } catch {
      // YAML errors already caught
    }
    return issues;
  }

  private detectSecrets(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const lines = content.split('\n');

    for (const pattern of SECRET_PATTERNS) {
      lines.forEach((line, idx) => {
        if (pattern.pattern.test(line)) {
          issues.push({
            line: idx + 1,
            severity: pattern.severity,
            message: `Potential ${pattern.name} detected`,
            category: 'security',
            rule: 'secret-detection',
            suggestion: 'Use environment variables, secrets manager, or vault',
          });
        }
        pattern.pattern.lastIndex = 0;
      });
    }

    return issues;
  }
}
