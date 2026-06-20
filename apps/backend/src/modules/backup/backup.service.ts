import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Backup } from '../../entities';

@Injectable()
export class BackupService {
  constructor(@InjectRepository(Backup) private readonly backupRepo: Repository<Backup>) {}

  async createSnapshot(userId: string, fileId: string, content: string, version: number, label?: string) {
    return this.backupRepo.save({
      id: uuidv4(),
      userId,
      fileId,
      version,
      content,
      label: label || `Auto-backup v${version}`,
      isAuto: !label,
    });
  }

  async listBackups(fileId: string, userId: string) {
    return this.backupRepo.find({
      where: { fileId, userId },
      order: { createdAt: 'DESC' },
    });
  }

  async restore(backupId: string, userId: string) {
    const backup = await this.backupRepo.findOne({ where: { id: backupId, userId } });
    if (!backup) return null;
    return { content: backup.content, version: backup.version, fileId: backup.fileId };
  }
}
