import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { FixTemplate } from '../../entities';

@Injectable()
export class TemplatesService {
  constructor(@InjectRepository(FixTemplate) private readonly repo: Repository<FixTemplate>) {}

  async list(userId: string, category?: string) {
    const items = await this.repo.find({
      where: category ? { userId, category: category as FixTemplate['category'] } : { userId },
      order: { updatedAt: 'DESC' },
    });
    return items.map((t) => this.toInfo(t));
  }

  async create(userId: string, name: string, category: FixTemplate['category'], settings: Record<string, unknown>) {
    const t = await this.repo.save({ id: uuidv4(), userId, name, category, settings });
    return this.toInfo(t);
  }

  async update(userId: string, id: string, data: Partial<{ name: string; settings: Record<string, unknown> }>) {
    const t = await this.repo.findOne({ where: { id, userId } });
    if (!t) throw new NotFoundException('Template not found');
    Object.assign(t, data);
    await this.repo.save(t);
    return this.toInfo(t);
  }

  async delete(userId: string, id: string) {
    await this.repo.delete({ id, userId });
    return { success: true };
  }

  export(userId: string) {
    return this.repo.find({ where: { userId } }).then((items) =>
      items.map((t) => ({ name: t.name, category: t.category, settings: t.settings })),
    );
  }

  async import(userId: string, templates: Array<{ name: string; category: FixTemplate['category']; settings: Record<string, unknown> }>) {
    const created = [];
    for (const t of templates) {
      created.push(await this.create(userId, t.name, t.category, t.settings));
    }
    return created;
  }

  private toInfo(t: FixTemplate) {
    return {
      id: t.id,
      name: t.name,
      category: t.category,
      settings: t.settings,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
