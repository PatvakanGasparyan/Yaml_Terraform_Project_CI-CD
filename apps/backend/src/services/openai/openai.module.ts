import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiUsage } from '../../entities';
import { OpenAIClient } from './openai.client';
import { OpenAIService } from './openai.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ApiUsage])],
  providers: [OpenAIClient, OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
