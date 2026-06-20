import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { CreateFileDto, UpdateFileDto } from './dto/files.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'List user files' })
  list(@Req() req: { user: { id: string } }, @Query('projectId') projectId?: string) {
    return this.filesService.findByUser(req.user.id, projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file by ID' })
  get(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.filesService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create/upload file' })
  create(@Body() dto: CreateFileDto, @Req() req: { user: { id: string } }) {
    return this.filesService.create(req.user.id, dto.name, dto.content, dto.projectId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update file content' })
  update(@Param('id') id: string, @Body() dto: UpdateFileDto, @Req() req: { user: { id: string } }) {
    return this.filesService.update(id, req.user.id, dto.content);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file' })
  delete(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.filesService.delete(id, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get file version history' })
  versions(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.filesService.getVersions(id, req.user.id);
  }

  @Get(':id/compare')
  @ApiOperation({ summary: 'Compare two versions' })
  compare(
    @Param('id') id: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.filesService.compareVersions(id, parseInt(v1), parseInt(v2), req.user.id);
  }
}
