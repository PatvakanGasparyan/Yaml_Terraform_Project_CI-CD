import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';
import type { WorkflowResult } from '@iac-platform/shared';
import { ValidationService } from '../validation/validation.service';
import { GithubService } from '../github/github.service';
import { VersionsService } from '../versions/versions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';
import { AuditService } from '../audit/audit.service';
import { RecentFilesService } from '../recent-files/recent-files.service';

@Injectable()
export class WorkflowService {
  constructor(
    private readonly validation: ValidationService,
    private readonly github: GithubService,
    private readonly versions: VersionsService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
    private readonly audit: AuditService,
    private readonly recentFiles: RecentFilesService,
  ) {}

  async runFullWorkflow(
    userId: string,
    opts: {
      content: string;
      fileName: string;
      format: string;
      repo: string;
      path: string;
      branch: string;
      commitMessage?: string;
      originalContent?: string;
    },
  ): Promise<WorkflowResult> {
    const start = Date.now();
    const steps: WorkflowResult['steps'] = [];
    let backupId: string | undefined;
    let commitSha: string | undefined;
    let validationScore: number | undefined;

    try {
      const backup = await this.versions.createSnapshot({
        userId,
        content: opts.content,
        beforeContent: opts.originalContent || opts.content,
        action: 'workflow_start',
        fileName: opts.fileName,
        format: opts.format,
        label: 'Pre-workflow backup',
      });
      backupId = backup.id;
      steps.push({ step: 'backup', status: 'success', message: `Snapshot v${backup.version}` });

      const validation = await this.validation.validate(opts.content, opts.fileName, opts.format as never, true, userId);
      validationScore = validation.score;
      steps.push({ step: 'validate', status: validation.valid ? 'success' : 'success', message: `Score: ${validation.score}/100, ${validation.issues.length} issues` });

      const fixResult = await this.validation.fixEverything(opts.content, opts.fileName, opts.format as never, userId);
      steps.push({ step: 'fix', status: 'success', message: `${fixResult.changes} changes applied` });

      const revalidation = await this.validation.validate(fixResult.fixed, opts.fileName, opts.format as never, false, userId);
      validationScore = revalidation.score;
      steps.push({ step: 'revalidate', status: revalidation.valid ? 'success' : 'success', message: `Score: ${revalidation.score}/100` });

      let message = opts.commitMessage;
      if (!message) {
        const generated = await this.github.generateCommitMessage(userId, opts.content, fixResult.fixed, opts.fileName, opts.format, opts.repo);
        message = generated.message;
        steps.push({ step: 'commit_message', status: 'success', message });
      }

      const commit = await this.github.commitFile(userId, opts.repo, opts.path, fixResult.fixed, message!, opts.branch);
      commitSha = commit.commitSha;
      steps.push({ step: 'commit', status: 'success', message: commitSha });

      await this.recentFiles.track(userId, opts.fileName, opts.format, { lastAction: 'workflow' });
      await this.notifications.create(userId, 'workflow_complete', 'Workflow Complete', `Validated, fixed, and committed ${opts.fileName} to ${opts.repo}`, { commitSha, repo: opts.repo });
      this.activity.publish(userId, 'completed full workflow', { resourceType: 'github', resourceName: opts.repo, metadata: { fileName: opts.fileName, commitSha } });
      await this.audit.log({ userId, action: 'workflow', module: 'workflow', status: 'success', durationMs: Date.now() - start, details: { repo: opts.repo, commitSha, steps: steps.length } });

      return { success: true, steps, commitSha, backupId, validationScore };
    } catch (e) {
      steps.push({ step: 'error', status: 'failed', message: (e as Error).message });
      if (backupId) {
        const restored = await this.versions.restore(userId, backupId);
        if (restored) {
          steps.push({ step: 'auto_recovery', status: 'success', message: 'Restored from pre-workflow backup' });
          await this.notifications.create(userId, 'workflow_failed', 'Workflow Failed — Auto-Recovered', (e as Error).message, { backupId });
        }
      }
      await this.audit.log({ userId, action: 'workflow', module: 'workflow', status: 'failed', durationMs: Date.now() - start, details: { error: (e as Error).message } });
      return { success: false, steps, backupId, validationScore };
    }
  }
}
