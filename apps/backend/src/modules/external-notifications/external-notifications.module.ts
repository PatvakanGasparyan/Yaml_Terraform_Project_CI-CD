import { Module } from '@nestjs/common';
import { ExternalNotificationsService } from './external-notifications.service';
import { ExternalNotificationsController } from './external-notifications.controller';

@Module({
  controllers: [ExternalNotificationsController],
  providers: [ExternalNotificationsService],
  exports: [ExternalNotificationsService],
})
export class ExternalNotificationsModule {}
