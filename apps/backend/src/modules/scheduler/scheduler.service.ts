import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import type { ScheduledJobInfo } from '@iac-platform/shared';
import { ScheduledJob } from '../../entities';
import { OfflineValidationService } from '../validation/offline-validation.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ExternalNotificationsService } from '../external-notifications/external-notifications.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(ScheduledJob) private readonly jobRepo: Repository<ScheduledJob>,
    private readonly validator: OfflineValidationService,
    private readonly notifications: NotificationsService,
    private readonly externalNotifications: ExternalNotificationsService,
    private readonly activity: ActivityService,
  ) {}

  async listJobs(userId: string): Promise<ScheduledJobInfo[]> {
    const jobs = await this.jobRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return jobs.map((j) => this.toInfo(j));
  }

  async createJob(userId: string, data: { name: string; cronExpression: string; fileName?: string; content?: string; format?: string }) {
    const job = await this.jobRepo.save({
      id: uuidv4(),
      userId,
      name: data.name,
      cronExpression: data.cronExpression,
      fileName: data.fileName,
      content: data.content,
      format: data.format || 'yaml',
      enabled: true,
    });
    return this.toInfo(job);
  }

  async updateJob(userId: string, id: string, data: Partial<{ name: string; cronExpression: string; content: string; format: string; enabled: boolean }>) {
    const job = await this.jobRepo.findOne({ where: { id, userId } });
    if (!job) throw new NotFoundException('Job not found');
    Object.assign(job, data);
    await this.jobRepo.save(job);
    return this.toInfo(job);
  }

  async deleteJob(userId: string, id: string) {
    await this.jobRepo.delete({ id, userId });
    return { success: true };
  }

  async runJobNow(userId: string, id: string) {
    const job = await this.jobRepo.findOne({ where: { id, userId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.executeJob(job);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const jobs = await this.jobRepo.find({ where: { enabled: true } });
    const now = new Date();
    for (const job of jobs) {
      if (this.shouldRun(job, now)) {
        try {
          await this.executeJob(job);
        } catch (e) {
          this.logger.error(`Job ${job.id} failed: ${(e as Error).message}`);
        }
      }
    }
  }

  private shouldRun(job: ScheduledJob, now: Date): boolean {
    if (!job.cronExpression) return false;
    const parts = job.cronExpression.trim().split(/\s+/);
    if (parts.length < 5) return false;
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const match = (field: string, value: number) => field === '*' || field === String(value) || field === `*/1`;
    if (!match(minute, now.getMinutes())) return false;
    if (!match(hour, now.getHours())) return false;
    if (!match(dayOfMonth, now.getDate())) return false;
    if (!match(month, now.getMonth() + 1)) return false;
    if (dayOfWeek !== '*' && dayOfWeek !== String(now.getDay())) return false;
    if (job.lastRunAt && now.getTime() - job.lastRunAt.getTime() < 55000) return false;
    return true;
  }

  private async executeJob(job: ScheduledJob) {
    if (!job.content) {
      job.lastStatus = 'skipped';
      job.lastRunAt = new Date();
      await this.jobRepo.save(job);
      return { status: 'skipped', reason: 'No content' };
    }

    const result = this.validator.validate(job.content, job.format as 'yaml' | 'terraform', job.fileName);
    job.lastRunAt = new Date();
    job.lastStatus = result.valid ? 'passed' : 'failed';
    await this.jobRepo.save(job);

    const title = result.valid ? 'Validation Passed' : 'Validation Failed';
    const message = `Job "${job.name}": score ${result.score}/100, ${result.issues.length} issues`;
    await this.notifications.create(job.userId, 'scheduled_validation', title, message, { jobId: job.id, score: result.score });
    await this.externalNotifications.sendAll({ title, message, userId: job.userId });
    this.activity.publish(job.userId, 'ran scheduled validation', { resourceType: 'scheduler', resourceName: job.name, metadata: { score: result.score, valid: result.valid } });

    return { status: job.lastStatus, score: result.score, issueCount: result.issues.length };
  }

  private toInfo(job: ScheduledJob): ScheduledJobInfo {
    return {
      id: job.id,
      name: job.name,
      cronExpression: job.cronExpression,
      fileName: job.fileName,
      format: job.format,
      enabled: job.enabled,
      lastRunAt: job.lastRunAt?.toISOString(),
      lastStatus: job.lastStatus,
      createdAt: job.createdAt.toISOString(),
    };
  }
}
