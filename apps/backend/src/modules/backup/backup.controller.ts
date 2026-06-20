import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BackupService } from './backup.service';

@ApiTags('Backup')
@Controller('backup')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get(':fileId')
  list(@Param('fileId') fileId: string, @Req() req: { user: { id: string } }) {
    return this.backupService.listBackups(fileId, req.user.id);
  }

  @Post(':fileId')
  create(
    @Param('fileId') fileId: string,
    @Body() body: { content: string; version: number; label?: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.backupService.createSnapshot(req.user.id, fileId, body.content, body.version, body.label);
  }

  @Post('restore/:backupId')
  restore(@Param('backupId') backupId: string, @Req() req: { user: { id: string } }) {
    return this.backupService.restore(backupId, req.user.id);
  }
}
