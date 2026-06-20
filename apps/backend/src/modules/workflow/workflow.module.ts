import { Module } from '@nestjs/common';
import { ValidationModule } from '../validation/validation.module';
import { GithubModule } from '../github/github.module';
import { VersionsModule } from '../versions/versions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';
import { RecentFilesModule } from '../recent-files/recent-files.module';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';

@Module({
  imports: [ValidationModule, GithubModule, VersionsModule, NotificationsModule, ActivityModule, RecentFilesModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
