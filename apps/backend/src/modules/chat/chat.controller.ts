import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  getSessions(@Req() req: { user: { id: string } }) {
    return this.chatService.getSessions(req.user.id);
  }

  @Get('sessions/:sessionId')
  getSession(@Param('sessionId') sessionId: string, @Req() req: { user: { id: string } }) {
    return this.chatService.getSession(req.user.id, sessionId);
  }

  @Post('message')
  sendMessage(@Body() dto: SendMessageDto, @Req() req: { user: { id: string } }) {
    const sessionId = dto.sessionId || uuidv4();
    return this.chatService.sendMessage(
      req.user.id,
      sessionId,
      dto.message,
      dto.fileContext,
      dto.fileId,
    );
  }
}
