import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { FilesModule } from './modules/files/files.module';
import { ValidationModule } from './modules/validation/validation.module';
import { AiModule } from './modules/ai/ai.module';
import { TerraformModule } from './modules/terraform/terraform.module';
import { YamlModule } from './modules/yaml/yaml.module';
import { ConversionModule } from './modules/conversion/conversion.module';
import { GithubModule } from './modules/github/github.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HistoryModule } from './modules/history/history.module';
import { ChatModule } from './modules/chat/chat.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { BackupModule } from './modules/backup/backup.module';
import { ExportModule } from './modules/export/export.module';
import { OpenAIModule } from './services/openai';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityModule } from './modules/activity/activity.module';
import { VersionsModule } from './modules/versions/versions.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { RecentFilesModule } from './modules/recent-files/recent-files.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { TeamsModule } from './modules/teams/teams.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { ExternalNotificationsModule } from './modules/external-notifications/external-notifications.module';
import { DiagramsModule } from './modules/diagrams/diagrams.module';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'iac_user'),
        password: config.get('DB_PASSWORD', 'iac_password'),
        database: config.get('DB_DATABASE', 'iac_platform'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    RedisModule,
    OpenAIModule,
    AuditModule,
    ActivityModule,
    NotificationsModule,
    VersionsModule,
    FavoritesModule,
    TemplatesModule,
    RecentFilesModule,
    WorkflowModule,
    TeamsModule,
    SchedulerModule,
    ExternalNotificationsModule,
    DiagramsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    FilesModule,
    ValidationModule,
    AiModule,
    TerraformModule,
    YamlModule,
    ConversionModule,
    GithubModule,
    AnalyticsModule,
    HistoryModule,
    ChatModule,
    SettingsModule,
    StorageModule,
    ComplianceModule,
    BackupModule,
    ExportModule,
  ],
})
export class AppModule {}
