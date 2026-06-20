import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecentFilesService } from './recent-files.service';

@ApiTags('Recent Files')
@Controller('recent-files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecentFilesController {
  constructor(private readonly service: RecentFilesService) {}

  @Get()
  list(@Req() req: { user: { id: string } }) {
    return this.service.list(req.user.id);
  }

  @Post()
  track(
    @Body() body: { fileName: string; format: string; fileId?: string; projectId?: string; lastAction?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.service.track(req.user.id, body.fileName, body.format, body);
  }
}
