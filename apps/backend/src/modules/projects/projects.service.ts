import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../../entities';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(Project) private readonly projectRepo: Repository<Project>) {}

  async create(userId: string, name: string, description?: string) {
    return this.projectRepo.save({
      id: uuidv4(),
      userId,
      name,
      description,
    });
  }

  async findByUser(userId: string) {
    return this.projectRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      relations: ['files'],
    });
  }

  async findOne(id: string, userId: string) {
    return this.projectRepo.findOne({
      where: { id, userId },
      relations: ['files'],
    });
  }

  async update(id: string, userId: string, data: { name?: string; description?: string }) {
    await this.projectRepo.update({ id, userId }, data);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string) {
    const result = await this.projectRepo.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }
}
