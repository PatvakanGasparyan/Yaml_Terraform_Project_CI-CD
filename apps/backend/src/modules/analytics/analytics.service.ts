import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import type { AnalyticsSummary } from '@iac-platform/shared';
import {
  ValidationHistory,
  FixHistory,
  Translation,
  ApiUsage,
  File,
} from '../../entities';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ValidationHistory) private readonly validationRepo: Repository<ValidationHistory>,
    @InjectRepository(FixHistory) private readonly fixRepo: Repository<FixHistory>,
    @InjectRepository(Translation) private readonly translationRepo: Repository<Translation>,
    @InjectRepository(ApiUsage) private readonly apiUsageRepo: Repository<ApiUsage>,
    @InjectRepository(File) private readonly fileRepo: Repository<File>,
  ) {}

  async getSummary(userId: string, from?: Date, to?: Date): Promise<AnalyticsSummary> {
    const dateFilter = this.buildDateFilter(from, to);

    const [validations, fixes, uploads, translations, aiRequests] = await Promise.all([
      this.validationRepo.count({ where: { userId, ...dateFilter } }),
      this.fixRepo.count({ where: { userId, ...dateFilter } }),
      this.fileRepo.count({ where: { userId, ...dateFilter } }),
      this.translationRepo.count({ where: { userId, ...dateFilter } }),
      this.apiUsageRepo.count({ where: { userId, ...dateFilter } }),
    ]);

    const validationRecords = await this.validationRepo.find({
      where: { userId, ...dateFilter },
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    const errorCounts = new Map<string, number>();
    const formatCounts = new Map<string, number>();

    for (const record of validationRecords) {
      formatCounts.set(record.format, (formatCounts.get(record.format) || 0) + 1);
      if (record.issuesJson && Array.isArray(record.issuesJson)) {
        for (const issue of record.issuesJson as Array<{ message: string }>) {
          errorCounts.set(issue.message, (errorCounts.get(issue.message) || 0) + 1);
        }
      }
    }

    const activityChart = await this.buildActivityChart(userId, from, to);

    return {
      totalValidations: validations,
      totalFixes: fixes,
      totalUploads: uploads,
      totalTranslations: translations,
      totalAiRequests: aiRequests,
      commonErrors: Array.from(errorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([error, count]) => ({ error, count })),
      formatUsage: Array.from(formatCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([format, count]) => ({ format, count })),
      activityChart,
    };
  }

  private buildDateFilter(from?: Date, to?: Date) {
    if (from && to) return { createdAt: Between(from, to) };
    if (from) return { createdAt: MoreThanOrEqual(from) };
    return {};
  }

  private async buildActivityChart(userId: string, from?: Date, to?: Date) {
    const start = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to || new Date();
    const chart: Array<{ date: string; count: number }> = [];

    const records = await this.validationRepo.find({
      where: { userId, createdAt: Between(start, end) },
    });

    const dayCounts = new Map<string, number>();
    for (const r of records) {
      const day = r.createdAt.toISOString().split('T')[0];
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }

    for (const [date, count] of dayCounts) {
      chart.push({ date, count });
    }

    return chart.sort((a, b) => a.date.localeCompare(b.date));
  }
}
