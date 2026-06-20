import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_USER_SETTINGS } from '@iac-platform/shared';
import { Settings } from '../../entities';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Settings) private readonly settingsRepo: Repository<Settings>) {}

  async get(userId: string) {
    let settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.settingsRepo.save({
        id: uuidv4(),
        userId,
        ...DEFAULT_USER_SETTINGS,
      });
    }
    return settings;
  }

  async update(userId: string, data: Partial<Settings>) {
    await this.get(userId);
    const settings = await this.settingsRepo.findOne({ where: { userId } });
    if (!settings) return null;
    Object.assign(settings, data);
    return this.settingsRepo.save(settings);
  }
}
