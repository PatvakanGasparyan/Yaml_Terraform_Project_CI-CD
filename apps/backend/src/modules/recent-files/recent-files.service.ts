import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RecentFile } from '../../entities';

@Injectable()
export class RecentFilesService {
  constructor(@InjectRepository(RecentFile) private readonly repo: Repository<RecentFile>) {}

  async track(userId: string, fileName: string, format: string, opts?: { fileId?: string; projectId?: string; lastAction?: string }) {
    const existing = await this.repo.findOne({ where: { userId, fileName } });
    if (existing) {
      existing.openedAt = new Date();
      existing.format = format;
      existing.lastAction = opts?.lastAction || existing.lastAction;
      existing.fileId = opts?.fileId || existing.fileId;
      await this.repo.save(existing);
      return this.toInfo(existing);
    }
    const f = await this.repo.save({
      id: uuidv4(),
      userId,
      fileName,
      format,
      fileId: opts?.fileId,
      projectId: opts?.projectId,
      lastAction: opts?.lastAction,
      openedAt: new Date(),
    });
    return this.toInfo(f);
  }

  async list(userId: string, limit = 20) {
    const items = await this.repo.find({ where: { userId }, order: { openedAt: 'DESC' }, take: limit });
    return items.map((f) => this.toInfo(f));
  }

  private toInfo(f: RecentFile) {
    return {
      id: f.id,
      fileId: f.fileId,
      fileName: f.fileName,
      format: f.format,
      projectId: f.projectId,
      lastAction: f.lastAction,
      openedAt: f.openedAt.toISOString(),
    };
  }
}
