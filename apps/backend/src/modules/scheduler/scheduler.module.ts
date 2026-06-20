import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledJob } from '../../entities';
import { ValidationModule } from '../validation/validation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ExternalNotificationsModule } from '../external-notifications/external-notifications.module';
import { ActivityModule } from '../activity/activity.module';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledJob]),
    ValidationModule,
    NotificationsModule,
    ExternalNotificationsModule,
    ActivityModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
