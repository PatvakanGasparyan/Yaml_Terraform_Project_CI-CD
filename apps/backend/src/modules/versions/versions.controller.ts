import { Controller, Get, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VersionsService } from './versions.service';

@ApiTags('Versions')
@Controller('versions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VersionsController {
  constructor(private readonly service: VersionsService) {}

  @Get()
  list(@Req() req: { user: { id: string } }, @Query('fileId') fileId?: string) {
    return this.service.list(req.user.id, fileId);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.get(req.user.id, id);
  }

  @Get(':id1/compare/:id2')
  compare(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.compare(req.user.id, id1, id2);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.service.restore(req.user.id, id);
  }
}
