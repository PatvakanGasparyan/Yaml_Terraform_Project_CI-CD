import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { detectFormat } from '@iac-platform/shared';
import { File, FileVersion } from '../../entities';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File) private readonly fileRepo: Repository<File>,
    @InjectRepository(FileVersion) private readonly versionRepo: Repository<FileVersion>,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, name: string, content: string, projectId?: string) {
    const format = detectFormat(name, content);
    const checksum = createHash('sha256').update(content).digest('hex');
    const storagePath = await this.storage.save(`${userId}/${uuidv4()}/${name}`, content);

    const file = await this.fileRepo.save({
      id: uuidv4(),
      userId,
      projectId,
      name,
      format,
      content,
      sizeBytes: Buffer.byteLength(content),
      storagePath,
      checksum,
      version: 1,
    });

    await this.versionRepo.save({
      id: uuidv4(),
      fileId: file.id,
      version: 1,
      content,
      checksum,
      createdBy: userId,
    });

    return file;
  }

  async findByUser(userId: string, projectId?: string) {
    const where: { userId: string; projectId?: string } = { userId };
    if (projectId) where.projectId = projectId;
    return this.fileRepo.find({ where, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string) {
    return this.fileRepo.findOne({ where: { id, userId } });
  }

  async update(id: string, userId: string, content: string) {
    const file = await this.findOne(id, userId);
    if (!file) return null;

    const newVersion = file.version + 1;
    const checksum = createHash('sha256').update(content).digest('hex');

    await this.versionRepo.save({
      id: uuidv4(),
      fileId: id,
      version: newVersion,
      content,
      checksum,
      createdBy: userId,
    });

    await this.fileRepo.update(id, {
      content,
      version: newVersion,
      checksum,
      sizeBytes: Buffer.byteLength(content),
    });

    return this.findOne(id, userId);
  }

  async getVersions(fileId: string, userId: string) {
    const file = await this.findOne(fileId, userId);
    if (!file) return [];
    return this.versionRepo.find({ where: { fileId }, order: { version: 'DESC' } });
  }

  async compareVersions(fileId: string, v1: number, v2: number, userId: string) {
    const file = await this.findOne(fileId, userId);
    if (!file) return null;

    const [version1, version2] = await Promise.all([
      this.versionRepo.findOne({ where: { fileId, version: v1 } }),
      this.versionRepo.findOne({ where: { fileId, version: v2 } }),
    ]);

    if (!version1 || !version2) return null;
    return { version1, version2 };
  }

  async delete(id: string, userId: string) {
    const file = await this.findOne(id, userId);
    if (!file) return false;
    if (file.storagePath) await this.storage.delete(file.storagePath);
    await this.fileRepo.delete(id);
    return true;
  }
}
