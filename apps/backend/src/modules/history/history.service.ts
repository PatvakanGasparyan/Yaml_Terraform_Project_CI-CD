import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import type { HistoryEntry } from '@iac-platform/shared';
import {
  ValidationHistory,
  FixHistory,
  Translation,
  File,
  GithubAction,
  ApiUsage,
} from '../../entities';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ValidationHistory) private readonly validationRepo: Repository<ValidationHistory>,
    @InjectRepository(FixHistory) private readonly fixRepo: Repository<FixHistory>,
    @InjectRepository(Translation) private readonly translationRepo: Repository<Translation>,
    @InjectRepository(File) private readonly fileRepo: Repository<File>,
    @InjectRepository(GithubAction) private readonly githubRepo: Repository<GithubAction>,
    @InjectRepository(ApiUsage) private readonly apiUsageRepo: Repository<ApiUsage>,
  ) {}

  async getHistory(
    userId: string,
    filter?: 'today' | 'week' | 'month' | 'custom',
    from?: Date,
    to?: Date,
  ): Promise<HistoryEntry[]> {
    const startDate = this.getStartDate(filter, from);
    const endDate = to || new Date();
    const dateWhere = startDate ? { createdAt: Between(startDate, endDate) } : {};

    const [validations, fixes, translations, files, github, ai] = await Promise.all([
      this.validationRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
      this.fixRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
      this.translationRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
      this.fileRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
      this.githubRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
      this.apiUsageRepo.find({ where: { userId, ...dateWhere }, order: { createdAt: 'DESC' }, take: 100 }),
    ]);

    const entries: HistoryEntry[] = [
      ...validations.map((v) => ({
        id: v.id,
        type: 'validation' as const,
        fileName: v.fileName,
        format: v.format as HistoryEntry['format'],
        metadata: { isValid: v.isValid, issuesCount: v.issuesCount },
        createdAt: v.createdAt.toISOString(),
      })),
      ...fixes.map((f) => ({
        id: f.id,
        type: 'fix' as const,
        fileName: f.fileName,
        format: f.format as HistoryEntry['format'],
        metadata: { changesCount: f.changesCount },
        createdAt: f.createdAt.toISOString(),
      })),
      ...translations.map((t) => ({
        id: t.id,
        type: 'translation' as const,
        metadata: { from: t.sourceLanguage, to: t.targetLanguage },
        createdAt: t.createdAt.toISOString(),
      })),
      ...files.map((f) => ({
        id: f.id,
        type: 'upload' as const,
        fileName: f.name,
        format: f.format as HistoryEntry['format'],
        createdAt: f.createdAt.toISOString(),
      })),
      ...github.map((g) => ({
        id: g.id,
        type: 'github_push' as const,
        metadata: { action: g.actionType, repository: g.repository },
        createdAt: g.createdAt.toISOString(),
      })),
      ...ai.map((a) => ({
        id: a.id,
        type: 'ai_request' as const,
        metadata: { operation: a.operation, provider: a.provider },
        createdAt: a.createdAt.toISOString(),
      })),
    ];

    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private getStartDate(filter?: string, customFrom?: Date): Date | undefined {
    if (customFrom) return customFrom;
    const now = new Date();
    switch (filter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  }
}
