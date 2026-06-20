import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InfrastructureDiagram } from '../../entities';
import { OpenAIModule } from '../../services/openai';
import { AuditModule } from '../audit/audit.module';
import { DiagramsService } from './diagrams.service';
import { DiagramsController } from './diagrams.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InfrastructureDiagram]), OpenAIModule, AuditModule],
  controllers: [DiagramsController],
  providers: [DiagramsService],
  exports: [DiagramsService],
})
export class DiagramsModule {}
