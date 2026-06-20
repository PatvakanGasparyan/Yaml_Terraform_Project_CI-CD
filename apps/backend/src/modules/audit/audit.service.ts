import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { AuditLogEntry } from '@iac-platform/shared';
import { AuditLog } from '../../entities';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'upload'
  | 'validation'
  | 'fix'
  | 'translation'
  | 'conversion'
  | 'ai_request'
  | 'github_commit'
  | 'github_push'
  | 'github_rollback'
  | 'github_pr'
  | 'terraform_plan'
  | 'terraform_apply'
  | 'backup'
  | 'restore'
  | 'download'
  | 'error'
  | 'workflow';

export interface AuditEntry {
  userId?: string;
  action: AuditAction | string;
  module?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  beforeValue?: string;
  afterValue?: string;
  status?: 'success' | 'failed' | 'pending';
  durationMs?: number;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.auditRepo.save({
      id: uuidv4(),
      userId: entry.userId,
      action: entry.action,
      module: entry.module,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      beforeValue: entry.beforeValue?.slice(0, 65000),
      afterValue: entry.afterValue?.slice(0, 65000),
      status: entry.status || 'success',
      durationMs: entry.durationMs || 0,
    });
  }

  async search(opts: {
    userId?: string;
    action?: string;
    module?: string;
    search?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const page = opts.page || 1;
    const pageSize = opts.pageSize || 50;
    const where: FindOptionsWhere<AuditLog> = {};
    if (opts.userId) where.userId = opts.userId;
    if (opts.action) where.action = opts.action;
    if (opts.module) where.module = opts.module;
    if (opts.from && opts.to) where.createdAt = Between(opts.from, opts.to);

    const qb = this.auditRepo.createQueryBuilder('a').orderBy('a.created_at', 'DESC');
    if (opts.userId) qb.andWhere('a.user_id = :userId', { userId: opts.userId });
    if (opts.action) qb.andWhere('a.action = :action', { action: opts.action });
    if (opts.module) qb.andWhere('a.module = :module', { module: opts.module });
    if (opts.from) qb.andWhere('a.created_at >= :from', { from: opts.from });
    if (opts.to) qb.andWhere('a.created_at <= :to', { to: opts.to });
    if (opts.search) {
      qb.andWhere('(a.action LIKE :s OR a.resource_type LIKE :s OR a.details LIKE :s)', { s: `%${opts.search}%` });
    }

    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return {
      items: items.map((a) => this.toEntry(a)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  exportCsv(userId: string, from?: Date, to?: Date): string {
    return '';
  }

  async exportCsvAsync(userId: string, from?: Date, to?: Date): Promise<string> {
    const { items } = await this.search({ userId, from, to, pageSize: 10000 });
    const header = 'id,userId,action,module,status,resourceType,resourceId,durationMs,ipAddress,createdAt\n';
    const rows = items.map((a) =>
      [a.id, a.userId, a.action, a.module, a.status, a.resourceType, a.resourceId, a.durationMs, a.ipAddress, a.createdAt]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','),
    ).join('\n');
    return header + rows;
  }

  async exportHtml(userId: string, from?: Date, to?: Date): Promise<string> {
    const { items } = await this.search({ userId, from, to, pageSize: 1000 });
    const rows = items.map((a) =>
      `<tr><td>${a.createdAt}</td><td>${a.action}</td><td>${a.module || ''}</td><td>${a.status}</td><td>${a.resourceType || ''}</td><td>${a.durationMs}ms</td></tr>`,
    ).join('');
    return `<!DOCTYPE html><html><head><title>Audit Report</title><style>table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px}</style></head><body><h1>Audit Log Report</h1><table><tr><th>Time</th><th>Action</th><th>Module</th><th>Status</th><th>Resource</th><th>Duration</th></tr>${rows}</table></body></html>`;
  }

  private toEntry(a: AuditLog): AuditLogEntry {
    return {
      id: a.id,
      userId: a.userId,
      action: a.action,
      module: a.module,
      resourceType: a.resourceType,
      resourceId: a.resourceId,
      status: a.status,
      beforeValue: a.beforeValue,
      afterValue: a.afterValue,
      durationMs: a.durationMs,
      ipAddress: a.ipAddress,
      details: a.details,
      createdAt: a.createdAt.toISOString(),
    };
  }
}
