import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FavoriteRepository } from '../../entities';

@Injectable()
export class FavoritesService {
  constructor(@InjectRepository(FavoriteRepository) private readonly repo: Repository<FavoriteRepository>) {}

  async list(userId: string) {
    const items = await this.repo.find({ where: { userId }, order: { pinned: 'DESC', createdAt: 'DESC' } });
    return items.map((f) => ({
      id: f.id,
      repository: f.repository,
      defaultBranch: f.defaultBranch,
      pinned: f.pinned,
      createdAt: f.createdAt.toISOString(),
    }));
  }

  async add(userId: string, repository: string, defaultBranch?: string, pinned = false) {
    const existing = await this.repo.findOne({ where: { userId, repository } });
    if (existing) {
      await this.repo.update(existing.id, { pinned, defaultBranch });
      return { id: existing.id, repository, pinned };
    }
    const f = await this.repo.save({ id: uuidv4(), userId, repository, defaultBranch, pinned });
    return { id: f.id, repository: f.repository, pinned: f.pinned };
  }

  async remove(userId: string, id: string) {
    await this.repo.delete({ id, userId });
    return { success: true };
  }

  async togglePin(userId: string, id: string) {
    const f = await this.repo.findOne({ where: { id, userId } });
    if (!f) return null;
    f.pinned = !f.pinned;
    await this.repo.save(f);
    return { id: f.id, pinned: f.pinned };
  }
}
