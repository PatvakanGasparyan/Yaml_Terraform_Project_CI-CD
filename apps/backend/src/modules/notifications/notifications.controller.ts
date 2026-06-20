import { Controller, Get, Put, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(
    @Req() req: { user: { id: string } },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('search') search?: string,
  ) {
    return this.service.list(req.user.id, { unreadOnly: unreadOnly === 'true', search });
  }

  @Get('unread-count')
  unreadCount(@Req() req: { user: { id: string } }) {
    return this.service.unreadCount(req.user.id);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.markRead(req.user.id, id);
  }

  @Put('read-all')
  markAllRead(@Req() req: { user: { id: string } }) {
    return this.service.markAllRead(req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.delete(req.user.id, id);
  }
}
