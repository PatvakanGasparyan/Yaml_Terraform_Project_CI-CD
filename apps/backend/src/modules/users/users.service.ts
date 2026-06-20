import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  async updateProfile(id: string, data: { name?: string; avatarUrl?: string }) {
    await this.userRepo.update(id, data);
    return this.findById(id);
  }
}
