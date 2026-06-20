import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerraformPlan, TerraformPlanApproval, TerraformStateSnapshot } from '../../entities';
import { TerraformService } from './terraform.service';
import { TerraformController } from './terraform.controller';
import { ValidationModule } from '../validation/validation.module';
import { OpenAIModule } from '../../services/openai';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    ValidationModule,
    OpenAIModule,
    NotificationsModule,
    ActivityModule,
    TypeOrmModule.forFeature([TerraformPlan, TerraformPlanApproval, TerraformStateSnapshot]),
  ],
  controllers: [TerraformController],
  providers: [TerraformService],
  exports: [TerraformService],
})
export class TerraformModule {}
