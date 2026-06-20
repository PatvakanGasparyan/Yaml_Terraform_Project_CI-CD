import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationHistory, FixHistory } from '../../entities';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { OfflineValidationService } from './offline-validation.service';
import { AiModule } from '../ai/ai.module';
import { VersionsModule } from '../versions/versions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ValidationHistory, FixHistory]),
    AiModule,
    VersionsModule,
    NotificationsModule,
    ActivityModule,
  ],
  controllers: [ValidationController],
  providers: [ValidationService, OfflineValidationService],
  exports: [ValidationService, OfflineValidationService],
})
export class ValidationModule {}
