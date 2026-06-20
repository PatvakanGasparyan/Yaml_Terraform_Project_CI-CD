import { Module } from '@nestjs/common';
import { OpenAIModule } from '../../services/openai';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [OpenAIModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
