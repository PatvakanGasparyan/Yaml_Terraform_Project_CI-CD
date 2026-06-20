import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import type { NotificationItem } from '@iac-platform/shared';
import { Notification } from '../../entities';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    private readonly activity: ActivityService,
  ) {}

  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<NotificationItem> {
    const n = await this.repo.save({
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      metadata,
      isRead: false,
    });
    const item = this.toItem(n);
    this.activity.emitToUser(userId, 'notification', item);
    return item;
  }

  async list(userId: string, filter?: { unreadOnly?: boolean; search?: string }) {
    const where: Record<string, unknown> = { userId };
    if (filter?.unreadOnly) where.isRead = false;
    const items = await this.repo.find({
      where: filter?.search
        ? [{ ...where, title: Like(`%${filter.search}%`) }, { ...where, message: Like(`%${filter.search}%`) }]
        : where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return items.map((n) => this.toItem(n));
  }

  async markRead(userId: string, id: string) {
    await this.repo.update({ id, userId }, { isRead: true });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  async delete(userId: string, id: string) {
    await this.repo.delete({ id, userId });
    return { success: true };
  }

  async unreadCount(userId: string) {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  private toItem(n: Notification): NotificationItem {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
