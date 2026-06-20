import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExternalNotificationsService } from './external-notifications.service';

@ApiTags('External Notifications')
@Controller('notifications/external')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExternalNotificationsController {
  constructor(private readonly service: ExternalNotificationsService) {}

  @Get('channels')
  getChannels() {
    return this.service.getConfiguredChannels();
  }

  @Post('test')
  test(
    @Body() body: { email?: string; title: string; message: string; slack?: boolean; telegram?: boolean },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.sendAll(
      { title: body.title, message: body.message, userId: req.user.id },
      { email: body.email, slack: body.slack, telegram: body.telegram },
    );
  }
}
