import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ChatHistory } from '../../entities';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatHistory) private readonly chatRepo: Repository<ChatHistory>,
    private readonly aiService: AiService,
  ) {}

  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    fileContext?: string,
    fileId?: string,
  ) {
    await this.chatRepo.save({
      id: uuidv4(),
      userId,
      sessionId,
      fileId,
      role: 'user',
      content: message,
    });

    const history = await this.chatRepo.find({
      where: { userId, sessionId },
      order: { createdAt: 'ASC' },
      take: 20,
    });

    const response = await this.aiService.chat(
      history.map((h) => ({ role: h.role, content: h.content })),
      fileContext,
      userId,
    );

    const assistantMsg = await this.chatRepo.save({
      id: uuidv4(),
      userId,
      sessionId,
      fileId,
      role: 'assistant',
      content: response,
    });

    return {
      message: assistantMsg,
      sessionId,
    };
  }

  async getSession(userId: string, sessionId: string) {
    return this.chatRepo.find({
      where: { userId, sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async getSessions(userId: string) {
    const messages = await this.chatRepo
      .createQueryBuilder('chat')
      .select('DISTINCT chat.session_id', 'sessionId')
      .addSelect('MAX(chat.created_at)', 'lastMessage')
      .where('chat.user_id = :userId', { userId })
      .groupBy('chat.session_id')
      .orderBy('lastMessage', 'DESC')
      .getRawMany();

    return messages;
  }
}
