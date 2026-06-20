import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, GithubAction, CommitMessage, PrReview } from '../../entities';
import { OpenAIModule } from '../../services/openai';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';
import { VersionsModule } from '../versions/versions.module';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GithubAction, CommitMessage, PrReview]),
    OpenAIModule,
    NotificationsModule,
    ActivityModule,
    VersionsModule,
  ],
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
