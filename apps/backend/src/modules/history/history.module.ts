import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ValidationHistory,
  FixHistory,
  Translation,
  File,
  GithubAction,
  ApiUsage,
} from '../../entities';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ValidationHistory, FixHistory, Translation, File, GithubAction, ApiUsage])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
