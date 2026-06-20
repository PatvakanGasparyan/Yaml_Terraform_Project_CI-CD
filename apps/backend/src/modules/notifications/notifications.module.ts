import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../entities';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), forwardRef(() => ActivityModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
