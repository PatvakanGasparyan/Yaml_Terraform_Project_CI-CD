import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixTemplate } from '../../entities';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FixTemplate])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
