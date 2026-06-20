import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as diff from 'diff';
import type { VersionSnapshotInfo } from '@iac-platform/shared';
import { VersionSnapshot } from '../../entities';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(VersionSnapshot) private readonly repo: Repository<VersionSnapshot>,
    private readonly audit: AuditService,
  ) {}

  async createSnapshot(opts: {
    userId: string;
    content: string;
    beforeContent?: string;
    action: string;
    fileId?: string;
    fileName?: string;
    format?: string;
    label?: string;
  }): Promise<VersionSnapshotInfo> {
    const count = await this.repo.count({ where: { userId: opts.userId, fileId: opts.fileId || undefined } });
    const snapshot = await this.repo.save({
      id: uuidv4(),
      userId: opts.userId,
      fileId: opts.fileId,
      fileName: opts.fileName,
      format: opts.format,
      version: count + 1,
      content: opts.content,
      beforeContent: opts.beforeContent,
      action: opts.action,
      label: opts.label || `Auto-backup before ${opts.action}`,
    });
    await this.audit.log({
      userId: opts.userId,
      action: 'upload',
      module: 'versions',
      resourceType: 'snapshot',
      resourceId: snapshot.id,
      beforeValue: opts.beforeContent?.slice(0, 5000),
      afterValue: opts.content.slice(0, 5000),
      details: { action: opts.action, fileName: opts.fileName },
    });
    return this.toInfo(snapshot);
  }

  async list(userId: string, fileId?: string) {
    const items = await this.repo.find({
      where: fileId ? { userId, fileId } : { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return items.map((s) => this.toInfo(s));
  }

  async get(userId: string, id: string) {
    const s = await this.repo.findOne({ where: { id, userId } });
    if (!s) return null;
    return { ...this.toInfo(s), content: s.content, beforeContent: s.beforeContent };
  }

  async compare(userId: string, id1: string, id2: string) {
    const [v1, v2] = await Promise.all([
      this.repo.findOne({ where: { id: id1, userId } }),
      this.repo.findOne({ where: { id: id2, userId } }),
    ]);
    if (!v1 || !v2) return null;
    const patch = diff.createPatch(v1.fileName || 'file', v1.content, v2.content);
    return { v1: this.toInfo(v1), v2: this.toInfo(v2), diff: patch };
  }

  async restore(userId: string, id: string) {
    const s = await this.repo.findOne({ where: { id, userId } });
    if (!s) return null;
    await this.audit.log({
      userId,
      action: 'fix',
      module: 'versions',
      resourceType: 'snapshot',
      resourceId: id,
      beforeValue: s.beforeContent?.slice(0, 5000),
      afterValue: s.content.slice(0, 5000),
      details: { restoredVersion: s.version, action: 'restore' },
    });
    return { content: s.content, version: s.version, fileName: s.fileName, format: s.format };
  }

  private toInfo(s: VersionSnapshot): VersionSnapshotInfo {
    return {
      id: s.id,
      version: s.version,
      fileName: s.fileName,
      format: s.format,
      action: s.action,
      label: s.label,
      createdAt: s.createdAt.toISOString(),
    };
  }
}
