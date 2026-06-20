import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ValidationModule } from '../validation/validation.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ValidationModule, AiModule],
  controllers: [ComplianceController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
