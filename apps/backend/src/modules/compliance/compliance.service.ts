import { Injectable } from '@nestjs/common';
import type { FileFormat, RiskScores, SecurityFinding } from '@iac-platform/shared';
import { COMPLIANCE_FRAMEWORKS, SECRET_PATTERNS } from '@iac-platform/shared';
import { AiService } from '../ai/ai.service';
import { OfflineValidationService } from '../validation/offline-validation.service';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly aiService: AiService,
    private readonly validator: OfflineValidationService,
  ) {}

  async scan(content: string, format: FileFormat, frameworks: string[] = ['CIS', 'NIST'], userId?: string) {
    const offlineFindings = this.runOfflineChecks(content);
    let aiFindings: SecurityFinding[] = [];

    try {
      const audit = await this.aiService.securityAudit(content, format, userId);
      aiFindings = audit.findings;
    } catch {
      // AI unavailable
    }

    const complianceResults = frameworks.map((fw) => ({
      framework: fw,
      findings: this.checkFramework(content, format, fw),
    }));

    return {
      findings: [...offlineFindings, ...aiFindings],
      compliance: complianceResults,
      riskScores: this.calculateRiskScores([...offlineFindings, ...aiFindings]),
      frameworks: COMPLIANCE_FRAMEWORKS,
    };
  }

  checkPolicy(content: string, policyType: 'opa' | 'sentinel', policy: string) {
    if (policyType === 'opa') {
      return this.evaluateOpaPolicy(content, policy);
    }
    return this.evaluateSentinelPolicy(content, policy);
  }

  private runOfflineChecks(content: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    for (const pattern of SECRET_PATTERNS) {
      lines.forEach((line, idx) => {
        if (pattern.pattern.test(line)) {
          findings.push({
            id: `secret-${idx}-${pattern.name}`,
            severity: pattern.severity,
            title: pattern.name,
            description: `Potential ${pattern.name} found on line ${idx + 1}`,
            line: idx + 1,
            remediation: 'Remove hardcoded secrets and use a secrets manager',
            category: 'secrets',
            compliance: ['CIS', 'NIST', 'SOC2'],
          });
        }
        pattern.pattern.lastIndex = 0;
      });
    }

    const dangerousPatterns = [
      { pattern: /0\.0\.0\.0\/0/g, title: 'Open CIDR block', severity: 'high' as const },
      { pattern: /Effect\s*=\s*"Allow".*"\*"/gs, title: 'Overly permissive IAM', severity: 'critical' as const },
      { pattern: /privileged:\s*true/g, title: 'Privileged container', severity: 'high' as const },
      { pattern: /hostNetwork:\s*true/g, title: 'Host network enabled', severity: 'high' as const },
      { pattern: /runAsUser:\s*0/g, title: 'Running as root', severity: 'medium' as const },
    ];

    for (const dp of dangerousPatterns) {
      lines.forEach((line, idx) => {
        if (dp.pattern.test(line)) {
          findings.push({
            id: `danger-${idx}-${dp.title}`,
            severity: dp.severity,
            title: dp.title,
            description: `Security concern on line ${idx + 1}`,
            line: idx + 1,
            category: 'configuration',
            compliance: ['CIS', 'NIST'],
          });
        }
        dp.pattern.lastIndex = 0;
      });
    }

    return findings;
  }

  private checkFramework(content: string, format: FileFormat, framework: string) {
    const checks: Array<{ rule: string; passed: boolean; description: string }> = [];

    switch (framework) {
      case 'CIS':
        checks.push(
          { rule: 'CIS-1.1', passed: !content.includes('password ='), description: 'No hardcoded passwords' },
          { rule: 'CIS-1.2', passed: !content.includes('0.0.0.0/0'), description: 'No open CIDR blocks' },
          { rule: 'CIS-2.1', passed: !content.includes('privileged: true'), description: 'No privileged containers' },
        );
        break;
      case 'NIST':
        checks.push(
          { rule: 'NIST-AC-2', passed: !/AKIA[0-9A-Z]{16}/.test(content), description: 'No exposed AWS keys' },
          { rule: 'NIST-SC-7', passed: !content.includes('0.0.0.0/0'), description: 'Network boundary protection' },
        );
        break;
      case 'SOC2':
        checks.push(
          { rule: 'SOC2-CC6', passed: !content.includes('password ='), description: 'Logical access controls' },
        );
        break;
      case 'ISO27001':
        checks.push(
          { rule: 'ISO-A.9', passed: !/ghp_/.test(content), description: 'Access control policy' },
        );
        break;
    }

    return checks;
  }

  private calculateRiskScores(findings: SecurityFinding[]): RiskScores {
    const severityWeight = { critical: 25, high: 15, medium: 8, low: 3, info: 1 };
    const securityPenalty = findings.reduce((sum, f) => sum + (severityWeight[f.severity] || 0), 0);
    const security = Math.max(0, 100 - securityPenalty);

    return {
      security,
      reliability: Math.max(0, 100 - findings.filter((f) => f.category === 'configuration').length * 5),
      cost: 75,
      maintainability: Math.max(0, 100 - findings.length * 2),
      overall: Math.round((security + 75 + 75) / 3),
    };
  }

  private evaluateOpaPolicy(content: string, policy: string) {
    const violations: string[] = [];
    if (policy.includes('deny') && content.includes('0.0.0.0/0')) {
      violations.push('Policy violation: open CIDR block detected');
    }
    return { allowed: violations.length === 0, violations, engine: 'opa' };
  }

  private evaluateSentinelPolicy(content: string, policy: string) {
    const violations: string[] = [];
    if (policy.includes('mandatory') && !content.includes('tags')) {
      violations.push('Policy violation: missing required tags');
    }
    return { allowed: violations.length === 0, violations, engine: 'sentinel' };
  }
}
