import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';
import type { FileFormat, FixResult, ValidationResult } from '@iac-platform/shared';
import { detectFormat } from '@iac-platform/shared';
import { ValidationHistory, FixHistory } from '../../entities';
import { OfflineValidationService } from './offline-validation.service';
import { AiService } from '../ai/ai.service';
import { AuditService } from '../audit/audit.service';
import { VersionsService } from '../versions/versions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ValidationService {
  constructor(
    private readonly offlineValidator: OfflineValidationService,
    private readonly aiService: AiService,
    @InjectRepository(ValidationHistory) private readonly validationRepo: Repository<ValidationHistory>,
    @InjectRepository(FixHistory) private readonly fixRepo: Repository<FixHistory>,
    private readonly auditService: AuditService,
    private readonly versions: VersionsService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async validate(
    content: string,
    fileName?: string,
    format?: FileFormat,
    useAi = false,
    userId?: string,
  ): Promise<ValidationResult> {
    const offlineResult = this.offlineValidator.validate(content, format, fileName);

    if (useAi && userId) {
      try {
        const aiIssues = await this.aiService.validateWithAI(
          content,
          offlineResult.format,
          userId,
        );
        const existingLines = new Set(offlineResult.issues.map((i) => `${i.line}-${i.message}`));
        for (const issue of aiIssues) {
          if (!existingLines.has(`${issue.line}-${issue.message}`)) {
            offlineResult.issues.push(issue);
          }
        }
        offlineResult.valid = offlineResult.issues.filter(
          (i) => ['critical', 'high'].includes(i.severity),
        ).length === 0;
      } catch {
        // AI unavailable, use offline only
      }
    }

    if (userId) {
      await this.validationRepo.save({
        id: uuidv4(),
        userId,
        fileName,
        format: offlineResult.format,
        isValid: offlineResult.valid,
        issuesCount: offlineResult.issues.length,
        issuesJson: offlineResult.issues,
        score: offlineResult.score,
        durationMs: offlineResult.durationMs,
      });
      await this.auditService.log({
        userId,
        action: 'validation',
        module: 'validation',
        resourceType: 'file',
        details: { fileName, format: offlineResult.format, valid: offlineResult.valid, issuesCount: offlineResult.issues.length, durationMs: offlineResult.durationMs },
        durationMs: offlineResult.durationMs,
      });
      if (userId) {
        await this.notifications.create(userId, 'validation_complete', 'Validation Complete', `${fileName || 'File'}: ${offlineResult.valid ? 'Valid' : `${offlineResult.issues.length} issues`}`, { score: offlineResult.score });
        this.activity.publish(userId, 'validated file', { resourceType: 'file', resourceName: fileName });
      }
    }

    return offlineResult;
  }

  async fixEverything(
    content: string,
    fileName?: string,
    format?: FileFormat,
    userId?: string,
  ): Promise<FixResult> {
    const detectedFormat = format || detectFormat(fileName || '', content);

    if (userId) {
      await this.versions.createSnapshot({
        userId,
        content,
        action: 'pre_fix',
        fileName,
        format: detectedFormat,
        label: 'Auto-backup before fix',
      });
    }

    const validation = await this.validate(content, fileName, detectedFormat, true, userId);

    let fixed = content;
    try {
      fixed = await this.aiService.fixContent(content, detectedFormat, validation.issues, userId);
    } catch {
      fixed = this.applyBasicFixes(content, detectedFormat, validation.issues);
    }

    const diffResult = diff.createPatch(fileName || 'file', content, fixed);
    const changes = (diffResult.match(/^\+[^+]/gm) || []).length +
      (diffResult.match(/^-[^-]/gm) || []).length;

    if (userId) {
      await this.fixRepo.save({
        id: uuidv4(),
        userId,
        fileName,
        format: detectedFormat,
        originalContent: content,
        fixedContent: fixed,
        diffContent: diffResult,
        changesCount: changes,
      });
      await this.auditService.log({
        userId,
        action: 'fix',
        module: 'validation',
        resourceType: 'file',
        beforeValue: content.slice(0, 5000),
        afterValue: fixed.slice(0, 5000),
        details: { fileName, format: detectedFormat, changesCount: changes },
      });
      await this.notifications.create(userId, 'fix_complete', 'Fix Complete', `${changes} changes applied to ${fileName || 'file'}`, { fileName });
      this.activity.publish(userId, 'fixed file', { resourceType: 'file', resourceName: fileName });
    }

    return {
      original: content,
      fixed,
      diff: diffResult,
      changes,
      issues: validation.issues,
    };
  }

  private applyBasicFixes(content: string, format: FileFormat, issues: ValidationResult['issues']): string {
    let fixed = content;

    if (['yaml', 'kubernetes', 'docker-compose'].includes(format)) {
      fixed = fixed.split('\n').map((line) => line.replace(/\t/g, '  ').trimEnd()).join('\n');
    }

    if (format === 'json') {
      try {
        fixed = JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        // keep original
      }
    }

    return fixed;
  }
}
