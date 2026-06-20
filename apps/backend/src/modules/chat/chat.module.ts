import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatHistory } from '../../entities';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatHistory]), AiModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
