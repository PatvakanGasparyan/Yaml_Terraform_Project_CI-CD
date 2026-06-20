import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ValidationHistory,
  FixHistory,
  Translation,
  ApiUsage,
  File,
} from '../../entities';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ValidationHistory, FixHistory, Translation, ApiUsage, File])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
